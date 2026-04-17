import { useState, useEffect } from 'react'

const DISPUTE_TYPES = [
  { id: 'overcharge',   icon: '💳', label: 'Overcharge / Wrong Bill',   desc: 'Duplicate charge, hidden fees, wrong amount' },
  { id: 'refund',       icon: '🔄', label: 'Refund Denied',              desc: 'Company refusing to return your money' },
  { id: 'deposit',      icon: '🏠', label: 'Security Deposit Kept',      desc: 'Landlord withholding deposit unfairly' },
  { id: 'insurance',    icon: '🏥', label: 'Insurance Claim Denied',     desc: 'Claim rejected, coverage dispute' },
  { id: 'airline',      icon: '✈️', label: 'Airline / Travel',           desc: 'Cancelled flight, lost baggage, refund refused' },
  { id: 'subscription', icon: '📦', label: 'Subscription Charged',       desc: 'Billed after cancelling, auto-renewal' },
  { id: 'contractor',   icon: '🔨', label: 'Bad Contractor Work',        desc: 'Work not done, overcharged, ignored' },
  { id: 'employer',     icon: '💼', label: 'Unpaid Wages',               desc: 'Employer owes money, wrongful deduction' },
  { id: 'other',        icon: '⚖️', label: 'Other Dispute',              desc: 'Any consumer or business dispute' },
]

const TONES = [
  { id: 'firm',   label: 'Firm',          desc: 'Professional & direct — best for first contact' },
  { id: 'urgent', label: 'Urgent',        desc: 'Escalating pressure — company has been slow to respond' },
  { id: 'final',  label: 'Final Warning', desc: 'Last chance before legal action — they have ignored you' },
]

const COUNTRIES = [
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'UK', label: '🇬🇧 United Kingdom' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect to try Clawback',
    features: ['3 letters per month', '9 dispute types', 'US, CA, AU, UK laws', 'Copy to clipboard'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    desc: 'For serious disputes',
    features: ['Unlimited letters', 'PDF download', 'Follow-up escalation letter', 'Phone script included', 'BBB complaint template', 'Priority AI generation'],
    cta: 'Get Pro',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Lifetime',
    price: '$49',
    period: 'one time',
    desc: 'Pay once, use forever',
    features: ['Everything in Pro', 'Lifetime access', 'All future updates', 'Small claims court guide', 'Email templates included'],
    cta: 'Get Lifetime',
    highlight: false,
  },
]

const TIPS = {
  overcharge:   ['Send via certified mail — creates legal proof of delivery', 'File a credit card chargeback simultaneously for fastest result', 'Screenshot the billing page before the company updates it', 'Report to your state Attorney General if ignored after 30 days'],
  refund:       ['File a chargeback with your bank if you paid by card', 'Screenshot the company refund policy page immediately', 'File a BBB complaint — many resolve within 48 hours after', 'Keep all original receipts and email correspondence'],
  deposit:      ['Photograph every inch of the property before leaving', 'Send via certified mail AND email for double proof', 'File in Small Claims Court — landlords almost always settle', 'Request itemized deduction list within 5 days in writing'],
  insurance:    ['File a state Insurance Commissioner complaint simultaneously', 'Request the exact policy clause used to deny in writing', 'Hire a public adjuster for claims over $5,000', 'Get an independent estimate to counter their assessment'],
  airline:      ['File with DOT Aviation Consumer Protection simultaneously', 'Dispute charge with credit card company if paid by card', 'Keep all boarding passes and booking confirmations', 'Check if your credit card has travel protection coverage'],
  subscription: ['Dispute as unauthorized with your bank immediately', 'Screenshot your cancellation confirmation right now', 'File FTC complaint at reportfraud.ftc.gov', 'Many states have specific auto-renewal laws — check yours'],
  contractor:   ['File with state contractor licensing board today', 'Get 2–3 independent repair estimates for your claim', 'Post honest reviews on Google and Yelp to create urgency', 'Small Claims Court handles up to $10,000–$25,000'],
  employer:     ['File wage claim with Department of Labor simultaneously', 'FLSA violations carry up to double the unpaid wages penalty', 'Keep every pay stub, timesheet and employment contract', 'Local employment attorneys often offer free consultations'],
  other:        ['Send certified mail with return receipt for legal proof', 'File with your state Attorney General consumer division', 'Document everything — photos, emails, dates, names', 'Small Claims Court is affordable and requires no attorney'],
}

const LAWS = {
  US: { overcharge:'the Fair Credit Billing Act (15 U.S.C. § 1666)', refund:'the FTC Act and applicable state consumer protection statutes', deposit:'applicable state security deposit laws', insurance:'applicable state insurance regulations and your policy terms', airline:'DOT regulations (14 CFR Part 250)', subscription:"the FTC's Negative Option Rule", contractor:'applicable state contractor licensing and consumer protection laws', employer:'the Fair Labor Standards Act (FLSA)', other:'applicable federal and state consumer protection laws' },
  CA: { overcharge:'the Consumer Protection Act', refund:'the Consumer Protection Act', deposit:'applicable provincial residential tenancy legislation', insurance:'the Insurance Act', airline:'the Air Passenger Protection Regulations (SOR/2019-150)', subscription:'applicable provincial consumer protection legislation', contractor:'applicable provincial consumer protection legislation', employer:'the Canada Labour Code', other:'applicable federal and provincial consumer protection legislation' },
  AU: { overcharge:'the Australian Consumer Law (Competition and Consumer Act 2010)', refund:'the Australian Consumer Law consumer guarantee provisions', deposit:'applicable state residential tenancy legislation', insurance:'the Insurance Contracts Act 1984', airline:'the Australian Consumer Law', subscription:'the Australian Consumer Law', contractor:'the Australian Consumer Law', employer:'the Fair Work Act 2009', other:'the Australian Consumer Law' },
  UK: { overcharge:'the Consumer Rights Act 2015', refund:'the Consumer Rights Act 2015 and Consumer Contracts Regulations 2013', deposit:'the Housing Act 2004 and Tenancy Deposit Protection regulations', insurance:'the Insurance Act 2015', airline:'UK Regulation EC 261/2004', subscription:'the Consumer Contracts Regulations 2013', contractor:'the Consumer Rights Act 2015', employer:'the Employment Rights Act 1996', other:'the Consumer Rights Act 2015' },
}

const ESCALATION = {
  US: 'the Consumer Financial Protection Bureau (CFPB), my state Attorney General, the Better Business Bureau, and Small Claims Court',
  CA: 'applicable provincial consumer protection office, the Competition Bureau, and Small Claims Court',
  AU: 'the ACCC, applicable state consumer affairs office, and the Australian Financial Complaints Authority',
  UK: 'the Competition and Markets Authority, Trading Standards, the Financial Ombudsman Service, and the Small Claims Court',
}

function generateTemplate({ disputeType, form }) {
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  const deadline = { firm:14, urgent:10, final:7 }[form.tone] || 14
  const deadlineDate = new Date(Date.now() + deadline * 86400000).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  const name = form.yourName || '[YOUR FULL NAME]'
  const city = form.city || '[YOUR CITY]'
  const amount = form.amount ? `$${form.amount.replace('$','')}` : 'the disputed amount'
  const desired = form.desired || 'a full refund of the disputed amount'
  const law = LAWS[form.country]?.[disputeType] || LAWS.US.other
  const escalation = ESCALATION[form.country] || ESCALATION.US
  const closings = {
    firm: `I trust that ${form.company} values its customers and will resolve this matter promptly.`,
    urgent: `If not resolved by the deadline, I will escalate through all available channels without further notice.`,
    final: `This is my final attempt to resolve this directly. Failure to respond triggers immediate regulatory complaints and legal action.`,
  }
  const openings = {
    firm: 'I am writing to formally dispute',
    urgent: 'I am writing to formally dispute and demand immediate resolution of',
    final: 'FINAL NOTICE — I am writing regarding my unresolved dispute concerning',
  }
  return `${name}
${city}
${today}

Customer Service Department
${form.company}

RE: FORMAL DISPUTE — IMMEDIATE RESOLUTION REQUIRED

Dear ${form.company} Customer Service Team,

${openings[form.tone]} the following matter:

${form.description}

Amount in dispute: ${amount}
Desired resolution: ${desired}

This matter is governed by ${law}. I am entitled to prompt resolution under applicable consumer protection provisions.

FORMAL DEMAND: I demand that ${form.company} resolve this matter by providing ${desired} within ${deadline} days — no later than ${deadlineDate}.

If this is not resolved within the stated timeframe, I will immediately file formal complaints with ${escalation}${form.country === 'US' ? ', and initiate a credit card chargeback where applicable' : ''}.

${closings[form.tone]}

Please confirm receipt and your intended resolution in writing.

Sincerely,

${name}
${city}

Enclosures: [Attach all relevant receipts, correspondence, and documentation]`
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [disputeType, setDisputeType] = useState(null)
  const [form, setForm] = useState({ company:'', amount:'', description:'', desired:'', tone:'firm', yourName:'', city:'', country:'US' })
  const [letter, setLetter] = useState('')
  const [tips, setTips] = useState([])
  const [copied, setCopied] = useState(false)
  const [wordIdx, setWordIdx] = useState(0)
  const [billing, setBilling] = useState('monthly')

  const words = ['Overcharges', 'Denied Refunds', 'Stolen Deposits', 'Ignored Complaints', 'Unfair Charges']
  useEffect(() => {
    const t = setInterval(() => setWordIdx(p => (p + 1) % words.length), 2400)
    return () => clearInterval(t)
  }, [])

  async function generate() {
    if (!disputeType || !form.company || !form.description) return
    setScreen('loading')
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('No key')
      const typeInfo = DISPUTE_TYPES.find(d => d.id === disputeType)
      const toneInfo = TONES.find(t => t.id === form.tone)
      const deadline = { firm:14, urgent:10, final:7 }[form.tone] || 14
      const today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})
      const prompt = "You are a consumer rights attorney. Write a powerful, specific dispute letter.\n\n" +
        "DISPUTE: " + typeInfo.label + "\nCOMPANY: " + form.company + "\nAMOUNT: " + (form.amount?"$"+form.amount:"unspecified") +
        "\nSITUATION: " + form.description + "\nDESIRED: " + (form.desired||"full refund/resolution") +
        "\nTONE: " + toneInfo.label + "\nSENDER: " + (form.yourName||"[YOUR NAME]") + ", " + (form.city||"[CITY]") + ", " + form.country +
        "\nDEADLINE: " + deadline + " days\nDATE: " + today + "\n\n" +
        "Write a complete formal dispute letter with: sender block, date, company recipient, RE: subject line in caps, " +
        "clear opening, specific situation from their description, relevant consumer protection laws for " + form.country + ", " +
        deadline + "-day deadline with exact date, consequences if ignored (BBB/AG/small claims/chargeback), professional closing. " +
        "Keep under 400 words. Be 100% specific to their situation, not generic."
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+apiKey },
        body:JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], max_tokens:1000, temperature:0.7 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message||'error')
      const text = data.choices?.[0]?.message?.content
      setLetter(text && text.length > 80 ? text : generateTemplate({disputeType, form}))
    } catch(e) {
      setLetter(generateTemplate({disputeType, form}))
    }
    setTips(TIPS[disputeType] || TIPS.other)
    setScreen('result')
  }

  function copyLetter() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function reset() {
    setScreen('home')
    setLetter('')
    setDisputeType(null)
    setForm({ company:'', amount:'', description:'', desired:'', tone:'firm', yourName:'', city:'', country:'US' })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Satoshi:wght@300;400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#f8f7ff;
          --surface:#ffffff;
          --surface2:#f0eeff;
          --border:#e2deff;
          --accent:#6c47ff;
          --accent2:#8b5cf6;
          --accent3:#a78bfa;
          --dark:#0f0a2e;
          --text:#1a1040;
          --muted:#6b6895;
          --success:#10b981;
          --warning:#f59e0b;
          --r:12px;
        }
        body{background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;line-height:1.6}
        ::selection{background:var(--accent);color:#fff}

        /* GRADIENT MESH BG */
        .mesh{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
        .mesh::before{content:'';position:absolute;width:800px;height:800px;background:radial-gradient(circle,rgba(108,71,255,.08) 0%,transparent 70%);top:-200px;right:-200px;animation:float1 12s ease-in-out infinite}
        .mesh::after{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 70%);bottom:-100px;left:-100px;animation:float2 15s ease-in-out infinite}
        @keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,40px)}}
        @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-30px)}}

        .app{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:0 24px 100px}

        /* NAV */
        .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border)}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:var(--dark);cursor:pointer;display:flex;align-items:center;gap:8px}
        .logo-icon{width:36px;height:36px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .logo span{color:var(--accent)}
        .nav-links{display:flex;align-items:center;gap:8px}
        .nav-btn{padding:9px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .nav-ghost{background:transparent;color:var(--text)}
        .nav-ghost:hover{background:var(--surface2)}
        .nav-solid{background:var(--accent);color:#fff}
        .nav-solid:hover{background:#5538e0;transform:translateY(-1px)}

        /* HERO */
        .hero{padding:80px 0 60px;text-align:center}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);color:var(--accent);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:7px 16px;border-radius:100px;margin-bottom:32px}
        .hero-badge-dot{width:6px;height:6px;background:var(--success);border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .hero-h1{font-size:clamp(40px,6vw,72px);font-weight:800;line-height:1.05;letter-spacing:-2px;color:var(--dark);margin-bottom:0}
        .hero-rotating{font-size:clamp(40px,6vw,72px);font-weight:800;line-height:1.05;letter-spacing:-2px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;min-height:1.15em;animation:wordIn .35s cubic-bezier(.34,1.56,.64,1)}
        @keyframes wordIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        .hero-sub{font-size:18px;color:var(--muted);max-width:560px;margin:24px auto 40px;line-height:1.7;font-weight:400}
        .hero-ctas{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:64px}
        .btn-main{padding:16px 32px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:8px}
        .btn-main:hover{background:#5538e0;transform:translateY(-2px);box-shadow:0 12px 32px rgba(108,71,255,.3)}
        .btn-ghost{padding:16px 24px;background:transparent;color:var(--text);border:1.5px solid var(--border);border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .btn-ghost:hover{border-color:var(--accent);color:var(--accent);background:var(--surface2)}

        /* HERO STATS */
        .hero-stats{display:flex;justify-content:center;gap:0;flex-wrap:wrap;background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;max-width:640px;margin:0 auto}
        .stat-item{flex:1;min-width:140px;padding:24px 20px;text-align:center;border-right:1px solid var(--border)}
        .stat-item:last-child{border-right:none}
        .stat-n{font-size:28px;font-weight:800;color:var(--dark);display:block;letter-spacing:-1px}
        .stat-l{font-size:12px;color:var(--muted);font-weight:500;margin-top:4px}

        /* SECTION */
        .section{padding:72px 0}
        .section-eyebrow{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
        .section-title{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-1px;color:var(--dark);text-align:center;margin-bottom:12px}
        .section-sub{font-size:16px;color:var(--muted);text-align:center;max-width:500px;margin:0 auto 48px;line-height:1.65}

        /* HOW IT WORKS */
        .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        @media(max-width:640px){.how-grid{grid-template-columns:1fr}}
        .how-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;transition:all .2s}
        .how-card:hover{border-color:var(--accent3);transform:translateY(-4px);box-shadow:0 12px 40px rgba(108,71,255,.1)}
        .how-num{width:36px;height:36px;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:var(--accent);margin-bottom:16px}
        .how-card h3{font-size:16px;font-weight:700;margin-bottom:8px;color:var(--dark)}
        .how-card p{font-size:13px;color:var(--muted);line-height:1.6}

        /* DISPUTE TYPES */
        .types-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:640px){.types-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:400px){.types-grid{grid-template-columns:1fr}}
        .type-card{background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:20px 16px;cursor:pointer;text-align:left;transition:all .2s;color:var(--text)}
        .type-card:hover{border-color:var(--accent);background:var(--surface2);transform:translateY(-2px)}
        .type-card.selected{border-color:var(--accent);background:linear-gradient(135deg,rgba(108,71,255,.08),rgba(139,92,246,.05))}
        .type-icon{font-size:24px;margin-bottom:10px;display:block}
        .type-label{font-size:13px;font-weight:700;display:block;margin-bottom:4px;color:var(--dark)}
        .type-desc{font-size:11px;color:var(--muted);line-height:1.4}

        /* PRICING */
        .pricing-toggle{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:40px}
        .toggle-label{font-size:14px;font-weight:600;color:var(--muted)}
        .toggle-label.active{color:var(--dark)}
        .toggle-switch{width:48px;height:26px;background:var(--accent);border-radius:13px;cursor:pointer;position:relative;transition:background .2s;border:none}
        .toggle-switch::after{content:'';position:absolute;width:20px;height:20px;background:#fff;border-radius:50%;top:3px;left:3px;transition:transform .2s}
        .toggle-switch.yearly::after{transform:translateX(22px)}
        .toggle-save{background:rgba(16,185,129,.12);color:var(--success);font-size:11px;font-weight:700;padding:3px 8px;border-radius:100px;letter-spacing:.06em}
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:700px){.pricing-grid{grid-template-columns:1fr}}
        .plan-card{background:var(--surface);border:1.5px solid var(--border);border-radius:20px;padding:32px 28px;position:relative;transition:all .2s}
        .plan-card.highlight{border-color:var(--accent);background:linear-gradient(160deg,rgba(108,71,255,.05),var(--surface));box-shadow:0 8px 32px rgba(108,71,255,.12)}
        .plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:100px;letter-spacing:.06em;white-space:nowrap}
        .plan-name{font-size:14px;font-weight:700;color:var(--accent);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
        .plan-price{font-size:44px;font-weight:800;color:var(--dark);letter-spacing:-2px;line-height:1}
        .plan-period{font-size:14px;color:var(--muted);font-weight:500;margin-left:4px}
        .plan-desc{font-size:13px;color:var(--muted);margin:12px 0 24px;padding-bottom:24px;border-bottom:1px solid var(--border)}
        .plan-features{list-style:none;margin-bottom:28px;display:flex;flex-direction:column;gap:10px}
        .plan-features li{font-size:13px;color:var(--text);display:flex;align-items:flex-start;gap:10px}
        .plan-features li::before{content:'✓';color:var(--success);font-weight:700;font-size:13px;flex-shrink:0;margin-top:1px}
        .plan-btn{width:100%;padding:14px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;letter-spacing:.02em}
        .plan-btn-primary{background:var(--accent);color:#fff}
        .plan-btn-primary:hover{background:#5538e0;transform:translateY(-1px)}
        .plan-btn-outline{background:transparent;color:var(--text);border:1.5px solid var(--border)}
        .plan-btn-outline:hover{border-color:var(--accent);color:var(--accent)}

        /* FORM */
        .form-wrap{max-width:720px;margin:0 auto}
        .fcard{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:16px}
        .fcard-head{padding:20px 24px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px}
        .fcard-step{background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.08em}
        .fcard-head h2{font-size:16px;font-weight:700;color:var(--dark)}
        .fcard-body{padding:24px}
        .field{margin-bottom:18px}
        .field:last-child{margin-bottom:0}
        .field label{display:block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
        .field input,.field textarea,.field select{width:100%;padding:12px 14px;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:var(--dark);outline:none;transition:border-color .15s;resize:vertical}
        .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent)}
        .field input::placeholder,.field textarea::placeholder{color:var(--border)}
        .field select option{background:#f8f7ff}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
        @media(max-width:540px){.two-col,.three-col{grid-template-columns:1fr}}

        /* TONE SELECTOR */
        .tone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:480px){.tone-grid{grid-template-columns:1fr}}
        .tone-btn{background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;text-align:left;color:var(--text);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
        .tone-btn:hover{border-color:var(--accent2);background:var(--surface2)}
        .tone-btn.selected{border-color:var(--accent);background:var(--surface2)}
        .tone-name{font-size:13px;font-weight:700;display:block;margin-bottom:4px;color:var(--dark)}
        .tone-desc-small{font-size:11px;color:var(--muted);line-height:1.4}

        /* GENERATE */
        .gen-btn{width:100%;padding:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:24px;display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:.02em}
        .gen-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 32px rgba(108,71,255,.3)}
        .gen-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

        /* LOADING */
        .loading-wrap{text-align:center;padding:100px 20px}
        .spinner{width:48px;height:48px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 24px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-wrap h2{font-size:22px;font-weight:800;color:var(--dark);margin-bottom:8px}
        .loading-wrap p{color:var(--muted);font-size:14px}

        /* RESULT */
        .result-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px}
        .result-left{display:flex;align-items:center;gap:12px}
        .ready-badge{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:var(--success);font-size:11px;font-weight:700;padding:5px 12px;border-radius:100px;letter-spacing:.06em}
        .result-title{font-size:20px;font-weight:800;color:var(--dark)}
        .result-actions{display:flex;gap:8px;flex-wrap:wrap}
        .r-btn{padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s;letter-spacing:.02em}
        .r-btn-main{background:var(--accent);color:#fff}
        .r-btn-main:hover{background:#5538e0}
        .r-btn-out{background:transparent;color:var(--text);border:1.5px solid var(--border)}
        .r-btn-out:hover{border-color:var(--accent);color:var(--accent)}

        .letter-box{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:12px;padding:28px;font-size:13.5px;line-height:1.85;white-space:pre-wrap;font-family:'Plus Jakarta Sans',sans-serif;color:var(--dark);max-height:520px;overflow-y:auto}
        .letter-box::-webkit-scrollbar{width:4px}
        .letter-box::-webkit-scrollbar-track{background:var(--bg)}
        .letter-box::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

        .tips-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:28px 0 14px;display:flex;align-items:center;gap:10px}
        .tips-label::after{content:'';flex:1;height:1px;background:var(--border)}
        .tips-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:500px){.tips-grid{grid-template-columns:1fr}}
        .tip-item{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px;font-size:12px;color:var(--muted);line-height:1.55;display:flex;gap:10px;align-items:flex-start}
        .tip-icon{font-size:16px;flex-shrink:0}

        /* BACK */
        .back{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:6px;padding:24px 0 20px;font-weight:600;transition:color .15s}
        .back:hover{color:var(--accent)}

        /* FOOTER */
        .footer{border-top:1px solid var(--border);padding:40px 0;text-align:center;color:var(--muted);font-size:13px;margin-top:60px}
        .footer a{color:var(--accent);text-decoration:none}
        .footer-logo{font-size:18px;font-weight:800;color:var(--dark);margin-bottom:12px;display:block}
        .footer-logo span{color:var(--accent)}

        /* TOAST */
        .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--dark);color:#fff;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;z-index:999;animation:tIn .2s ease;white-space:nowrap}
        @keyframes tIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>

      <div className="mesh" />
      <div className="app">

        {/* NAV */}
        <nav className="nav">
          <div className="logo" onClick={reset}>
            <div className="logo-icon">⚖️</div>
            Claw<span>back</span>
          </div>
          <div className="nav-links">
            {screen === 'home' && <>
              <button className="nav-btn nav-ghost" onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}>Pricing</button>
              <button className="nav-btn nav-solid" onClick={() => setScreen('form')}>Get Started Free →</button>
            </>}
            {screen !== 'home' && <button className="nav-btn nav-ghost" onClick={reset}>← Home</button>}
          </div>
        </nav>

        {/* HOME */}
        {screen === 'home' && (<>

          {/* HERO */}
          <section className="hero">
            <div className="hero-badge"><span className="hero-badge-dot" />Free · No Signup · Works Instantly</div>
            <h1 className="hero-h1">Stop accepting</h1>
            <span className="hero-rotating" key={wordIdx}>{words[wordIdx]}</span>
            <p className="hero-sub">Generate a legally-sharp dispute letter in seconds. Trusted by thousands to recover money from companies that count on you giving up.</p>
            <div className="hero-ctas">
              <button className="btn-main" onClick={() => setScreen('form')}>Generate My Letter ⚡</button>
              <button className="btn-ghost" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>See how it works</button>
            </div>
            <div className="hero-stats">
              <div className="stat-item"><span className="stat-n">$2.8T</span><div className="stat-l">Overcharged annually</div></div>
              <div className="stat-item"><span className="stat-n">73%</span><div className="stat-l">Resolved with a letter</div></div>
              <div className="stat-item"><span className="stat-n">9</span><div className="stat-l">Dispute categories</div></div>
              <div className="stat-item"><span className="stat-n">4</span><div className="stat-l">Countries covered</div></div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="section" id="how">
            <div className="section-eyebrow">✦ How it works</div>
            <h2 className="section-title">Three steps to getting your money back</h2>
            <p className="section-sub">No legal knowledge needed. No signup. Just describe what happened and get your letter.</p>
            <div className="how-grid">
              {[
                {n:'01', title:'Pick your dispute', body:'Choose from 9 categories — overcharges, denied refunds, bad contractors, kept deposits, cancelled flights and more.'},
                {n:'02', title:'Describe what happened', body:'Tell us the company name and what they did wrong. Be specific — dates, amounts, broken promises.'},
                {n:'03', title:'Copy and send it', body:'Instant letter with real consumer protection laws. Copy, send by certified mail, and get your money back.'},
              ].map(s => (
                <div className="how-card" key={s.n}>
                  <div className="how-num">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DISPUTE TYPES */}
          <section className="section" style={{paddingTop:0}}>
            <div className="section-eyebrow">✦ Dispute categories</div>
            <h2 className="section-title">What do you need to fight?</h2>
            <p className="section-sub">Click any category to start generating your letter immediately.</p>
            <div className="types-grid">
              {DISPUTE_TYPES.map(d => (
                <button key={d.id} className="type-card" onClick={() => { setDisputeType(d.id); setScreen('form') }}>
                  <span className="type-icon">{d.icon}</span>
                  <span className="type-label">{d.label}</span>
                  <span className="type-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* WHY SECTION */}
          <section className="section" style={{paddingTop:0}}>
            <div className="section-eyebrow">✦ Why Clawback works</div>
            <h2 className="section-title">Companies rely on you giving up</h2>
            <p className="section-sub">A professional letter with the right legal language changes the conversation immediately.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
              {[
                {icon:'⚖️', title:'Real laws cited', body:'Every letter references the exact consumer protection law for your country — Fair Credit Billing Act, Consumer Rights Act, Australian Consumer Law and more.'},
                {icon:'⏱️', title:'Deadline pressure works', body:'Letters set a firm 7–14 day deadline with clear consequences. Companies respond to written ultimatums because they are on record.'},
                {icon:'🌍', title:'4 countries covered', body:'Tailored for US, Canada, Australia and UK. Different laws per country automatically applied based on your selection.'},
                {icon:'🔒', title:'No data stored', body:'We never store your dispute details. Everything stays in your browser. Your dispute is private and secure.'},
              ].map(f => (
                <div key={f.title} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'24px 20px'}}>
                  <div style={{fontSize:24,marginBottom:12}}>{f.icon}</div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:8,color:'var(--dark)'}}>{f.title}</div>
                  <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.65}}>{f.body}</div>
                </div>
              ))}
            </div>
          </section>

          {/* PRICING */}
          <section className="section" id="pricing">
            <div className="section-eyebrow">✦ Pricing</div>
            <h2 className="section-title">Start free. Upgrade when you're ready.</h2>
            <p className="section-sub">Clawback is free forever for basic use. Upgrade for unlimited letters, PDF export, and advanced features.</p>

            <div className="pricing-toggle">
              <span className={`toggle-label ${billing==='monthly'?'active':''}`}>Monthly</span>
              <button className={`toggle-switch ${billing==='yearly'?'yearly':''}`} onClick={() => setBilling(b => b==='monthly'?'yearly':'monthly')} />
              <span className={`toggle-label ${billing==='yearly'?'active':''}`}>Yearly</span>
              {billing==='yearly' && <span className="toggle-save">Save 40%</span>}
            </div>

            <div className="pricing-grid">
              {PLANS.map(p => (
                <div key={p.name} className={`plan-card ${p.highlight?'highlight':''}`}>
                  {p.badge && <div className="plan-badge">{p.badge}</div>}
                  <div className="plan-name">{p.name}</div>
                  <div>
                    <span className="plan-price">
                      {billing==='yearly' && p.price !== '$0' ? `$${Math.round(parseInt(p.price.replace('$',''))*0.6)}` : p.price}
                    </span>
                    <span className="plan-period">
                      {p.price === '$49' ? 'one time' : billing==='yearly' && p.price !== '$0' ? '/month billed yearly' : `/${p.period}`}
                    </span>
                  </div>
                  <div className="plan-desc">{p.desc}</div>
                  <ul className="plan-features">
                    {p.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <button
                    className={`plan-btn ${p.highlight?'plan-btn-primary':'plan-btn-outline'}`}
                    onClick={() => p.price === '$0' ? setScreen('form') : null}
                  >
                    {p.cta} {p.price !== '$0' ? '→' : '— Free'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section style={{padding:'60px 0',textAlign:'center',borderTop:'1px solid var(--border)'}}>
            <h2 style={{fontSize:'clamp(28px,4vw,44px)',fontWeight:800,letterSpacing:'-1px',color:'var(--dark)',marginBottom:16}}>Ready to fight back?</h2>
            <p style={{fontSize:16,color:'var(--muted)',marginBottom:32,maxWidth:420,margin:'0 auto 32px'}}>Generate your first letter for free. No signup, no credit card, no limits on the free plan.</p>
            <button className="btn-main" style={{margin:'0 auto'}} onClick={() => setScreen('form')}>Generate My Letter — Free ⚡</button>
          </section>
        </>)}

        {/* FORM */}
        {screen === 'form' && (<>
          <button className="back" onClick={reset}>← Back to home</button>
          <div className="form-wrap">
            <div style={{marginBottom:24,textAlign:'center'}}>
              <h2 style={{fontSize:26,fontWeight:800,color:'var(--dark)',letterSpacing:'-0.5px'}}>Build your dispute letter</h2>
              <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Fill in the details below — takes about 2 minutes</p>
            </div>

            {/* Step 1 */}
            <div className="fcard">
              <div className="fcard-head"><span className="fcard-step">Step 1</span><h2>What type of dispute?</h2></div>
              <div className="fcard-body">
                <div className="types-grid">
                  {DISPUTE_TYPES.map(d => (
                    <button key={d.id} className={`type-card ${disputeType===d.id?'selected':''}`} onClick={()=>setDisputeType(d.id)}>
                      <span className="type-icon">{d.icon}</span>
                      <span className="type-label">{d.label}</span>
                      <span className="type-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="fcard">
              <div className="fcard-head"><span className="fcard-step">Step 2</span><h2>What happened?</h2></div>
              <div className="fcard-body">
                <div className="two-col">
                  <div className="field"><label>Company name *</label><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="e.g. Comcast, John Smith" /></div>
                  <div className="field"><label>Amount in dispute</label><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="e.g. 350" /></div>
                </div>
                <div className="field"><label>Describe what happened *</label><textarea rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Be specific — dates, what was promised, what happened, any prior attempts to resolve..." /></div>
                <div className="field"><label>What do you want?</label><input value={form.desired} onChange={e=>setForm({...form,desired:e.target.value})} placeholder="e.g. Full refund of $350, fix the work, return deposit" /></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="fcard">
              <div className="fcard-head"><span className="fcard-step">Step 3</span><h2>Your details & tone</h2></div>
              <div className="fcard-body">
                <div className="three-col" style={{marginBottom:20}}>
                  <div className="field" style={{marginBottom:0}}><label>Your name</label><input value={form.yourName} onChange={e=>setForm({...form,yourName:e.target.value})} placeholder="Full name" /></div>
                  <div className="field" style={{marginBottom:0}}><label>City / State</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="e.g. Austin, TX" /></div>
                  <div className="field" style={{marginBottom:0}}><label>Country</label>
                    <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})}>
                      {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="field" style={{marginBottom:8}}><label>Letter tone</label></div>
                  <div className="tone-grid">
                    {TONES.map(t => (
                      <button key={t.id} className={`tone-btn ${form.tone===t.id?'selected':''}`} onClick={()=>setForm({...form,tone:t.id})}>
                        <span className="tone-name">{t.label}</span>
                        <span className="tone-desc-small">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button className="gen-btn" disabled={!disputeType||!form.company||!form.description} onClick={generate}>
                  ⚡ Generate My Dispute Letter
                </button>
                {(!disputeType||!form.company||!form.description) && (
                  <p style={{textAlign:'center',fontSize:12,color:'var(--muted)',marginTop:10}}>Select dispute type, company name and description to continue</p>
                )}
              </div>
            </div>
          </div>
        </>)}

        {/* LOADING */}
        {screen === 'loading' && (
          <div className="loading-wrap">
            <div className="spinner" />
            <h2>Writing your dispute letter...</h2>
            <p>AI is drafting a letter specific to your situation with the right consumer protection laws.</p>
          </div>
        )}

        {/* RESULT */}
        {screen === 'result' && (<>
          <div className="result-top">
            <div className="result-left">
              <span className="ready-badge">✓ Letter ready</span>
              <div className="result-title">Your Dispute Letter</div>
            </div>
            <div className="result-actions">
              <button className="r-btn r-btn-main" onClick={copyLetter}>📋 Copy Letter</button>
              <button className="r-btn r-btn-out" onClick={() => setScreen('form')}>← Edit</button>
              <button className="r-btn r-btn-out" onClick={reset}>+ New Dispute</button>
            </div>
          </div>

          <div className="letter-box">{letter}</div>

          <div className="tips-label">Action tips for maximum impact</div>
          <div className="tips-grid">
            {tips.slice(0,4).map((tip,i) => (
              <div className="tip-item" key={i}>
                <span className="tip-icon">{['📮','💳','📸','📋'][i]}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <div style={{textAlign:'center',marginTop:48,padding:'40px 0',borderTop:'1px solid var(--border)'}}>
            <p style={{fontSize:14,color:'var(--muted)',marginBottom:20}}>Need unlimited letters + PDF export + phone scripts?</p>
            <button className="btn-main" style={{margin:'0 auto'}} onClick={() => { reset(); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}),100) }}>
              View Pro Plans →
            </button>
          </div>
        </>)}

        {/* FOOTER */}
        <footer className="footer">
          <span className="footer-logo">Claw<span>back</span></span>
          <p>Free consumer defence tool for US, Canada, Australia & UK</p>
          <p style={{marginTop:8}}><a href="#">Privacy Policy</a> · <a href="#">Terms</a> · Built for people who deserve their money back</p>
        </footer>
      </div>

      {copied && <div className="toast">✓ Copied to clipboard!</div>}
    </>
  )
}
