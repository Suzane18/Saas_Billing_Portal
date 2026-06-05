# Stripe Webhook Setup & Testing Guide

## Environment Variables Required

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...  # Required in production
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

## Webhook Endpoint

**URL**: `https://yourdomain.com/api/stripe/webhooks`

**Method**: POST

## Handled Events

1. **checkout.session.completed** - Creates subscription record when payment succeeds
2. **customer.subscription.created** - Creates subscription record if webhook arrives first
3. **customer.subscription.updated** - Updates subscription status, period, price
4. **customer.subscription.deleted** - Removes subscription record from database

## Data Flow per Event

### checkout.session.completed
```
Stripe Checkout Session
  ├─ subscription_id
  └─ customer_id

Webhook Handler
  ├─ Validates signature
  ├─ Retrieves subscription from Stripe
  ├─ Reads userId from subscription.metadata.userId
  ├─ Reads price from subscription.items[0].price.id
  └─ Upserts to Prisma Subscription table

Database Update
  ├─ stripeSubscriptionId: subscription.id
  ├─ stripePriceId: price.id
  ├─ status: subscription.status
  ├─ currentPeriodStart: timestamp
  ├─ currentPeriodEnd: timestamp
  └─ userId: from metadata
```

## Testing with Stripe CLI

### 1. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop install stripe

# Linux
# https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe Account
```bash
stripe login
```

### 3. Forward Webhook Events to Local Server
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This command will:
- Output a webhook signing secret
- Forward all webhook events to your local endpoint
- Show event logs in terminal

### 4. Test Checkout Session
```bash
stripe trigger checkout.session.completed
```

### 5. Monitor Logs
Watch your terminal output:
```bash
# CLI shows: 
# 2025-06-05 14:23:45 checkout.session.completed [evt_...]

# Your server logs:
# [Webhook] Signature verified for event: checkout.session.completed (evt_...)
# [Webhook] Upserted subscription: sub_... for user: user_id with status: active
```

## Testing Subscription Events

### Test Subscription Created
```bash
stripe trigger customer.subscription.created
```

### Test Subscription Updated
```bash
stripe trigger customer.subscription.updated
```

### Test Subscription Deleted
```bash
stripe trigger customer.subscription.deleted
```

## Database Verification

After webhook processes, verify data:

```sql
-- Check subscription was created
SELECT * FROM "Subscription" WHERE id = 'sub_...';

-- Expected columns:
-- id, userId, stripeSubscriptionId, stripePriceId, status, 
-- currentPeriodStart, currentPeriodEnd, createdAt, updatedAt

-- Check user still has stripeCustomerId
SELECT id, email, "stripeCustomerId" FROM "User" WHERE id = 'user_id';
```

## Production Checklist

- [ ] STRIPE_WEBHOOK_SECRET set in environment (required, not optional)
- [ ] Webhook URL registered in Stripe Dashboard
- [ ] Signature verification enabled (not bypassed)
- [ ] Database backups configured
- [ ] Monitoring/alerting on webhook failures
- [ ] Idempotency tested (resend same event twice)
- [ ] All event types tested (created, updated, deleted)
- [ ] Subscription metadata includes userId in all scenarios
- [ ] Dashboard refreshes after 3-second delay
- [ ] Sign out redirects to landing page (not login)
- [ ] Cache revalidation working

## Debugging Webhook Issues

### Webhook Not Received
```bash
# Check if endpoint is accessible
curl -v https://yourdomain.com/api/stripe/webhooks

# Check webhook endpoints in Stripe Dashboard
# Settings → Webhooks → Your endpoint

# Verify signing secret matches
echo $STRIPE_WEBHOOK_SECRET
```

### Signature Verification Failed
```
Error: webhook verification failed

Causes:
1. STRIPE_WEBHOOK_SECRET mismatch
2. Webhook secret rotated in Stripe Dashboard
3. Endpoint modified in transit

Fix:
1. Copy exact signing secret from Stripe Dashboard
2. Update .env.local
3. Restart server
4. Re-trigger event
```

### Subscription Not Created
```
Check logs for:
1. "[Webhook] Missing userId in metadata"
   Fix: Verify checkout session subscription_data includes userId

2. "[Webhook] Upserted subscription" (not shown)
   Fix: Check if webhook secret is configured

3. "Webhook verification failed"
   Fix: Validate signature matches
```

### Dashboard Still Shows Old Subscription
```
Causes:
1. Webhook not processed yet
2. Cache not revalidated
3. Browser cache
4. Database not updated

Fix:
1. Check webhook logs for errors
2. Verify database row was inserted
3. Clear browser cache (Ctrl+Shift+Del)
4. Wait 3-5 seconds for webhook
5. Manually refresh dashboard
```

## Event Schema Examples

### checkout.session.completed
```json
{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_...",
      "customer": "cus_...",
      "subscription": "sub_...",
      "payment_status": "paid"
    }
  }
}
```

### customer.subscription.created
```json
{
  "id": "evt_...",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "status": "active",
      "metadata": {
        "userId": "user_...",
        "billingCycle": "monthly"
      },
      "items": {
        "data": [
          {
            "price": {
              "id": "price_..."
            }
          }
        ]
      }
    }
  }
}
```

### customer.subscription.deleted
```json
{
  "id": "evt_...",
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "metadata": {
        "userId": "user_..."
      }
    }
  }
}
```

## Quick Start: Local Testing

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **In another terminal, start Stripe CLI listener**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   # Copy the signing secret output
   ```

3. **Update .env.local**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_test_... # from CLI output
   ```

4. **Restart dev server** (to pick up new env var)

5. **Trigger test event**
   ```bash
   stripe trigger checkout.session.completed
   ```

6. **Check logs**
   - CLI shows: ▶ checkout.session.completed
   - Server shows: [Webhook] Signature verified...
   - Database: New subscription created

7. **Test dashboard**
   - Visit http://localhost:3000/dashboard
   - Should show new subscription (after 3-5 seconds)
