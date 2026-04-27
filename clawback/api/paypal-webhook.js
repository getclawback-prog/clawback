const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const EMAILJS_SERVICE_ID = 'service_766pdfq'
const EMAILJS_TEMPLATE_ID = 'template_9ek8vp9'
const EMAILJS_PUBLIC_KEY = '6-zCJMjbPblCneoR4'

async function sendWelcomeEmail(email, name, plan) {
  const features = plan === 'pro'
    ? '✓ Unlimited letters\n✓ PDF download\n✓ Phone script generator\n✓ Follow-up escalation letter\n✓ BBB complaint template\n✓ Small claims court guide\n✓ Priority email support'
    : '✓ Unlimited letters\n✓ PDF download\n✓ Phone script generator\n✓ Follow-up escalation letter'

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          name: name || email.split('@')[0],
          plan: plan.charAt(0).toUpperCase() + plan.slice(1),
          features,
        }
      })
    })
    console.log('Email sent:', res.status)
  } catch(e) {
    console.log('Email error:', e.message)
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const event = req.body
    const eventType = event.event_type
    const resource = event.resource

    console.log('PayPal webhook received:', eventType)

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subscriptionId = resource.id
      const planId = resource.plan_id
      const subscriberEmail = resource.subscriber?.email_address
      const subscriberName = resource.subscriber?.name?.given_name || ''

      let plan = 'free'
      if (planId === 'P-7WY25743FR981970CNHXA6YA') plan = 'starter'
      if (planId === 'P-3ST50384YB0447319NHXCFHA') plan = 'starter'
      if (planId === 'P-7G147704T62286325NHXCHAQ') plan = 'pro'
      if (planId === 'P-04S201706U470614GNHXCH6A') plan = 'pro'

      const isYearly = planId === 'P-3ST50384YB0447319NHXCFHA' || planId === 'P-04S201706U470614GNHXCH6A'
      const days = isYearly ? 366 : 31
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('subscriptions').upsert({
        email: subscriberEmail,
        plan,
        paypal_subscription_id: subscriptionId,
        expires_at: expiresAt,
        status: 'active'
      }, { onConflict: 'email' })

      await supabase.from('profiles').upsert({
        email: subscriberEmail,
        plan
      }, { onConflict: 'email' })

      await sendWelcomeEmail(subscriberEmail, subscriberName, plan)

      console.log(`Activated ${plan} for ${subscriberEmail}`)
    }

    if (
      eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ||
      eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
    ) {
      const subscriptionId = resource.id
      const subscriberEmail = resource.subscriber?.email_address

      await supabase.from('subscriptions').upsert({
        email: subscriberEmail,
        plan: 'free',
        paypal_subscription_id: subscriptionId,
        expires_at: new Date().toISOString(),
        status: 'cancelled'
      }, { onConflict: 'email' })

      await supabase.from('profiles').upsert({
        email: subscriberEmail,
        plan: 'free'
      }, { onConflict: 'email' })

      console.log(`Downgraded ${subscriberEmail} to free`)
    }

    return res.status(200).json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
