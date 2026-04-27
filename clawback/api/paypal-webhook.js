const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const event = req.body
    const eventType = event.event_type
    const resource = event.resource

    console.log('PayPal webhook received:', eventType)

    // Subscription activated — user just paid
    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subscriptionId = resource.id
      const planId = resource.plan_id
      const subscriberEmail = resource.subscriber?.email_address

      // Determine plan name from plan ID
      let plan = 'free'
      if (planId === 'P-7WY25743FR981970CNHXA6YA') plan = 'starter'
      if (planId === 'P-3ST50384YB0447319NHXCFHA') plan = 'starter'
      if (planId === 'P-7G147704T62286325NHXCHAQ') plan = 'pro'
      if (planId === 'P-04S201706U470614GNHXCH6A') plan = 'pro'

      // Calculate expiry — 31 days for monthly, 366 for yearly
      const isYearly = planId === 'P-3ST50384YB0447319NHXCFHA' || planId === 'P-04S201706U470614GNHXCH6A'
      const days = isYearly ? 366 : 31
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      // Save to subscriptions table
      await supabase.from('subscriptions').upsert({
        email: subscriberEmail,
        plan,
        paypal_subscription_id: subscriptionId,
        expires_at: expiresAt,
        status: 'active'
      }, { onConflict: 'email' })

      // Update profiles table
      await supabase.from('profiles').upsert({
        email: subscriberEmail,
        plan
      }, { onConflict: 'email' })

      console.log(`Activated ${plan} for ${subscriberEmail} until ${expiresAt}`)
    }

    // Subscription cancelled or expired — downgrade to free
    if (
      eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ||
      eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
    ) {
      const subscriptionId = resource.id
      const subscriberEmail = resource.subscriber?.email_address

      // Update subscriptions table
      await supabase.from('subscriptions').upsert({
        email: subscriberEmail,
        plan: 'free',
        paypal_subscription_id: subscriptionId,
        expires_at: new Date().toISOString(),
        status: 'cancelled'
      }, { onConflict: 'email' })

      // Downgrade profiles table to free
      await supabase.from('profiles').upsert({
        email: subscriberEmail,
        plan: 'free'
      }, { onConflict: 'email' })

      console.log(`Downgraded ${subscriberEmail} to free plan`)
    }

    // Payment failed — suspend after retry period
    if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      const subscriberEmail = resource.subscriber?.email_address
      console.log(`Payment failed for ${subscriberEmail}`)
      // PayPal will retry automatically — we wait for SUSPENDED event
    }

    return res.status(200).json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
