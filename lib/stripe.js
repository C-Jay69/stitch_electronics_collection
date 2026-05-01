import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
export default stripe

export const PRICE_IDS = {
  free: process.env.STRIPE_FREE_PRICE_ID,
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
}

export function priceToPlanKey(priceId) {
  for (const [k, v] of Object.entries(PRICE_IDS)) if (v === priceId) return k
  return null
}

export async function ensureCustomer(db, user) {
  if (user.stripeCustomerId) return user.stripeCustomerId
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { user_id: user.id },
  })
  await db.collection('users').updateOne({ id: user.id }, { $set: { stripeCustomerId: customer.id } })
  return customer.id
}

export async function applySubscriptionToUser(db, userId, subscription) {
  // subscription is a Stripe Subscription object
  const item = subscription.items?.data?.[0]
  const priceId = item?.price?.id
  const plan = priceToPlanKey(priceId) || 'unknown'
  const status = subscription.status
  // Handle both timestamp (number) and ISO string forms
  const periodEndTs = subscription.current_period_end || item?.current_period_end
  const currentPeriodEnd = periodEndTs ? new Date(periodEndTs * 1000) : null
  const isPremiumPlan = plan === 'monthly' || plan === 'yearly'
  const tier = (isPremiumPlan && ['active','trialing'].includes(status)) ? 'premium' : 'free'
  const sub = {
    tier,
    status,
    plan,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd,
    cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
  }
  await db.collection('users').updateOne({ id: userId }, { $set: { subscription: sub } })
  return sub
}

export async function clearSubscription(db, userId) {
  await db.collection('users').updateOne({ id: userId }, {
    $set: { subscription: { tier: 'free', status: 'canceled', plan: null, stripeSubscriptionId: null, stripePriceId: null, currentPeriodEnd: null, cancelAtPeriodEnd: false } }
  })
}
