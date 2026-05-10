import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const EMAILJS_SERVICE_ID = 'service_766pdfq'
const EMAILJS_TEMPLATE_ID = 'template_9ek8vp9'
const EMAILJS_PUBLIC_KEY = '6-zCJMjbPblCneoR4'

async function sendWelcomeEmail(email, name, plan) {
  const features = plan === 'pro'
    ? '\u2713 Unlimited letters\n\u2713 PDF download\n\u2713 Phone script generator\n\u2713 Follow-up escalation letter\n\u2713 BBB complaint template\n\u2713 Small claims court guide\n\u2713 Priority email support'
    : '\u2713 Unlimited letters\n\u2713 PDF download\n\u2713 Phone script generator\n\u2713 Follow-up escalation letter'

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

export default async function handler(req, res) {
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
      if (planId === 'P-12033585TE841814UNIAAUAA') plan = 'starter' // Starter Monthly $9
      if (planId === 'P-42640058UL843601DNIAAWGI') plan = 'starter' // Starter Yearly $79
      if (planId === 'P-0PA781130S622624PNIAAX2Q') plan = 'pro'     // Pro Monthly $19
      if (planId === 'P-04S201706U470614GNHXCH6A') plan = 'pro'     // Pro Yearly $149

      const isYearly = planId === 'P-42640058UL843601DNIAAWGI' || planId === 'P-04S201706U470614GNHXCH6A'
      const days = isYearly ? 366 : 31
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('subscriptions').upsert({
        email: subscriberEmail,
        plan,
        paypal_subscription_id: subscriptionId,
        expires_at: expiresAt,
        status: 'active'
      }, { onConflict: 'email' })

      // Use update (not upsert) — profile row already exists from sign-in
      await supabase.from('profiles')
        .update({ plan })
        .eq('email', subscriberEmail)

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

      // Use update (not upsert) — profile row already exists
      await supabase.from('profiles')
        .update({ plan: 'free' })
        .eq('email', subscriberEmail)

      console.log(`Downgraded ${subscriberEmail} to free`)
    }

    return res.status(200).json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
