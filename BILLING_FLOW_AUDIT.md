# Complete Billing Flow Audit

## Executive Summary

This document traces the complete lifecycle of a subscription from initial purchase through dashboard display, identifying all data sources and potential loss points.

**Status**: ✅ **FIXED** - All critical issues resolved

---

## Step 1: User Clicks Plan

### Location
- **File**: [`src/components/dashboard/BillingPlans.tsx`](../src/components/dashboard/BillingPlans.tsx)
- **Component**: `BillingPlans`
- **Function**: `handleSubscribe()`
- **Event Handler**: `onClick={() => handleSubscribe(plan.priceId, plan.name)}`

### Authentication Verification
```typescript
const { status } = useSession()  // Line 51

if (status === 'unauthenticated') {
  window.location.assign('/auth/login')
  return
}
```
✅ **Verified**: User must be authenticated

### Data Captured
```typescript
{
  priceId: string      // Stripe price ID (price_...)
  billingCycle: 'monthly' | 'yearly'  // From UI toggle
}
```

### Request Made
```typescript
POST /api/stripe/checkout
Content-Type: application/json
{
  "priceId": "price_...",
  "billingCycle": "monthly"
}
```

### Data Source
- **User Authentication**: `useSession()` hook (NextAuth React client)
- **Price ID**: User selection from plan card
- **Billing Cycle**: UI toggle state

**Log Output**:
```
[BillingPlans] Checkout initiated: { priceId, billingCycle }
```

---

## Step 2: Checkout Session Created

### Location
- **File**: [`src/app/api/stripe/checkout/route.ts`](../src/app/api/stripe/checkout/route.ts)
- **Route**: `POST /api/stripe/checkout`
- **Handler**: `POST(request)`

### Authentication & Validation
```typescript
const session = await getServerSession(authOptions as any)
const userId = session?.user?.id        // JWT token
const userEmail = session?.user?.email  // JWT token

// Verification
if (!userId || !userEmail) {
  return 401 "Authentication required"
}

if (!priceId || !validatePriceId(priceId)) {
  return 400 "Invalid price selection"
}
```
✅ **Verified**: Server-side auth required, price validated against whitelist

### User Record Lookup
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }  // From JWT token
})

// Verify email consistency
if (user.email !== userEmail) {
  return 403 "User email mismatch"
}
```
✅ **Verified**: User exists in database, email matches JWT

### Stripe Customer Linking
```typescript
let stripeCustomerId = user.stripeCustomerId

if (!stripeCustomerId) {
  // CREATE NEW STRIPE CUSTOMER
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined
  })
  
  stripeCustomerId = customer.id
  
  // LINK TO DATABASE USER
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId }
  })
}
```

### Data Sources
| Field | Source | Verified |
|-------|--------|----------|
| `userId` | NextAuth JWT | ✅ Server-side |
| `userEmail` | NextAuth JWT | ✅ Server-side |
| `stripeCustomerId` | Prisma User table | ✅ Database |
| `priceId` | Request body | ✅ Whitelist validated |

### Checkout Session Creation
```typescript
const checkoutSession = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  customer: stripeCustomerId,              // ← USER-STRIPE LINK
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${appUrl}/billing/success`,
  cancel_url: `${appUrl}/billing/cancel`,
  subscription_data: {
    metadata: {
      userId: user.id,                      // ← CRITICAL: userId in metadata
      billingCycle: requestBody.billingCycle
    }
  }
})
```

### Response
```json
{
  "url": "https://checkout.stripe.com/pay/cs_..."
}
```

**Log Output**:
```
[Checkout] Request validated { userId, userEmail, priceId }
[Checkout] User lookup complete { userId, stripeCustomerId, hasCustomerId }
[Checkout] Created new Stripe customer { userId, customerId }
[Checkout] Checkout session created { sessionId, userId, customerId, priceId }
```

---

## Step 3: Stripe Payment Succeeds

### What Happens
1. User completes payment in Stripe Checkout
2. Stripe creates `Subscription` object with:
   - ID: `sub_...`
   - Customer: `cus_...` (previously set)
   - Status: `active`
   - Items: `[{ price: price_... }]`
   - Metadata: `{ userId: user_id, billingCycle: monthly }`

### No Application Action Yet
⚠️ **Data is stored in Stripe, not in our database yet**

---

## Step 4: Subscription Record Created (Webhook Processing)

### Trigger Event
Stripe sends webhook event:
```
POST https://yourdomain.com/api/stripe/webhooks
X-Stripe-Signature: t=...,v1=...

{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_...",
      "subscription": "sub_...",
      "customer": "cus_...",
      "payment_status": "paid"
    }
  }
}
```

### Webhook Handler
- **File**: [`src/app/api/stripe/webhooks/route.ts`](../src/app/api/stripe/webhooks/route.ts)
- **Route**: `POST /api/stripe/webhooks`
- **Handler**: `POST(request)`

### Signature Verification
```typescript
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET  // REQUIRED

const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET  // Validates signature
)
```
✅ **Fixed**: Now REQUIRED (was optional)
- If invalid: `return 401 "Webhook verification failed"`
- If missing secret: `throw new Error("...")`

### Event Processing: checkout.session.completed
```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  
  // 1. Extract subscription ID
  const subscriptionId = session.subscription
  
  // 2. Retrieve full subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // 3. Extract critical data
  const userId = subscription.metadata.userId        // ← FROM METADATA
  const priceId = subscription.items.data[0].price.id  // ← FROM STRIPE
  const status = subscription.status                 // ← FROM STRIPE
  const currentPeriodStart = subscription.current_period_start
  const currentPeriodEnd = subscription.current_period_end
  
  // 4. Upsert to database
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000)
    },
    update: {
      stripePriceId: priceId,
      status,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000)
    }
  })
}
```

### Data Sources
| Field | Source | Verified |
|-------|--------|----------|
| `stripeSubscriptionId` | Stripe object | ✅ Event data |
| `userId` | `subscription.metadata.userId` | ✅ Set in checkout |
| `stripePriceId` | `subscription.items[0].price.id` | ✅ Stripe API |
| `status` | `subscription.status` | ✅ Stripe API |
| `currentPeriodStart` | `subscription.current_period_start` | ✅ Stripe API |
| `currentPeriodEnd` | `subscription.current_period_end` | ✅ Stripe API |

### Database Insertion
```sql
INSERT INTO "Subscription" (
  id, userId, stripeSubscriptionId, stripePriceId, 
  status, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt
) VALUES (
  'cuid()', 'user_123', 'sub_...', 'price_...',
  'active', '2025-06-05 14:00:00', '2025-07-05 14:00:00',
  NOW(), NOW()
)
```

**Log Output**:
```
[Webhook] Signature verified for event: checkout.session.completed (evt_...)
[Webhook] Upserted subscription: sub_... for user: user_123 with status: active
[Webhook] Handled checkout.session.completed: cs_...
```

---

## Step 5: Dashboard Reads Subscription Data

### Location
- **File**: [`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx)
- **Component**: `DashboardPage`
- **Route**: `GET /dashboard`

### Server-Side Rendering
```typescript
export default async function DashboardPage() {
  // 1. Verify authentication
  const session = await requireUser()  // Redirects if no session
  const userId = session?.user?.id
  
  console.log('[Dashboard] Page rendered for user:', { userId, email: session?.user?.email })
  
  // 2. Query subscriptions from database
  const subscriptions = userId
    ? await prisma.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    : []
  
  console.log('[Dashboard] Subscriptions fetched:', { userId, count: subscriptions.length })
}
```

### Authentication Check
✅ **Verified**: `requireUser()` enforces authentication
```typescript
// src/lib/requireAuth.ts
export async function requireUser() {
  const session = await getServerSession(authOptions as any) as Session | null
  if (!session?.user) {
    redirect('/auth/login')  // ← Redirects unauthenticated users
  }
  return session
}
```

### Data Display
```tsx
{subscriptions.length === 0 ? (
  <div>No subscriptions found</div>
) : (
  <div className="grid gap-6">
    {subscriptions.map((subscription) => (
      <SubscriptionCard key={subscription.id} subscription={subscription} />
    ))}
  </div>
)}
```

### SubscriptionCard Component
- **File**: [`src/components/dashboard/SubscriptionCard.tsx`](../src/components/dashboard/SubscriptionCard.tsx)
- **Props**: `subscription: Subscription` (from Prisma)

Displays:
- Plan Name (derived from `stripePriceId`)
- Current Status
- Renewal Date (`currentPeriodEnd`)
- Created Date

---

## Data Loss Analysis

### ❌ Critical Issues Fixed

#### 1. **Webhook Secret Optional** 
**Status**: ✅ **FIXED**
- **Before**: `if (STRIPE_WEBHOOK_SECRET) { verify } else { skip }`
- **After**: `throw new Error("Stripe webhook secret is not configured")`
- **Impact**: Prevents unsigned webhook processing

#### 2. **No Subscription Deleted Handler**
**Status**: ✅ **FIXED**
- **Before**: Only handled `created` and `updated`
- **After**: Added `customer.subscription.deleted` handler
- **Code**:
```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object
  await prisma.subscription.delete({
    where: { stripeSubscriptionId: subscription.id }
  })
}
```
- **Impact**: Cleans up database when user cancels

#### 3. **Sign Out Redirects to Login (Not Landing)**
**Status**: ✅ **FIXED**
- **Before**: `signOut({ callbackUrl: '/auth/login' })`
- **After**: `signOut({ callbackUrl: '/', redirect: true })`
- **File**: [`src/app/dashboard/signout-button.tsx`](../src/app/dashboard/signout-button.tsx)
- **Impact**: User returns to landing page, not login page

#### 4. **Dashboard Access After Sign Out**
**Status**: ✅ **FIXED**
- **Mechanism**: `requireUser()` on every dashboard load
- **Result**: After sign out, session is invalid, redirect triggered
- **Flow**: `POST /auth/logout → delete session → GET /dashboard → redirect to /auth/login`

#### 5. **Subscription Data Not Updating on Dashboard**
**Status**: ✅ **FIXED**
- **Causes**: 
  1. Webhook race condition (takes 2-5 seconds)
  2. No cache revalidation
- **Solution**:
  - Success page waits 3 seconds before redirect
  - Calls `/api/revalidate` to clear cache
  - Dashboard uses `cache: 'no-store'` on fetch
- **Files Modified**:
  - [`src/app/billing/success/page.tsx`](../src/app/billing/success/page.tsx)
  - [`src/app/api/revalidate/route.ts`](../src/app/api/revalidate/route.ts)

---

## Data Flow Summary Table

| Step | Component | Handler | User Source | Customer Source | Subscription Source |
|------|-----------|---------|-------------|-----------------|---------------------|
| 1 | BillingPlans | `handleSubscribe()` | `useSession()` JWT | - | - |
| 2 | Checkout API | `POST()` | NextAuth JWT | `user.stripeCustomerId` | Created in Stripe |
| 3 | Stripe | (external) | - | `cus_...` (linked) | `sub_...` created |
| 4 | Webhook | `handleCheckoutSessionCompleted()` | `subscription.metadata.userId` | From Stripe object | `subscription.id` |
| 5 | Dashboard | `DashboardPage()` | `session?.user?.id` | (not needed) | Prisma query |

---

## Verification Checklist

- ✅ Checkout requires authentication
- ✅ Authenticated user ID passed through checkout
- ✅ Stripe customer linked to database user
- ✅ Subscription records persisted in PostgreSQL
- ✅ Dashboard reads from PostgreSQL
- ✅ Webhooks exist and update subscription status
- ✅ Webhook signature verification required
- ✅ Subscription deleted event handled
- ✅ Sign out redirects to landing page
- ✅ Dashboard enforces authentication
- ✅ Dashboard refreshes after subscription change
- ✅ Detailed logging at each step

---

## Testing Instructions

See [WEBHOOK_TESTING.md](./WEBHOOK_TESTING.md) for complete testing guide.

### Quick Test
```bash
# 1. Start dev server
npm run dev

# 2. Start Stripe CLI listener
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# 3. Trigger test event
stripe trigger checkout.session.completed

# 4. Check logs and database
SELECT * FROM "Subscription" ORDER BY "createdAt" DESC LIMIT 1;
```

---

## Logs During Complete Flow

```
# Step 1: User clicks plan
[BillingPlans] Checkout initiated

# Step 2: Server processes checkout
[Checkout] Request validated { userId, userEmail, priceId }
[Checkout] User lookup complete { userId, stripeCustomerId }
[Checkout] Checkout session created { sessionId, userId, priceId }

# Step 3: User completes payment (no logs - happens in Stripe)

# Step 4: Webhook processes subscription
[Webhook] Signature verified for event: checkout.session.completed
[Webhook] Upserted subscription: sub_... for user: user_... with status: active

# Step 5: User sees success page (3-second wait)
# Calls: POST /api/revalidate
# Redirects: GET /dashboard

[Dashboard] Page rendered for user: { userId, email }
[Dashboard] Subscriptions fetched: { userId, count: 1 }
```

---

## Production Deployment Checklist

- [ ] Set `STRIPE_WEBHOOK_SECRET` in environment
- [ ] Register webhook endpoint in Stripe Dashboard
- [ ] Verify all event types are handled
- [ ] Test with real payment (use test card)
- [ ] Monitor logs for webhook failures
- [ ] Setup database backups
- [ ] Configure alert on webhook errors
- [ ] Test sign out flow
- [ ] Verify dashboard access control
- [ ] Load test webhook processing
