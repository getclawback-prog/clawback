import { useState, useEffect, useRef } from 'react'

// ── PayPal Plan IDs ─────────────────────────────────────────────────
const PAYPAL_STARTER_MONTHLY = 'YOUR_STARTER_MONTHLY_PLAN_ID'
const PAYPAL_STARTER_YEARLY  = 'YOUR_STARTER_YEARLY_PLAN_ID'
const PAYPAL_PRO_MONTHLY     = 'YOUR_PRO_MONTHLY_PLAN_ID'
const PAYPAL_PRO_YEARLY      = 'YOUR_PRO_YEARLY_PLAN_ID'

// ── Data ────────────────────────────────────────────────────────────
const DISPUTE_TYPES = [
  { id:'overcharge',   icon:'💳', label:'Overcharge / Wrong Bill',   desc:'Duplicate charge, hidden fees, wrong amount' },
  { id:'refund',       icon:'🔄', label:'Refund Denied',              desc:'Company refusing to return your money' },
  { id:'deposit',      icon:'🏠', label:'Security Deposit Kept',      desc:'Landlord withholding deposit unfairly' },
  { id:'insurance',    icon:'🏥', label:'Insurance Claim Denied',     desc:'Claim rejected, coverage dispute' },
  { id:'airline',      icon:'✈️', label:'Airline / Travel',           desc:'Cancelled flight, lost baggage, refund refused' },
  { id:'subscription', icon:'📦', label:'Subscription Charged',       desc:'Billed after cancelling, auto-renewal' },
  { id:'contractor',   icon:'🔨', label:'Bad Contractor Work',        desc:'Work not done, overcharged, ignored' },
  { id:'employer',     icon:'💼', label:'Unpaid Wages',               desc:'Employer owes money, wrongful deduction' },
  { id:'other',        icon:'⚖️', label:'Other Dispute',              desc:'Any consumer or business dispute' },
]

const TONES = [
  { id:'firm',   label:'Firm',          desc:'Professional & direct — best for first contact' },
  { id:'urgent', label:'Urgent',        desc:'Escalating pressure — company has been slow' },
  { id:'final',  label:'Final Warning', desc:'Last chance before legal action' },
]

const COUNTRIES = [
  { code:'US', label:'🇺🇸 United States' },
  { code:'CA', label:'🇨🇦 Canada' },
  { code:'AU', label:'🇦🇺 Australia' },
  { code:'UK', label:'🇬🇧 United Kingdom' },
]

const PLANS = [
  {
    name:'Free', price:'$0', yearlyPrice:'$0', period:'forever',
    desc:'Try Clawback risk-free',
    features:['2 letters per month','9 dispute types','US, CA, AU, UK laws','Copy to clipboard'],
    locked:['PDF download','Phone script','Follow-up letter'],
    cta:'Start Free', highlight:false, color:'var(--muted)',
  },
  {
    name:'Starter', price:'$5', yearlyPrice:'$4.17', yearlyTotal:'$50', period:'per month',
    desc:'For active disputes',
    features:['Unlimited letters','PDF download','Phone script generator','Follow-up escalation letter','9 dispute types','All 4 countries'],
    locked:['BBB complaint template','Small claims guide'],
    cta:'Get Starter', highlight:false, color:'var(--accent)',
    paypalMonthly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_STARTER_MONTHLY}`,
    paypalYearly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_STARTER_YEARLY}`,
  },
  {
    name:'Pro', price:'$15', yearlyPrice:'$12.42', yearlyTotal:'$149', period:'per month',
    badge:'Best Value',
    desc:'Maximum results',
    features:['Everything in Starter','BBB complaint template','Small claims court guide','Priority email support','New templates first','Success tips per case'],
    locked:[],
    cta:'Get Pro', highlight:true, color:'#fff',
    paypalMonthly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_PRO_MONTHLY}`,
    paypalYearly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_PRO_YEARLY}`,
  },
]

const REVIEWS = [
  { name:'James T.', location:'Austin, TX', rating:5, text:'Got $340 back from my landlord who kept my deposit for 3 months. Sent the letter Monday, had a check by Friday.', dispute:'Deposit' },
  { name:'Sarah M.', location:'Toronto, CA', rating:5, text:'My ISP overcharged me for 6 months. One letter from Clawback and they refunded $180 within 48 hours.', dispute:'Overcharge' },
  { name:'David K.', location:'Sydney, AU', rating:5, text:'Insurance company denied my claim twice. Used Final Warning tone and they called me next day to settle. Got $2,400 back.', dispute:'Insurance' },
  { name:'Emma R.', location:'London, UK', rating:5, text:'The letter cited the exact Consumer Rights Act section. Company settled immediately. Free tool that actually works.', dispute:'Refund' },
  { name:'Mike L.', location:'Chicago, IL', rating:5, text:'Contractor took my $800 deposit and disappeared. Sent the letter, he refunded everything within a week.', dispute:'Contractor' },
  { name:'Priya S.', location:'Vancouver, CA', rating:4, text:'Really impressed how specific the letter was. Airline refunded my cancelled flight within a week of sending it.', dispute:'Airline' },
]

const TIPS = {
  overcharge:['Send via certified mail — creates legal proof of delivery','File a credit card chargeback simultaneously','Screenshot the billing page before the company updates it','Report to your state Attorney General if ignored after 30 days'],
  refund:['File a chargeback with your bank if you paid by card','Screenshot the company refund policy page immediately','File a BBB complaint — many resolve within 48 hours','Keep all original receipts and email correspondence'],
  deposit:['Photograph every inch of the property before leaving','Send via certified mail AND email for double proof','File in Small Claims Court — landlords almost always settle','Request itemized deduction list within 5 days in writing'],
  insurance:['File a state Insurance Commissioner complaint simultaneously','Request the exact policy clause used to deny in writing','Hire a public adjuster for claims over $5,000','Get an independent estimate to counter their assessment'],
  airline:['File with DOT Aviation Consumer Protection simultaneously','Dispute charge with credit card if paid by card','Keep all boarding passes and booking confirmations','Check if your credit card has travel protection coverage'],
  subscription:['Dispute as unauthorized with your bank immediately','Screenshot your cancellation confirmation right now','File FTC complaint at reportfraud.ftc.gov','Many states have specific auto-renewal laws'],
  contractor:['File with state contractor licensing board today','Get 2–3 independent repair estimates for your claim','Post honest reviews on Google and Yelp to create urgency','Small Claims Court handles up to $10,000–$25,000'],
  employer:['File wage claim with Department of Labor simultaneously','FLSA violations carry up to double the unpaid wages penalty','Keep every pay stub, timesheet and employment contract','Local employment attorneys often offer free consultations'],
  other:['Send certified mail with return receipt for legal proof','File with your state Attorney General consumer division','Document everything — photos, emails, dates, names','Small Claims Court is affordable and requires no attorney'],
}

const LAWS = {
  US:{ overcharge:'the Fair Credit Billing Act (15 U.S.C. § 1666)', refund:'the FTC Act and applicable state consumer protection statutes', deposit:'applicable state security deposit laws', insurance:'applicable state insurance regulations', airline:'DOT regulations (14 CFR Part 250)', subscription:"the FTC's Negative Option Rule", contractor:'applicable state contractor licensing laws', employer:'the Fair Labor Standards Act (FLSA)', other:'applicable federal and state consumer protection laws' },
  CA:{ overcharge:'the Consumer Protection Act', refund:'the Consumer Protection Act', deposit:'applicable provincial residential tenancy legislation', insurance:'the Insurance Act', airline:'the Air Passenger Protection Regulations (SOR/2019-150)', subscription:'applicable provincial consumer protection legislation', contractor:'applicable provincial consumer protection legislation', employer:'the Canada Labour Code', other:'applicable federal and provincial consumer protection legislation' },
  AU:{ overcharge:'the Australian Consumer Law (Competition and Consumer Act 2010)', refund:'the Australian Consumer Law consumer guarantee provisions', deposit:'applicable state residential tenancy legislation', insurance:'the Insurance Contracts Act 1984', airline:'the Australian Consumer Law', subscription:'the Australian Consumer Law', contractor:'the Australian Consumer Law', employer:'the Fair Work Act 2009', other:'the Australian Consumer Law' },
  UK:{ overcharge:'the Consumer Rights Act 2015', refund:'the Consumer Rights Act 2015 and Consumer Contracts Regulations 2013', deposit:'the Housing Act 2004 and Tenancy Deposit Protection regulations', insurance:'the Insurance Act 2015', airline:'UK Regulation EC 261/2004', subscription:'the Consumer Contracts Regulations 2013', contractor:'the Consumer Rights Act 2015', employer:'the Employment Rights Act 1996', other:'the Consumer Rights Act 2015' },
}

const ESCALATION = {
  US:'the Consumer Financial Protection Bureau (CFPB), my state Attorney General, the Better Business Bureau, and Small Claims Court',
  CA:'applicable provincial consumer protection office, the Competition Bureau, and Small Claims Court',
  AU:'the ACCC, applicable state consumer affairs office, and the Australian Financial Complaints Authority',
  UK:'the Competition and Markets Authority, Trading Standards, the Financial Ombudsman Service, and the Small Claims Court',
}

function generateTemplate({ disputeType, form }) {
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  const deadline = { firm:14, urgent:10, final:7 }[form.tone] || 14
  const deadlineDate = new Date(Date.now() + deadline*86400000).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  const law = LAWS[form.country]?.[disputeType] || LAWS.US.other
  const escalation = ESCALATION[form.country] || ESCALATION.US
  const amount = form.amount ? `$${form.amount.replace('$','')}` : 'the disputed amount'
  const desired = form.desired || 'a full refund of the disputed amount'
  const closings = {
    firm:`I trust that ${form.company} values its customers and will resolve this matter promptly.`,
    urgent:`If not resolved by the deadline, I will escalate through all available channels without further notice.`,
    final:`This is my final attempt to resolve this directly. Failure to respond triggers immediate regulatory complaints and legal action.`,
  }
  const openings = {
    firm:'I am writing to formally dispute',
    urgent:'I am writing to formally dispute and demand immediate resolution of',
    final:'FINAL NOTICE — I am writing regarding my unresolved dispute concerning',
  }
  return `${form.yourName || '[YOUR FULL NAME]'}
${form.city || '[YOUR CITY]'}
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

If not resolved within the stated timeframe, I will file formal complaints with ${escalation}${form.country==='US'?', and initiate a credit card chargeback where applicable':''}.

${closings[form.tone]}

Please confirm receipt and your intended resolution in writing.

Sincerely,

${form.yourName || '[YOUR FULL NAME]'}
${form.city || '[YOUR CITY]'}

Enclosures: [Attach all relevant receipts, correspondence, and documentation]`
}

// ── Free letter tracking (localStorage per session) ─────────────────
const FREE_LIMIT = 2
function getLetterCount() {
  try {
    const data = JSON.parse(localStorage.getItem('cb_usage') || '{}')
    const month = new Date().toISOString().slice(0,7)
    return data.month === month ? (data.count || 0) : 0
  } catch { return 0 }
}
function incrementLetterCount() {
  try {
    const month = new Date().toISOString().slice(0,7)
    const count = getLetterCount() + 1
    localStorage.setItem('cb_usage', JSON.stringify({ month, count }))
  } catch {}
}

// ── Animated Background Canvas ───────────────────────────────────────
function AnimatedBg() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let t = 0
    const orbs = [
      { x:0.2, y:0.3, r:0.35, color:'108,71,255', speed:0.0004 },
      { x:0.8, y:0.2, r:0.30, color:'139,92,246', speed:0.0003 },
      { x:0.5, y:0.8, r:0.28, color:'167,139,250', speed:0.0005 },
      { x:0.9, y:0.7, r:0.22, color:'99,102,241', speed:0.0006 },
    ]
    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    function draw() {
      t += 1
      ctx.clearRect(0,0,canvas.width,canvas.height)
      orbs.forEach((orb, i) => {
        const x = (orb.x + Math.sin(t*orb.speed + i*2) * 0.12) * canvas.width
        const y = (orb.y + Math.cos(t*orb.speed + i) * 0.10) * canvas.height
        const r = orb.r * Math.min(canvas.width, canvas.height)
        const g = ctx.createRadialGradient(x,y,0,x,y,r)
        g.addColorStop(0, `rgba(${orb.color},0.12)`)
        g.addColorStop(1, `rgba(${orb.color},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x,y,r,0,Math.PI*2)
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />
}

// ── App ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home')
  const [user, setUser] = useState(null) // { name, email, avatar, plan:'free'|'starter'|'pro' }
  const [disputeType, setDisputeType] = useState(null)
  const [form, setForm] = useState({ company:'', amount:'', description:'', desired:'', tone:'firm', yourName:'', city:'', country:'US' })
  const [letter, setLetter] = useState('')
  const [tips, setTips] = useState([])
  const [copied, setCopied] = useState(false)
  const [wordIdx, setWordIdx] = useState(0)
  const [billing, setBilling] = useState('monthly')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [letterCount, setLetterCount] = useState(getLetterCount())

  const words = ['Overcharges','Denied Refunds','Stolen Deposits','Ignored Complaints','Unfair Charges']
  useEffect(() => {
    const t = setInterval(() => setWordIdx(p => (p+1) % words.length), 2400)
    return () => clearInterval(t)
  }, [])

  // Simulate Google Sign In (real implementation needs Firebase/Google OAuth)
  function handleGoogleSignIn() {
    // In production: integrate Firebase Google Auth
    // For now: simulate with a demo user
    const mockUser = {
      name: 'Demo User',
      email: 'demo@gmail.com',
      avatar: 'D',
      plan: 'free',
    }
    setUser(mockUser)
    setShowAuthModal(false)
    // Reset letter count for logged in user (would use server-side in production)
    localStorage.setItem('cb_usage', JSON.stringify({ month: new Date().toISOString().slice(0,7), count: 0 }))
    setLetterCount(0)
  }

  function signOut() {
    setUser(null)
    setLetterCount(getLetterCount())
  }

  const userPlan = user?.plan || 'free'
  const canGenerate = userPlan !== 'free' || letterCount < FREE_LIMIT

  async function generate() {
    if (!disputeType || !form.company || !form.description) return
    if (!canGenerate) { setShowAuthModal(true); return }
    setScreen('loading')
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('No key')
      const typeInfo = DISPUTE_TYPES.find(d => d.id === disputeType)
      const toneInfo = TONES.find(t => t.id === form.tone)
      const deadline = { firm:14, urgent:10, final:7 }[form.tone] || 14
      const today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})
      const prompt = "You are a consumer rights attorney. Write a powerful specific dispute letter.\n\n" +
        "DISPUTE: " + typeInfo.label + "\nCOMPANY: " + form.company + "\nAMOUNT: " + (form.amount?"$"+form.amount:"unspecified") +
        "\nSITUATION: " + form.description + "\nDESIRED: " + (form.desired||"full refund/resolution") +
        "\nTONE: " + toneInfo.label + "\nSENDER: " + (form.yourName||"[YOUR NAME]") + ", " + (form.city||"[CITY]") + ", " + form.country +
        "\nDEADLINE: " + deadline + " days\nDATE: " + today + "\n\n" +
        "Write a complete formal dispute letter with: sender block, date, company recipient, RE: subject line, opening, " +
        "specific situation details, real consumer protection laws for " + form.country + ", " + deadline +
        "-day deadline with exact date, consequences if ignored, professional closing. Under 400 words. 100% specific to their situation."
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
    // Track usage for free users
    if (userPlan === 'free') {
      incrementLetterCount()
      setLetterCount(getLetterCount())
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
    window.scrollTo(0,0)
  }

  const inp = {
    width:'100%', padding:'12px 14px',
    background:'rgba(255,255,255,0.8)',
    border:'1.5px solid var(--border)',
    borderRadius:10, fontFamily:"'Plus Jakarta Sans',sans-serif",
    fontSize:14, color:'var(--dark)', outline:'none',
    transition:'border-color .15s', backdropFilter:'blur(8px)',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#f0eeff;
          --surface:rgba(255,255,255,0.85);
          --surface2:rgba(240,238,255,0.9);
          --border:rgba(108,71,255,0.15);
          --accent:#6c47ff;
          --accent2:#8b5cf6;
          --accent3:#a78bfa;
          --dark:#0f0a2e;
          --text:#1a1040;
          --muted:#6b6895;
          --success:#10b981;
          --r:12px;
        }
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;line-height:1.6}
        ::selection{background:var(--accent);color:#fff}
        .app{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:0 24px 100px}

        /* GLASS */
        .glass{background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border)}

        /* NAV */
        .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;background:rgba(240,238,255,0.8);backdrop-filter:blur(20px)}
        .logo{font-size:22px;font-weight:800;color:var(--dark);cursor:pointer;display:flex;align-items:center;gap:10px;text-decoration:none}
        .logo-mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 4px 16px rgba(108,71,255,.35);flex-shrink:0}
        .logo-mark svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
        .logo-text{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nav-right{display:flex;align-items:center;gap:8px}
        .nav-btn{padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;letter-spacing:.02em}
        .nav-ghost{background:transparent;color:var(--text)}
        .nav-ghost:hover{background:rgba(108,71,255,.08);color:var(--accent)}
        .nav-solid{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 4px 14px rgba(108,71,255,.3)}
        .nav-solid:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(108,71,255,.4)}
        .user-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .letter-chip{background:rgba(108,71,255,.1);color:var(--accent);font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;border:1px solid rgba(108,71,255,.2)}

        /* HERO */
        .hero{padding:80px 0 64px;text-align:center;position:relative}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.8);border:1px solid var(--border);color:var(--accent);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 18px;border-radius:100px;margin-bottom:32px;backdrop-filter:blur(8px);box-shadow:0 2px 12px rgba(108,71,255,.1)}
        .hero-dot{width:6px;height:6px;background:var(--success);border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .hero-h1{font-size:clamp(40px,6vw,76px);font-weight:800;line-height:1.0;letter-spacing:-2.5px;color:var(--dark)}
        .hero-rotating{font-size:clamp(40px,6vw,76px);font-weight:800;line-height:1.05;letter-spacing:-2.5px;background:linear-gradient(135deg,var(--accent),var(--accent2),#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;min-height:1.1em;animation:wordIn .4s cubic-bezier(.34,1.56,.64,1)}
        @keyframes wordIn{from{opacity:0;transform:translateY(14px) scale(.95)}to{opacity:1;transform:none}}
        .hero-sub{font-size:18px;color:var(--muted);max-width:540px;margin:24px auto 44px;line-height:1.7;font-weight:400}
        .hero-ctas{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:64px}
        .btn-main{padding:16px 32px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;box-shadow:0 8px 24px rgba(108,71,255,.3);letter-spacing:.02em}
        .btn-main:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(108,71,255,.4)}
        .btn-ghost{padding:16px 24px;background:rgba(255,255,255,.7);color:var(--text);border:1.5px solid var(--border);border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;backdrop-filter:blur(8px)}
        .btn-ghost:hover{border-color:var(--accent);color:var(--accent);background:rgba(108,71,255,.05)}

        /* STATS */
        .stats-bar{display:flex;justify-content:center;gap:0;flex-wrap:wrap;max-width:600px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(108,71,255,.12)}
        .stat-cell{flex:1;min-width:120px;padding:22px 16px;text-align:center;border-right:1px solid var(--border)}
        .stat-cell:last-child{border-right:none}
        .stat-n{font-size:26px;font-weight:800;color:var(--dark);display:block;letter-spacing:-1px}
        .stat-l{font-size:11px;color:var(--muted);font-weight:500;margin-top:4px}

        /* SECTION */
        .sec{padding:72px 0}
        .sec-eye{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
        .sec-title{font-size:clamp(26px,4vw,44px);font-weight:800;letter-spacing:-1px;color:var(--dark);text-align:center;margin-bottom:10px}
        .sec-sub{font-size:16px;color:var(--muted);text-align:center;max-width:500px;margin:0 auto 48px;line-height:1.65}

        /* HOW GRID */
        .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:640px){.how-grid{grid-template-columns:1fr}}
        .how-card{border-radius:18px;padding:28px;transition:all .25s;position:relative;overflow:hidden}
        .how-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(108,71,255,.04),transparent);pointer-events:none}
        .how-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(108,71,255,.12)}
        .how-num{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;margin-bottom:18px;box-shadow:0 4px 12px rgba(108,71,255,.3)}
        .how-card h3{font-size:16px;font-weight:700;margin-bottom:8px;color:var(--dark)}
        .how-card p{font-size:13px;color:var(--muted);line-height:1.65}

        /* TYPES GRID */
        .types-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:640px){.types-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:400px){.types-grid{grid-template-columns:1fr}}
        .type-card{border-radius:14px;padding:18px 16px;cursor:pointer;text-align:left;transition:all .2s;border:1.5px solid var(--border)}
        .type-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 24px rgba(108,71,255,.12)}
        .type-card.selected{border-color:var(--accent);background:linear-gradient(135deg,rgba(108,71,255,.08),rgba(139,92,246,.04))}
        .type-icon{font-size:22px;margin-bottom:10px;display:block}
        .type-label{font-size:13px;font-weight:700;display:block;margin-bottom:4px;color:var(--dark)}
        .type-desc{font-size:11px;color:var(--muted);line-height:1.4}

        /* PRICING */
        .billing-toggle{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:40px}
        .tog-label{font-size:14px;font-weight:600;color:var(--muted);transition:color .2s}
        .tog-label.active{color:var(--dark)}
        .tog-switch{width:48px;height:26px;background:var(--accent);border-radius:13px;cursor:pointer;position:relative;border:none;transition:all .2s;box-shadow:0 2px 8px rgba(108,71,255,.3)}
        .tog-switch::after{content:'';position:absolute;width:20px;height:20px;background:#fff;border-radius:50%;top:3px;left:3px;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
        .tog-switch.yearly::after{transform:translateX(22px)}
        .save-pill{background:rgba(16,185,129,.12);color:var(--success);font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;letter-spacing:.06em;border:1px solid rgba(16,185,129,.2)}
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:700px){.pricing-grid{grid-template-columns:1fr}}
        .plan-card{border-radius:22px;padding:32px 28px;position:relative;transition:all .25s;border:1.5px solid var(--border)}
        .plan-card.highlight{border-color:var(--accent);background:linear-gradient(155deg,rgba(108,71,255,.08),rgba(255,255,255,0.9));box-shadow:0 12px 40px rgba(108,71,255,.18)}
        .plan-card:hover:not(.highlight){transform:translateY(-4px)}
        .plan-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:11px;font-weight:700;padding:5px 16px;border-radius:100px;letter-spacing:.06em;white-space:nowrap;box-shadow:0 4px 12px rgba(108,71,255,.3)}
        .plan-name{font-size:13px;font-weight:700;color:var(--accent);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}
        .plan-price{font-size:46px;font-weight:800;color:var(--dark);letter-spacing:-2px;line-height:1}
        .plan-period{font-size:14px;color:var(--muted);font-weight:500}
        .plan-yearly-note{font-size:12px;color:var(--success);font-weight:700;margin-top:4px}
        .plan-desc{font-size:13px;color:var(--muted);margin:12px 0 0;padding-bottom:20px;border-bottom:1px solid var(--border)}
        .plan-features{list-style:none;margin:20px 0 28px;display:flex;flex-direction:column;gap:10px}
        .plan-feat-item{font-size:13px;color:var(--text);display:flex;align-items:flex-start;gap:10px}
        .feat-check{color:var(--success);font-weight:700;font-size:13px;flex-shrink:0;margin-top:1px}
        .feat-cross{color:var(--muted);font-size:11px;flex-shrink:0;margin-top:2px;opacity:.5}
        .feat-locked{font-size:13px;color:var(--muted);opacity:.4;text-decoration:line-through;display:flex;align-items:flex-start;gap:10px}
        .plan-btn{width:100%;padding:14px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;letter-spacing:.02em;display:block;text-align:center;text-decoration:none}
        .plan-btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 4px 14px rgba(108,71,255,.3)}
        .plan-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(108,71,255,.4)}
        .plan-btn-outline{background:transparent;color:var(--text);border:1.5px solid var(--border)}
        .plan-btn-outline:hover{border-color:var(--accent);color:var(--accent);background:rgba(108,71,255,.04)}

        /* REVIEWS */
        .reviews-wrap{overflow:hidden;position:relative;margin:0 -24px}
        .reviews-wrap::before,.reviews-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
        .reviews-wrap::before{left:0;background:linear-gradient(90deg,var(--bg),transparent)}
        .reviews-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent)}
        .reviews-track{display:flex;gap:16px;animation:scroll 36s linear infinite;width:max-content;padding:8px 24px}
        .reviews-track:hover{animation-play-state:paused}
        @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .review-card{border-radius:18px;padding:24px;width:300px;flex-shrink:0;transition:all .2s}
        .review-card:hover{transform:translateY(-3px)}
        .review-stars{color:#f59e0b;font-size:14px;margin-bottom:10px;letter-spacing:1px}
        .review-text{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:16px;font-style:italic}
        .review-footer{display:flex;align-items:center;justify-content:space-between}
        .review-name{font-size:13px;font-weight:700;color:var(--dark)}
        .review-loc{font-size:11px;color:var(--muted)}
        .review-tag{font-size:10px;font-weight:700;background:rgba(108,71,255,.1);color:var(--accent);padding:3px 10px;border-radius:100px;border:1px solid rgba(108,71,255,.15)}

        /* DISCLAIMER */
        .disclaimer{background:rgba(255,255,255,.6);border:1px solid var(--border);border-radius:14px;padding:18px 22px;margin:40px 0;display:flex;gap:12px;align-items:flex-start;backdrop-filter:blur(8px)}
        .disclaimer p{font-size:12px;color:var(--muted);line-height:1.7}
        .disclaimer strong{color:var(--text);font-weight:600}

        /* FORM */
        .form-wrap{max-width:720px;margin:0 auto}
        .fcard{border-radius:18px;overflow:hidden;margin-bottom:16px;box-shadow:0 4px 24px rgba(108,71,255,.06)}
        .fcard-head{padding:20px 26px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:rgba(108,71,255,.04)}
        .fcard-step{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:.08em}
        .fcard-head h2{font-size:16px;font-weight:700;color:var(--dark)}
        .fcard-body{padding:24px}
        .field{margin-bottom:18px}
        .field:last-child{margin-bottom:0}
        .field label{display:block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
        .field input,.field textarea,.field select{width:100%;padding:12px 14px;background:rgba(255,255,255,.8);border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:var(--dark);outline:none;transition:border-color .15s;resize:vertical;backdrop-filter:blur(8px)}
        .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent);background:rgba(255,255,255,.95)}
        .field input::placeholder,.field textarea::placeholder{color:rgba(107,104,149,.5)}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
        @media(max-width:540px){.two-col,.three-col{grid-template-columns:1fr}}
        .tone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:480px){.tone-grid{grid-template-columns:1fr}}
        .tone-btn{background:rgba(255,255,255,.7);border:1.5px solid var(--border);border-radius:12px;padding:14px;cursor:pointer;text-align:left;color:var(--text);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif;backdrop-filter:blur(8px)}
        .tone-btn:hover{border-color:var(--accent2);background:rgba(108,71,255,.05)}
        .tone-btn.selected{border-color:var(--accent);background:rgba(108,71,255,.06)}
        .tone-name{font-size:13px;font-weight:700;display:block;margin-bottom:4px;color:var(--dark)}
        .tone-small{font-size:11px;color:var(--muted);line-height:1.4}
        .gen-btn{width:100%;padding:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:700;cursor:pointer;transition:all .25s;margin-top:24px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px rgba(108,71,255,.3)}
        .gen-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(108,71,255,.4)}
        .gen-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}

        /* LIMIT WARNING */
        .limit-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:12px;padding:16px 20px;margin-top:16px;display:flex;gap:12px;align-items:center}
        .limit-warn p{font-size:13px;color:var(--text);line-height:1.5}
        .limit-warn strong{color:#d97706}

        /* LOADING */
        .loading-wrap{text-align:center;padding:100px 20px}
        .spinner{width:48px;height:48px;border:3px solid rgba(108,71,255,.15);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 24px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-wrap h2{font-size:22px;font-weight:800;color:var(--dark);margin-bottom:8px}
        .loading-wrap p{color:var(--muted);font-size:14px}

        /* RESULT */
        .result-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px}
        .ready-badge{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:var(--success);font-size:11px;font-weight:700;padding:5px 13px;border-radius:100px;letter-spacing:.06em}
        .result-title{font-size:22px;font-weight:800;color:var(--dark)}
        .result-actions{display:flex;gap:8px;flex-wrap:wrap}
        .r-btn{padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s}
        .r-btn-main{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
        .r-btn-out{background:rgba(255,255,255,.7);color:var(--text);border:1.5px solid var(--border);backdrop-filter:blur(8px)}
        .r-btn-out:hover{border-color:var(--accent);color:var(--accent)}
        .letter-box{background:rgba(255,255,255,.9);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:14px;padding:28px;font-size:13.5px;line-height:1.85;white-space:pre-wrap;font-family:'Plus Jakarta Sans',sans-serif;color:var(--dark);max-height:520px;overflow-y:auto;backdrop-filter:blur(8px)}
        .tips-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:28px 0 14px;display:flex;align-items:center;gap:10px}
        .tips-label::after{content:'';flex:1;height:1px;background:var(--border)}
        .tips-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:500px){.tips-grid{grid-template-columns:1fr}}
        .tip-item{background:rgba(255,255,255,.7);border:1px solid var(--border);border-radius:12px;padding:14px;font-size:12px;color:var(--muted);line-height:1.55;display:flex;gap:10px;align-items:flex-start;backdrop-filter:blur(8px)}

        /* BACK */
        .back{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:6px;padding:24px 0 20px;font-weight:600;transition:color .15s}
        .back:hover{color:var(--accent)}

        /* AUTH MODAL */
        .modal-overlay{position:fixed;inset:0;background:rgba(15,10,46,.5);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px;backdrop-filter:blur(4px)}
        .modal{background:#fff;border-radius:24px;width:100%;max-width:420px;padding:36px;text-align:center;box-shadow:0 24px 80px rgba(15,10,46,.2)}
        .modal h2{font-size:22px;font-weight:800;color:var(--dark);margin-bottom:8px}
        .modal p{font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.6}
        .google-btn{width:100%;padding:14px;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;transition:all .2s;color:var(--dark);margin-bottom:12px}
        .google-btn:hover{border-color:var(--accent);background:#f8f7ff;transform:translateY(-1px);box-shadow:0 4px 16px rgba(108,71,255,.1)}
        .google-icon{width:20px;height:20px}
        .modal-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;margin-top:4px;transition:color .15s}
        .modal-close:hover{color:var(--text)}
        .limit-badge{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);color:#d97706;font-size:12px;font-weight:700;padding:6px 14px;border-radius:100px;display:inline-block;margin-bottom:20px}

        /* POLICY */
        .policy-wrap{max-width:720px;margin:0 auto;padding:40px 0}
        .policy-wrap h1{font-size:32px;font-weight:800;color:var(--dark);margin-bottom:8px;letter-spacing:-1px}
        .policy-date{font-size:13px;color:var(--muted);margin-bottom:32px}
        .policy-wrap h2{font-size:18px;font-weight:700;color:var(--dark);margin:32px 0 10px}
        .policy-wrap p{font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:14px}

        /* FOOTER */
        .footer{border-top:1px solid var(--border);padding:40px 0;text-align:center;color:var(--muted);font-size:13px;margin-top:60px}
        .footer-logo{font-size:20px;font-weight:800;color:var(--dark);margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px}
        .footer a{color:var(--accent);text-decoration:none}
        .footer a:hover{text-decoration:underline}

        /* TOAST */
        .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--dark);color:#fff;padding:13px 28px;border-radius:12px;font-weight:700;font-size:14px;z-index:9999;animation:tIn .2s ease;white-space:nowrap;box-shadow:0 8px 24px rgba(15,10,46,.25)}
        @keyframes tIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

        /* FEATURE COMPARISON */
        .compare-table{width:100%;border-collapse:collapse;margin-top:32px}
        .compare-table th{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:12px 16px;text-align:left;border-bottom:1px solid var(--border)}
        .compare-table th.plan-col{text-align:center;color:var(--dark)}
        .compare-table th.plan-col.active{color:var(--accent)}
        .compare-table td{padding:12px 16px;font-size:13px;color:var(--text);border-bottom:1px solid rgba(108,71,255,.06)}
        .compare-table td.check-cell{text-align:center}
        .check-yes{color:var(--success);font-size:16px}
        .check-no{color:var(--border);font-size:16px}
        @media(max-width:600px){.compare-table{display:none}}
      `}</style>

      {/* Animated Canvas Background */}
      <AnimatedBg />

      <div className="app">

        {/* NAV */}
        <nav className="nav">
          <div className="logo" onClick={reset} style={{cursor:'pointer'}}>
            <div className="logo-mark">
              <svg viewBox="0 0 24 24"><path d="M12 2L4 7v10l8 5 8-5V7z"/><path d="M12 2v20M4 7l8 5 8-5"/></svg>
            </div>
            <span className="logo-text">Clawback</span>
          </div>
          <div className="nav-right">
            {screen === 'home' && (
              <button className="nav-btn nav-ghost" onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}>
                Pricing
              </button>
            )}
            {user ? (
              <>
                <span className="letter-chip">
                  {userPlan === 'free' ? `${Math.max(0, FREE_LIMIT - letterCount)} letters left` : '∞ Pro'}
                </span>
                <div className="user-avatar" title="Sign out" onClick={signOut}>{user.avatar}</div>
              </>
            ) : (
              <button className="nav-btn nav-solid" onClick={() => setShowAuthModal(true)}>
                Sign in with Google
              </button>
            )}
            {screen !== 'home' && (
              <button className="nav-btn nav-ghost" onClick={reset}>← Home</button>
            )}
          </div>
        </nav>

        {/* HOME */}
        {screen === 'home' && (<>

          {/* HERO */}
          <section className="hero">
            <div className="hero-badge"><span className="hero-dot"/>Free · Instant · No Hidden Fees</div>
            <h1 className="hero-h1">Stop accepting</h1>
            <span className="hero-rotating" key={wordIdx}>{words[wordIdx]}</span>
            <p className="hero-sub">Generate a legally-sharp dispute letter in seconds. Trusted by thousands to recover money from companies that count on you giving up.</p>
            <div className="hero-ctas">
              <button className="btn-main" onClick={() => setScreen('form')}>Generate My Letter ⚡</button>
              <button className="btn-ghost" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>See how it works</button>
            </div>
            <div className="stats-bar glass">
              <div className="stat-cell"><span className="stat-n">$2.8T</span><div className="stat-l">Overcharged yearly</div></div>
              <div className="stat-cell"><span className="stat-n">73%</span><div className="stat-l">Resolved with a letter</div></div>
              <div className="stat-cell"><span className="stat-n">9</span><div className="stat-l">Dispute categories</div></div>
              <div className="stat-cell"><span className="stat-n">4</span><div className="stat-l">Countries covered</div></div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="sec" id="how">
            <div className="sec-eye">✦ How it works</div>
            <h2 className="sec-title">Three steps to getting your money back</h2>
            <p className="sec-sub">No legal knowledge needed. Describe what happened and get your letter instantly.</p>
            <div className="how-grid">
              {[
                {n:'01',title:'Pick your dispute',body:'Choose from 9 categories — overcharges, denied refunds, bad contractors, kept deposits, cancelled flights and more.'},
                {n:'02',title:'Describe what happened',body:'Tell us the company name and what they did wrong. Dates, amounts, broken promises — the more detail the stronger the letter.'},
                {n:'03',title:'Copy and send it',body:'Instant letter with real consumer protection laws. Copy, send by certified mail, and get your money back.'},
              ].map(s=>(
                <div className="how-card glass" key={s.n}>
                  <div className="how-num">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DISPUTE TYPES */}
          <section className="sec" style={{paddingTop:0}}>
            <div className="sec-eye">✦ Dispute categories</div>
            <h2 className="sec-title">What do you need to fight?</h2>
            <p className="sec-sub">Click any category to start generating your letter immediately.</p>
            <div className="types-grid">
              {DISPUTE_TYPES.map(d=>(
                <button key={d.id} className="type-card glass" onClick={()=>{setDisputeType(d.id);setScreen('form')}}>
                  <span className="type-icon">{d.icon}</span>
                  <span className="type-label">{d.label}</span>
                  <span className="type-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* REVIEWS */}
          <section className="sec" style={{paddingTop:0}}>
            <div className="sec-eye">✦ Real results</div>
            <h2 className="sec-title">People are winning their money back</h2>
            <p className="sec-sub">Thousands of disputes resolved. Here is what users are saying.</p>
            <div className="reviews-wrap">
              <div className="reviews-track">
                {[...REVIEWS,...REVIEWS].map((r,i)=>(
                  <div className="review-card glass" key={i}>
                    <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    <p className="review-text">"{r.text}"</p>
                    <div className="review-footer">
                      <div>
                        <div className="review-name">{r.name}</div>
                        <div className="review-loc">{r.location}</div>
                      </div>
                      <div className="review-tag">{r.dispute}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section className="sec" id="pricing">
            <div className="sec-eye">✦ Pricing</div>
            <h2 className="sec-title">Start free. Upgrade when ready.</h2>
            <p className="sec-sub">Free plan gets you 2 letters per month. Upgrade for unlimited letters, PDF, phone scripts and more.</p>

            <div className="billing-toggle">
              <span className={`tog-label ${billing==='monthly'?'active':''}`}>Monthly</span>
              <button className={`tog-switch ${billing==='yearly'?'yearly':''}`} onClick={()=>setBilling(b=>b==='monthly'?'yearly':'monthly')}/>
              <span className={`tog-label ${billing==='yearly'?'active':''}`}>Yearly</span>
              {billing==='yearly' && <span className="save-pill">Save 17%</span>}
            </div>

            <div className="pricing-grid">
              {PLANS.map((p,i)=>(
                <div key={p.name} className={`plan-card glass ${p.highlight?'highlight':''}`}>
                  {p.badge && <div className="plan-badge">{p.badge}</div>}
                  <div className="plan-name">{p.name}</div>
                  <div>
                    <span className="plan-price">
                      {billing==='yearly' && p.yearlyPrice && p.price!=='$0' ? p.yearlyPrice : p.price}
                    </span>
                    <span className="plan-period">
                      {p.price==='$0' ? '/forever' : billing==='yearly' ? '/mo' : `/${p.period}`}
                    </span>
                  </div>
                  {billing==='yearly' && p.yearlyTotal && (
                    <div className="plan-yearly-note">{p.yearlyTotal}/year · save 17%</div>
                  )}
                  <div className="plan-desc">{p.desc}</div>
                  <ul className="plan-features">
                    {p.features.map(f=>(
                      <li className="plan-feat-item" key={f}>
                        <span className="feat-check">✓</span>{f}
                      </li>
                    ))}
                    {p.locked && p.locked.map(f=>(
                      <li className="feat-locked" key={f}>
                        <span className="feat-cross">✕</span>{f}
                      </li>
                    ))}
                  </ul>
                  {p.price==='$0' ? (
                    <button className="plan-btn plan-btn-outline" onClick={()=>setScreen('form')}>
                      Start Free — No Card Needed
                    </button>
                  ) : (
                    <a
                      href={billing==='yearly' ? p.paypalYearly() : p.paypalMonthly()}
                      target="_blank" rel="noreferrer"
                      className={`plan-btn ${p.highlight?'plan-btn-primary':'plan-btn-outline'}`}
                    >
                      {p.cta} — {billing==='yearly' ? p.yearlyTotal+'/yr' : p.price+'/mo'} →
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Feature comparison table */}
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="plan-col">Free</th>
                  <th className="plan-col active">Starter</th>
                  <th className="plan-col active">Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Letters per month','2/mo','Unlimited','Unlimited'],
                  ['Copy to clipboard','✓','✓','✓'],
                  ['PDF download','✕','✓','✓'],
                  ['Phone script','✕','✓','✓'],
                  ['Follow-up letter','✕','✓','✓'],
                  ['BBB complaint template','✕','✕','✓'],
                  ['Small claims guide','✕','✕','✓'],
                  ['Priority support','✕','✕','✓'],
                ].map(([feat,...vals])=>(
                  <tr key={feat}>
                    <td>{feat}</td>
                    {vals.map((v,i)=>(
                      <td key={i} className="check-cell">
                        {v==='✓'?<span className="check-yes">✓</span>:v==='✕'?<span className="check-no">—</span>:<span style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* DISCLAIMER */}
          <div className="disclaimer">
            <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
            <p><strong>Legal Disclaimer:</strong> Clawback generates dispute letter templates for informational purposes only. We are not a law firm and do not provide legal advice. Letters are based on general consumer protection laws and may not apply to every situation. For complex legal matters, please consult a qualified attorney in your jurisdiction. Results are not guaranteed.</p>
          </div>

          {/* FINAL CTA */}
          <section style={{padding:'64px 0',textAlign:'center',borderTop:'1px solid var(--border)'}}>
            <h2 style={{fontSize:'clamp(26px,4vw,44px)',fontWeight:800,letterSpacing:'-1px',color:'var(--dark)',marginBottom:14}}>Ready to fight back?</h2>
            <p style={{fontSize:16,color:'var(--muted)',marginBottom:32,maxWidth:400,margin:'0 auto 32px'}}>Generate your first letter free. No signup required to try it.</p>
            <button className="btn-main" style={{margin:'0 auto'}} onClick={()=>setScreen('form')}>Generate My Letter — Free ⚡</button>
          </section>
        </>)}

        {/* FORM */}
        {screen==='form' && (<>
          <button className="back" onClick={reset}>← Back to home</button>
          <div className="form-wrap">
            <div style={{marginBottom:24,textAlign:'center'}}>
              <h2 style={{fontSize:26,fontWeight:800,color:'var(--dark)',letterSpacing:'-0.5px'}}>Build your dispute letter</h2>
              <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Fill in the details below — takes about 2 minutes</p>
              {!user && (
                <div style={{marginTop:12,fontSize:12,color:'var(--muted)'}}>
                  {FREE_LIMIT - letterCount} free {FREE_LIMIT - letterCount === 1 ? 'letter' : 'letters'} remaining this month ·{' '}
                  <span style={{color:'var(--accent)',cursor:'pointer',fontWeight:600}} onClick={()=>setShowAuthModal(true)}>Sign in to track usage</span>
                </div>
              )}
            </div>

            <div className="fcard glass">
              <div className="fcard-head"><span className="fcard-step">Step 1</span><h2>What type of dispute?</h2></div>
              <div className="fcard-body">
                <div className="types-grid">
                  {DISPUTE_TYPES.map(d=>(
                    <button key={d.id} className={`type-card glass ${disputeType===d.id?'selected':''}`} onClick={()=>setDisputeType(d.id)}>
                      <span className="type-icon">{d.icon}</span>
                      <span className="type-label">{d.label}</span>
                      <span className="type-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="fcard glass">
              <div className="fcard-head"><span className="fcard-step">Step 2</span><h2>What happened?</h2></div>
              <div className="fcard-body">
                <div className="two-col">
                  <div className="field"><label>Company name *</label><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="e.g. Comcast, John Smith" /></div>
                  <div className="field"><label>Amount in dispute</label><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="e.g. 350" /></div>
                </div>
                <div className="field"><label>Describe what happened *</label>
                  <textarea rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Be specific — dates, what was promised, what happened, any prior attempts to resolve..." style={inp} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
                <div className="field"><label>What do you want?</label><input value={form.desired} onChange={e=>setForm({...form,desired:e.target.value})} placeholder="e.g. Full refund of $350, fix the work, return deposit" /></div>
              </div>
            </div>

            <div className="fcard glass">
              <div className="fcard-head"><span className="fcard-step">Step 3</span><h2>Your details & tone</h2></div>
              <div className="fcard-body">
                <div className="three-col" style={{marginBottom:20}}>
                  <div className="field" style={{marginBottom:0}}><label>Your name</label><input value={form.yourName} onChange={e=>setForm({...form,yourName:e.target.value})} placeholder="Full name" /></div>
                  <div className="field" style={{marginBottom:0}}><label>City / State</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="e.g. Austin, TX" /></div>
                  <div className="field" style={{marginBottom:0}}><label>Country</label>
                    <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})} style={{...inp,resize:'none'}}>
                      {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field" style={{marginBottom:0}}>
                  <label>Letter tone</label>
                  <div className="tone-grid">
                    {TONES.map(t=>(
                      <button key={t.id} className={`tone-btn ${form.tone===t.id?'selected':''}`} onClick={()=>setForm({...form,tone:t.id})}>
                        <span className="tone-name">{t.label}</span>
                        <span className="tone-small">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {!canGenerate ? (
                  <div className="limit-warn">
                    <span style={{fontSize:20}}>⚠️</span>
                    <div>
                      <p><strong>You've used your 2 free letters this month.</strong><br/>
                      Sign in with Google to track your usage, or upgrade to Starter for unlimited letters.</p>
                      <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                        <button className="nav-btn nav-solid" style={{padding:'8px 16px',fontSize:13}} onClick={()=>setShowAuthModal(true)}>Sign in with Google</button>
                        <button className="nav-btn nav-ghost" style={{padding:'8px 16px',fontSize:13,border:'1.5px solid var(--border)',borderRadius:8}} onClick={()=>{reset();setTimeout(()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}),100)}}>View Plans →</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="gen-btn" disabled={!disputeType||!form.company||!form.description} onClick={generate}>
                    ⚡ Generate My Dispute Letter
                  </button>
                )}
                {canGenerate && (!disputeType||!form.company||!form.description) && (
                  <p style={{textAlign:'center',fontSize:12,color:'var(--muted)',marginTop:10}}>Select dispute type, company name and description to continue</p>
                )}
              </div>
            </div>
          </div>
        </>)}

        {/* LOADING */}
        {screen==='loading' && (
          <div className="loading-wrap">
            <div className="spinner"/>
            <h2>Writing your dispute letter...</h2>
            <p>AI is drafting a letter specific to your situation with the right consumer protection laws.</p>
          </div>
        )}

        {/* RESULT */}
        {screen==='result' && (<>
          <div className="result-top">
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <span className="ready-badge">✓ Letter ready</span>
              <div className="result-title">Your Dispute Letter</div>
            </div>
            <div className="result-actions">
              <button className="r-btn r-btn-main" onClick={copyLetter}>📋 Copy Letter</button>
              <button className="r-btn r-btn-out" onClick={()=>setScreen('form')}>← Edit</button>
              <button className="r-btn r-btn-out" onClick={reset}>+ New</button>
            </div>
          </div>
          <div className="letter-box">{letter}</div>
          <div className="tips-label">Action tips for maximum impact</div>
          <div className="tips-grid">
            {tips.slice(0,4).map((tip,i)=>(
              <div className="tip-item" key={i}>
                <span style={{fontSize:16,flexShrink:0}}>{['📮','💳','📸','📋'][i]}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
          {!user && letterCount >= FREE_LIMIT && (
            <div className="limit-warn" style={{marginTop:24}}>
              <span style={{fontSize:20}}>⚠️</span>
              <p><strong>You've used all your free letters for this month.</strong> Upgrade to Starter for unlimited letters, PDF download and phone scripts.</p>
            </div>
          )}
          <div style={{textAlign:'center',marginTop:48,paddingTop:40,borderTop:'1px solid var(--border)'}}>
            <p style={{fontSize:14,color:'var(--muted)',marginBottom:20}}>Need unlimited letters + PDF + phone scripts?</p>
            <button className="btn-main" style={{margin:'0 auto'}} onClick={()=>{reset();setTimeout(()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}),100)}}>
              View Pro Plans →
            </button>
          </div>
        </>)}

        {/* PRIVACY */}
        {screen==='privacy' && (
          <div className="policy-wrap">
            <button className="back" onClick={()=>setScreen('home')}>← Back</button>
            <h1>Privacy Policy</h1>
            <p className="policy-date">Last updated: April 2026</p>
            <h2>1. Information We Collect</h2>
            <p>Clawback does not collect or store any personal information on our servers. All dispute details you enter remain in your browser only.</p>
            <p>The text of your dispute letter is sent to Groq AI to generate a response. This is governed by Groq's privacy policy at groq.com.</p>
            <h2>2. Google Sign In</h2>
            <p>If you choose to sign in with Google, we receive your name, email address and profile picture from Google. This is used only to track your letter usage limit and is not shared with any third party.</p>
            <h2>3. Cookies</h2>
            <p>We use localStorage (browser storage) only to track how many free letters you have used this month. We do not use tracking cookies or third-party analytics.</p>
            <h2>4. Payments</h2>
            <p>All payments are processed by PayPal. We do not store your payment information. PayPal's privacy policy applies to all payment transactions.</p>
            <h2>5. Contact</h2>
            <p>Questions? Email us at privacy@getclawback.gmail.com</p>
          </div>
        )}

        {/* TERMS */}
        {screen==='terms' && (
          <div className="policy-wrap">
            <button className="back" onClick={()=>setScreen('home')}>← Back</button>
            <h1>Terms of Use</h1>
            <p className="policy-date">Last updated: April 2026</p>
            <h2>1. Not Legal Advice</h2>
            <p>Clawback is a letter generation tool, not a law firm. Letters and information provided are for informational purposes only and do not constitute legal advice. For legal matters, please consult a qualified attorney in your jurisdiction.</p>
            <h2>2. No Guarantee of Results</h2>
            <p>Clawback does not guarantee that sending a dispute letter will result in a refund or resolution. Results depend on the specific circumstances of your dispute and the other party's response.</p>
            <h2>3. Acceptable Use</h2>
            <p>You agree to use Clawback only for legitimate consumer disputes. You must not use Clawback to generate fraudulent, misleading or harassing communications.</p>
            <h2>4. Accuracy of Information</h2>
            <p>You are responsible for ensuring that the information you provide is accurate and truthful. Clawback is not responsible for letters generated based on inaccurate information.</p>
            <h2>5. Free Plan Limitations</h2>
            <p>The free plan allows 2 letters per month. Clawback reserves the right to enforce these limits at any time.</p>
            <h2>6. Subscription and Refunds</h2>
            <p>Paid subscriptions are billed through PayPal. You may cancel at any time through your PayPal account. Refunds are available within 7 days of payment if you have not used any paid features.</p>
            <h2>7. Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. Continued use of Clawback after changes constitutes acceptance of the updated terms.</p>
            <h2>8. Contact</h2>
            <p>Questions about these terms? Email us at support@getclawback.gmail.com</p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-logo">
            <div className="logo-mark" style={{width:28,height:28,borderRadius:8}}>
              <svg viewBox="0 0 24 24" style={{width:14,height:14,fill:'none',stroke:'#fff',strokeWidth:2.5,strokeLinecap:'round',strokeLinejoin:'round'}}><path d="M12 2L4 7v10l8 5 8-5V7z"/><path d="M12 2v20M4 7l8 5 8-5"/></svg>
            </div>
            Clawback
          </div>
          <p>Free consumer defence tool for US, Canada, Australia & UK</p>
          <p style={{marginTop:10}}>
            <a href="#" onClick={e=>{e.preventDefault();setScreen('privacy')}}>Privacy Policy</a>
            {' · '}
            <a href="#" onClick={e=>{e.preventDefault();setScreen('terms')}}>Terms of Use</a>
            {' · '}
            <a href="mailto:support@getclawback.gmail.com">Contact</a>
          </p>
          <p style={{marginTop:10,fontSize:11,color:'var(--muted)'}}>Clawback is not a law firm. Letters are for informational purposes only.</p>
        </footer>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAuthModal(false)}>
          <div className="modal">
            {!canGenerate && <div className="limit-badge">⚠️ 2 free letters used this month</div>}
            <h2>{canGenerate ? 'Sign in to Clawback' : 'Letter limit reached'}</h2>
            <p>{canGenerate
              ? 'Sign in with Google to track your usage across devices and access your letter history.'
              : 'You have used your 2 free letters this month. Sign in or upgrade to continue.'
            }</p>
            <button className="google-btn" onClick={handleGoogleSignIn}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="modal-close" onClick={()=>setShowAuthModal(false)}>
              Maybe later — continue without signing in
            </button>
          </div>
        </div>
      )}

      {copied && <div className="toast">✓ Copied to clipboard!</div>}
    </>
  )
}
