import prisma from './prisma'

const PRICE_AMOUNT_MAP: Record<string, number> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 29,
  [process.env.STRIPE_PRICE_STARTER_YEARLY ?? '']: 290,
  [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '']: 79,
  [process.env.STRIPE_PRICE_PRO_YEARLY ?? '']: 790,
  [process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '']: 199,
  [process.env.STRIPE_PRICE_BUSINESS_YEARLY ?? '']: 1990,
}

export function getEstimatedRevenue(priceId: string | null | undefined) {
  if (!priceId) return 0
  return PRICE_AMOUNT_MAP[priceId] ?? 0
}

export async function getAdminOverviewData() {
  const [totalUsers, totalSubscriptions, activeSubscriptions, churnCount, recentUsers, recentSubscriptions, subscriptions] = await prisma.$transaction([
    prisma.user.count(),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'canceled' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, email: true, createdAt: true } }),
    prisma.subscription.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, stripePriceId: true, status: true, currentPeriodEnd: true, createdAt: true } }),
    prisma.subscription.findMany({ select: { stripePriceId: true, status: true } }),
  ])

  const lifetimeRevenue = subscriptions.reduce((sum, subscription) => sum + getEstimatedRevenue(subscription.stripePriceId), 0)
  const monthlyRevenue = subscriptions
    .filter((subscription) => subscription.status === 'active')
    .reduce((sum, subscription) => sum + getEstimatedRevenue(subscription.stripePriceId), 0)

  const statusCounts = subscriptions.reduce<Record<string, number>>((acc, subscription) => {
    acc[subscription.status] = (acc[subscription.status] ?? 0) + 1
    return acc
  }, {})

  return {
    totalUsers,
    totalSubscriptions,
    totalSubscribers: activeSubscriptions,
    activeSubscriptions,
    monthlyRevenue,
    lifetimeRevenue,
    churnCount,
    statusCounts,
    recentUsers,
    recentSubscriptions,
  }
}

export async function getAdminUsers({
  page = 1,
  pageSize = 20,
  search,
}: {
  page?: number
  pageSize?: number
  search?: string
}) {
  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        subscriptions: {
          orderBy: { currentPeriodEnd: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total }
}

export async function getAdminSubscriptions({
  page = 1,
  pageSize = 20,
  status,
  search,
  sortBy = 'currentPeriodEnd',
  sortOrder = 'desc',
}: {
  page?: number
  pageSize?: number
  status?: string
  search?: string
  sortBy?: 'currentPeriodStart' | 'currentPeriodEnd' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}) {
  const where: any = {}
  if (status) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { stripeSubscriptionId: { contains: search, mode: 'insensitive' } },
      { stripePriceId: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const sortField = ['currentPeriodStart', 'currentPeriodEnd', 'status', 'createdAt'].includes(sortBy)
    ? sortBy
    : 'currentPeriodEnd'

  const [subscriptions, total, totalSubscriptions, activeSubscriptions, canceledSubscriptions, expiredSubscriptions, upcomingRenewals] = await prisma.$transaction([
    prisma.subscription.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.subscription.count({ where }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'canceled' } }),
    prisma.subscription.count({ where: { status: { not: 'active' }, currentPeriodEnd: { lt: new Date() } } }),
    prisma.subscription.count({
      where: {
        status: 'active',
        currentPeriodEnd: { gte: new Date(), lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return {
    subscriptions,
    total,
    summary: {
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions,
      expiredSubscriptions,
      upcomingRenewals,
    },
  }
}

export async function getAdminAnalyticsData() {
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)

  const [signups, activeByStatus, recentSubscriptions] = await prisma.$transaction([
    prisma.user.findMany({
      where: { createdAt: { gte: threeMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.subscription.groupBy({
      by: ['status'],
      orderBy: { status: 'asc' },
      _count: { id: true },
    }),
    prisma.subscription.findMany({
      where: { createdAt: { gte: threeMonthsAgo } },
      select: { createdAt: true, stripePriceId: true, status: true },
    }),
  ])

  const signupsByMonth = signups.reduce<Record<string, number>>((acc, item) => {
    const month = item.createdAt.toISOString().slice(0, 7)
    acc[month] = (acc[month] ?? 0) + 1
    return acc
  }, {})

  const subscriptionsByStatus = activeByStatus.reduce<Record<string, number>>((acc, item) => {
    const count = typeof item._count === 'object' && item._count !== null ? item._count.id ?? 0 : 0
    acc[item.status] = count
    return acc
  }, {})

  const monthlyRevenueTrend = recentSubscriptions.reduce<Record<string, number>>((acc, item) => {
    const month = item.createdAt.toISOString().slice(0, 7)
    acc[month] = (acc[month] ?? 0) + getEstimatedRevenue(item.stripePriceId)
    return acc
  }, {})

  return {
    signupsByMonth,
    subscriptionsByStatus,
    monthlyRevenueTrend,
  }
}
