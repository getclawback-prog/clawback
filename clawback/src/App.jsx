import { useState, useEffect, useRef } from 'react'

// ── PayPal IDs (SET TO FREE FOR TESTING — swap back after testing) ───
const TESTING_MODE = true // set false when ready to charge
const PAYPAL_STARTER_MONTHLY = 'YOUR_STARTER_MONTHLY_PLAN_ID'
const PAYPAL_STARTER_YEARLY  = 'YOUR_STARTER_YEARLY_PLAN_ID'
const PAYPAL_PRO_MONTHLY     = 'YOUR_PRO_MONTHLY_PLAN_ID'
const PAYPAL_PRO_YEARLY      = 'YOUR_PRO_YEARLY_PLAN_ID'

// ── Data ─────────────────────────────────────────────────────────────
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
  { id:'firm',   label:'Firm',          desc:'Professional & direct' },
  { id:'urgent', label:'Urgent',        desc:'Escalating pressure' },
  { id:'final',  label:'Final Warning', desc:'Last chance before action' },
]

const COUNTRIES = [
  { code:'US', label:'🇺🇸 United States' },
  { code:'CA', label:'🇨🇦 Canada' },
  { code:'AU', label:'🇦🇺 Australia' },
  { code:'UK', label:'🇬🇧 United Kingdom' },
]

const PLANS = [
  {
    name:'Free', price:'$0', period:'forever',
    desc:'Try Clawback risk-free',
    features:['2 letters per month','9 dispute types','US, CA, AU, UK laws','Copy to clipboard'],
    locked:['PDF download','Phone script','Follow-up letter'],
    cta:'Start Free', highlight:false,
    isFree:true,
  },
  {
    name:'Starter', price:'$5', yearlyPrice:'$4.17', yearlyTotal:'$50', period:'per month',
    desc:'For active disputes',
    features:['Unlimited letters','PDF download','Phone script generator','Follow-up escalation letter','9 dispute types','All 4 countries'],
    locked:['BBB complaint template','Small claims guide'],
    cta:'Get Starter', highlight:false,
    paypalMonthly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_STARTER_MONTHLY}`,
    paypalYearly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_STARTER_YEARLY}`,
  },
  {
    name:'Pro', price:'$15', yearlyPrice:'$12.42', yearlyTotal:'$149', period:'per month',
    badge:'Best Value',
    desc:'Maximum results',
    features:['Everything in Starter','BBB complaint template','Small claims court guide','Priority email support','New templates first','Success tips per case'],
    locked:[],
    cta:'Get Pro', highlight:true,
    paypalMonthly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_PRO_MONTHLY}`,
    paypalYearly:()=>`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PAYPAL_PRO_YEARLY}`,
  },
]

const REVIEWS = [
  { name:'James T.',  location:'Austin, TX',    rating:5, text:'Got $340 back from my landlord who kept my deposit for 3 months. Sent the letter Monday, had a check by Friday.', dispute:'Deposit' },
  { name:'Sarah M.',  location:'Toronto, CA',   rating:5, text:'My ISP overcharged me for 6 months. One letter from Clawback and they refunded $180 within 48 hours.', dispute:'Overcharge' },
  { name:'David K.',  location:'Sydney, AU',    rating:5, text:'Insurance denied my claim twice. Used Final Warning tone — they called me next day to settle. $2,400 back.', dispute:'Insurance' },
  { name:'Emma R.',   location:'London, UK',    rating:5, text:'Letter cited the exact Consumer Rights Act section. Company settled immediately. Free tool that actually works.', dispute:'Refund' },
  { name:'Mike L.',   location:'Chicago, IL',   rating:5, text:'Contractor took my $800 deposit and disappeared. Sent the letter, he refunded everything within a week.', dispute:'Contractor' },
  { name:'Priya S.',  location:'Vancouver, CA', rating:4, text:'Really impressed how specific the letter was. Airline refunded my cancelled flight within a week of sending.', dispute:'Airline' },
]

const TIPS = {
  overcharge:   ['Send via certified mail — legal proof of delivery','File a credit card chargeback simultaneously','Screenshot billing page before company updates it','Report to state AG if ignored after 30 days'],
  refund:       ['File a chargeback with your bank if you paid by card','Screenshot company refund policy immediately','BBB complaint — many resolve within 48 hours','Keep all receipts and email correspondence'],
  deposit:      ['Photograph property before leaving — every room','Send certified mail AND email for double proof','Small Claims Court — landlords almost always settle','Request itemized deductions list within 5 days'],
  insurance:    ['File state Insurance Commissioner complaint simultaneously','Request exact policy clause used to deny, in writing','Independent estimate to counter their assessment','Hire public adjuster for claims over $5,000'],
  airline:      ['File with DOT Aviation Consumer Protection simultaneously','Dispute charge with credit card if paid by card','Keep all boarding passes and booking confirmations','Check credit card for travel protection coverage'],
  subscription: ['Dispute as unauthorized with your bank immediately','Screenshot cancellation confirmation right now','File FTC complaint at reportfraud.ftc.gov','Check your state for specific auto-renewal laws'],
  contractor:   ['File with state contractor licensing board today','Get 2–3 independent repair estimates','Post honest reviews on Google and Yelp','Small Claims Court handles up to $25,000'],
  employer:     ['File wage claim with Department of Labor simultaneously','FLSA violations = up to double unpaid wages','Keep every pay stub, timesheet, employment contract','Local employment attorneys often offer free consultations'],
  other:        ['Send certified mail with return receipt','File with state Attorney General consumer division','Document everything — photos, emails, dates','Small Claims Court is affordable, no attorney needed'],
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
    final:`This is my final attempt to resolve directly. Failure to respond triggers immediate regulatory complaints and legal action.`,
  }
  const openings = {
    firm:'I am writing to formally dispute',
    urgent:'I am writing to formally dispute and demand immediate resolution of',
    final:'FINAL NOTICE — I am writing regarding my unresolved dispute concerning',
  }
  return `${form.yourName||'[YOUR FULL NAME]'}
${form.city||'[YOUR CITY]'}
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

${form.yourName||'[YOUR FULL NAME]'}
${form.city||'[YOUR CITY]'}

Enclosures: [Attach all relevant receipts, correspondence, and documentation]`
}

const FREE_LIMIT = 2
function getLetterCount() {
  try {
    const d = JSON.parse(localStorage.getItem('cb_usage')||'{}')
    const month = new Date().toISOString().slice(0,7)
    return d.month===month ? (d.count||0) : 0
  } catch { return 0 }
}
function incrementLetterCount() {
  try {
    const month = new Date().toISOString().slice(0,7)
    localStorage.setItem('cb_usage', JSON.stringify({ month, count: getLetterCount()+1 }))
  } catch {}
}

// ── Animated Particle Background ─────────────────────────────────────
function AnimatedBg() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, t = 0

    const particles = Array.from({length:60}, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random()-0.5)*0.0003,
      vy: (Math.random()-0.5)*0.0003,
      r: Math.random()*2+0.5,
      opacity: Math.random()*0.5+0.1,
    }))

    const orbs = [
      { x:0.15, y:0.2,  r:0.38, color:'108,71,255',  speed:0.00025 },
      { x:0.85, y:0.15, r:0.32, color:'139,92,246',  speed:0.00020 },
      { x:0.5,  y:0.85, r:0.30, color:'99,102,241',  speed:0.00030 },
      { x:0.9,  y:0.75, r:0.25, color:'167,139,250', speed:0.00035 },
    ]

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function draw() {
      t++
      ctx.clearRect(0,0,canvas.width,canvas.height)

      // Background gradient
      const bg = ctx.createLinearGradient(0,0,canvas.width,canvas.height)
      bg.addColorStop(0,'#0a0618')
      bg.addColorStop(0.5,'#0d0825')
      bg.addColorStop(1,'#080614')
      ctx.fillStyle = bg
      ctx.fillRect(0,0,canvas.width,canvas.height)

      // Glowing orbs
      orbs.forEach((orb,i) => {
        const x = (orb.x + Math.sin(t*orb.speed + i*2.1)*0.15) * canvas.width
        const y = (orb.y + Math.cos(t*orb.speed + i*1.7)*0.12) * canvas.height
        const r = orb.r * Math.min(canvas.width, canvas.height)
        const g = ctx.createRadialGradient(x,y,0,x,y,r)
        g.addColorStop(0,`rgba(${orb.color},0.18)`)
        g.addColorStop(0.5,`rgba(${orb.color},0.06)`)
        g.addColorStop(1,`rgba(${orb.color},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x,y,r,0,Math.PI*2)
        ctx.fill()
      })

      // Moving grid lines
      ctx.strokeStyle = 'rgba(108,71,255,0.06)'
      ctx.lineWidth = 1
      const gridSize = 80
      const offsetX = (t * 0.2) % gridSize
      const offsetY = (t * 0.15) % gridSize
      for (let x = -gridSize+offsetX; x < canvas.width+gridSize; x+=gridSize) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke()
      }
      for (let y = -gridSize+offsetY; y < canvas.height+gridSize; y+=gridSize) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke()
      }

      // Floating particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x<0) p.x=1; if (p.x>1) p.x=0
        if (p.y<0) p.y=1; if (p.y>1) p.y=0
        const px = p.x * canvas.width
        const py = p.y * canvas.height
        const pulse = Math.sin(t*0.02 + p.x*10) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(px, py, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(167,139,250,${p.opacity*pulse})`
        ctx.fill()
      })

      // Connect nearby particles
      ctx.strokeStyle = 'rgba(108,71,255,0.12)'
      ctx.lineWidth = 0.5
      for (let i=0; i<particles.length; i++) {
        for (let j=i+1; j<particles.length; j++) {
          const dx = (particles[i].x-particles[j].x)*canvas.width
          const dy = (particles[i].y-particles[j].y)*canvas.height
          const dist = Math.sqrt(dx*dx+dy*dy)
          if (dist < 120) {
            ctx.globalAlpha = (1-dist/120)*0.4
            ctx.beginPath()
            ctx.moveTo(particles[i].x*canvas.width, particles[i].y*canvas.height)
            ctx.lineTo(particles[j].x*canvas.width, particles[j].y*canvas.height)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>
}

// ── Logo SVG inline ───────────────────────────────────────────────────
function LogoIcon({ size=36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6c47ff"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#lg1)"/>
      {/* Shield */}
      <path d="M18 7 L10 10.5 L10 20 Q10 25.5 18 29 Q26 25.5 26 20 L26 10.5 Z"
        fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      {/* 3 claw marks */}
      <path d="M14.5 17 Q16 19 14.5 21.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M18 16 Q19.5 18 18 20.5"   stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M21.5 17 Q20 19 21.5 21.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── App ───────────────────────────────────────────────────────────────
// ── BBB Templates per dispute type ───────────────────────────────────
const BBB_TEMPLATES = {
  overcharge: (form) => `BBB COMPLAINT FORM - BILLING DISPUTE

Company Name: ${form.company}
Category: Billing/Collections
Date of Transaction: [DATE OF CHARGE]
Amount: $${form.amount||'[AMOUNT]'}

COMPLAINT DETAILS:
${form.description}

DESIRED RESOLUTION:
${form.desired || 'Full refund of the disputed amount'}

I have attempted to resolve this directly with ${form.company} without success. I am requesting BBB's assistance in reaching a fair resolution.`,

  refund: (form) => `BBB COMPLAINT FORM - REFUND DISPUTE

Company Name: ${form.company}
Category: Refund/Exchange Issues
Amount: $${form.amount||'[AMOUNT]'}

COMPLAINT DETAILS:
${form.description}

DESIRED RESOLUTION:
${form.desired || 'Full refund processed within 14 days'}

${form.company} has refused to honor their refund policy. I am requesting BBB intervention.`,

  deposit: (form) => `BBB COMPLAINT FORM - SECURITY DEPOSIT

Company Name: ${form.company}
Category: Rental/Lease Issues
Amount: $${form.amount||'[AMOUNT]'}

COMPLAINT DETAILS:
${form.description}

DESIRED RESOLUTION:
${form.desired || 'Return of full security deposit'}`,

  other: (form) => `BBB COMPLAINT FORM

Company Name: ${form.company}
Amount in Dispute: $${form.amount||'[AMOUNT]'}

COMPLAINT DETAILS:
${form.description}

DESIRED RESOLUTION:
${form.desired || 'Fair resolution of the dispute'}`,
}

const SMALL_CLAIMS = {
  US: `SMALL CLAIMS COURT GUIDE (United States)

STEP 1 — CHECK YOUR LIMIT
• Most states: $5,000–$10,000 limit (California up to $12,500)
• Find your state limit at: uscourts.gov

STEP 2 — FILE THE CLAIM
• Go to your local courthouse or file online at your county court website
• Filing fee: usually $30–$100
• You do NOT need a lawyer

STEP 3 — SERVE THE DEFENDANT
• Mail a certified copy to the company's registered agent
• Find registered agent at your Secretary of State website

STEP 4 — PREPARE YOUR EVIDENCE
• Print all emails, receipts, billing statements
• Print this dispute letter as evidence you tried to resolve it
• Bring photos if relevant

STEP 5 — COURT DATE
• Arrive 15 minutes early
• State your case calmly and factually
• Judge usually rules same day

TIPS:
✓ Companies often settle before court date when they receive the summons
✓ You can claim filing fees back if you win
✓ Most cases take 30–60 days from filing to hearing`,

  CA: `SMALL CLAIMS COURT GUIDE (Canada)

STEP 1 — CHECK YOUR LIMIT
• Ontario: up to $35,000
• BC: up to $35,000
• Alberta: up to $50,000
• Other provinces: $20,000–$35,000

STEP 2 — FILE THE CLAIM
• Go to your local courthouse
• Filing fee: $75–$200 depending on amount
• File in the province where the company operates

STEP 3 — SERVE THE DEFENDANT
• Must serve personally or by registered mail
• Keep proof of delivery

STEP 4 — PREPARE YOUR EVIDENCE
• All written communication, receipts, contracts
• This dispute letter as evidence of good faith attempt

TIPS:
✓ Most companies settle after receiving court notice
✓ Bring 3 copies of all documents to court`,

  AU: `SMALL CLAIMS / TRIBUNAL GUIDE (Australia)

STEP 1 — CHOOSE THE RIGHT FORUM
• NCAT (NSW): up to $40,000
• VCAT (Victoria): up to $100,000
• QCAT (Queensland): up to $25,000
• Check your state tribunal website

STEP 2 — FILE ONLINE
• Most tribunals have online filing
• Fee: $50–$200 depending on claim amount

STEP 3 — MEDIATION FIRST
• Most tribunals require mediation attempt
• Keep records of all settlement attempts

TIPS:
✓ ACCC complaints often resolve issues before tribunal
✓ No lawyers allowed in most small claims hearings`,

  UK: `SMALL CLAIMS COURT GUIDE (United Kingdom)

STEP 1 — CHECK YOUR LIMIT
• Small claims track: up to £10,000
• Fast track: £10,000–£25,000

STEP 2 — FILE ONLINE
• Go to: moneyclaim.gov.uk
• Filing fee: £35–£455 based on claim amount

STEP 3 — SEND LETTER BEFORE CLAIM
• You must send this dispute letter first (pre-action protocol)
• Give 14 days to respond before filing

STEP 4 — PREPARE EVIDENCE
• All written communication and receipts
• Photos, contracts, bank statements

TIPS:
✓ Many companies pay rather than appear in court
✓ You can claim court costs back if you win`,
}

// ── Plan Features Component ───────────────────────────────────────────
function PlanFeatures({ userPlan, letter, form, disputeType, tips }) {
  const [activeFeature, setActiveFeature] = useState(null)
  const [phoneScript, setPhoneScript] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [loading, setLoading] = useState(false)

  async function generateGroqContent(prompt) {
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('No key')
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+apiKey },
        body:JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], max_tokens:600, temperature:0.7 })
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch(e) { return '' }
    finally { setLoading(false) }
  }

  async function handlePhoneScript() {
    setActiveFeature('phone')
    if (phoneScript) return
    const script = await generateGroqContent(
      `Write a short phone call script for someone disputing with ${form.company||'a company'} about: ${form.description||'an overcharge'}. 
      They want: ${form.desired||'a full refund'}.
      Format as: Opening → State the dispute → Reference the letter sent → Make the demand → Handle resistance → Close.
      Keep it under 300 words. Use [PAUSE] for natural pauses. Make it confident but professional.`
    )
    setPhoneScript(script || `Hello, my name is ${form.yourName||'[YOUR NAME]'} and I'm calling regarding a dispute with ${form.company||'your company'}.

I recently sent a formal dispute letter regarding: ${form.description||'an issue with my account'}.

[PAUSE]

I am calling to follow up and confirm you received my letter, and to request an update on the resolution timeline I specified — which was ${form.desired||'a full refund'}.

[PAUSE]

I have documented everything in writing and I expect a response within the timeframe stated in my letter. Can you confirm receipt and give me a reference number for this call?

[PAUSE — note down the reference number]

Thank you. I look forward to your written response.`)
  }

  async function handleFollowUp() {
    setActiveFeature('followup')
    if (followUp) return
    const script = await generateGroqContent(
      `Write a follow-up escalation dispute letter for someone who sent a first dispute letter to ${form.company||'a company'} about: ${form.description||'an overcharge'} and got no response.
      Amount: $${form.amount||'the disputed amount'}. Desired outcome: ${form.desired||'full refund'}.
      This should be more urgent than the first letter. Reference that the first letter was ignored.
      Include: RE: FINAL ESCALATION NOTICE, reference to first letter, shorter 7-day deadline, stronger consequences.
      From: ${form.yourName||'[YOUR NAME]'}, ${form.city||'[CITY]'}, ${form.country||'US'}. Under 300 words.`
    )
    setFollowUp(script || `${form.yourName||'[YOUR NAME]'}
${form.city||'[YOUR CITY]'}
${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}

${form.company||'[COMPANY]'}

RE: FINAL ESCALATION — NO RESPONSE TO PRIOR DISPUTE LETTER

Dear ${form.company||'[COMPANY]'} Team,

This letter serves as formal notice that you have failed to respond to my dispute letter sent previously regarding: ${form.description||'the described matter'}.

Your failure to respond is unacceptable. I am now reducing my deadline to 7 DAYS from the date of this letter.

If I do not receive a written resolution by this deadline, I will immediately file complaints with all relevant regulatory bodies, initiate a credit card chargeback, and pursue all available legal remedies including Small Claims Court — without further notice.

This is your final opportunity to resolve this matter directly.

Sincerely,
${form.yourName||'[YOUR NAME]'}`)
  }

  function handlePDF() {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Dispute Letter - Clawback</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.8; padding: 60px; max-width: 700px; margin: 0 auto; color: #1a1a1a; }
        h2 { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 24px; }
        pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.8; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { button { display: none } }
      </style></head>
      <body>
        <h2>Generated by Clawback · getclawback.com</h2>
        <pre>${letter}</pre>
        <div class="footer">This letter was generated by Clawback for informational purposes only. Clawback is not a law firm.</div>
        <br/><button onclick="window.print()" style="padding:12px 24px;background:#6c47ff;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-top:16px">🖨️ Print / Save as PDF</button>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
  }

  function handleBBB() {
    setActiveFeature('bbb')
  }

  function handleSmallClaims() {
    setActiveFeature('smallclaims')
  }

  const bbbText = (BBB_TEMPLATES[disputeType] || BBB_TEMPLATES.other)(form)
  const smallClaimsText = SMALL_CLAIMS[form.country] || SMALL_CLAIMS.US

  const btnStyle = (primary) => ({
    padding:'12px 16px',
    background: primary ? 'linear-gradient(135deg,#6c47ff,#8b5cf6)' : 'rgba(255,255,255,.06)',
    border: primary ? 'none' : '1px solid rgba(108,71,255,.2)',
    borderRadius:10, color: primary ? '#fff' : 'var(--text)',
    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
    display:'flex', alignItems:'center', gap:8, transition:'all .15s',
    width:'100%', textAlign:'left',
  })

  const contentBox = {
    marginTop:16, background:'rgba(0,0,0,.15)', border:'1px solid rgba(108,71,255,.2)',
    borderRadius:10, padding:20, fontSize:13, lineHeight:1.8,
    whiteSpace:'pre-wrap', color:'var(--text)', maxHeight:400, overflowY:'auto',
    fontFamily:"'Plus Jakarta Sans',sans-serif",
  }

  return (
    <div style={{marginTop:28,background:'rgba(108,71,255,.08)',border:'1px solid rgba(108,71,255,.2)',borderRadius:14,padding:24}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--accent3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:16}}>
        ✦ {userPlan==='starter'?'Starter':'Pro'} Plan Features
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>

        {/* PDF DOWNLOAD */}
        <button style={btnStyle(true)} onClick={handlePDF}>
          📄 Download PDF
        </button>

        {/* PHONE SCRIPT */}
        <button style={btnStyle(false)} onClick={handlePhoneScript}>
          📞 Phone Script {activeFeature==='phone'&&!phoneScript&&loading?'...':''}
        </button>

        {/* FOLLOW-UP LETTER */}
        <button style={btnStyle(false)} onClick={handleFollowUp}>
          🔄 Follow-up Letter {activeFeature==='followup'&&!followUp&&loading?'...':''}
        </button>

        {/* BBB TEMPLATE — Pro only */}
        {userPlan==='pro' && (
          <button style={btnStyle(false)} onClick={handleBBB}>
            ⭐ BBB Complaint Template
          </button>
        )}

        {/* SMALL CLAIMS — Pro only */}
        {userPlan==='pro' && (
          <button style={btnStyle(false)} onClick={handleSmallClaims}>
            ⚖️ Small Claims Guide
          </button>
        )}

        {/* PRIORITY SUPPORT — Pro only */}
        {userPlan==='pro' && (
          <a href="mailto:support@getclawback.gmail.com?subject=Priority Support Request"
            style={{...btnStyle(false), textDecoration:'none'}}>
            🎯 Priority Email Support
          </a>
        )}
      </div>

      {/* SUCCESS TIPS — Pro only */}
      {userPlan==='pro' && (
        <div style={{marginTop:12,padding:'14px 16px',background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',borderRadius:10}}>
          <div style={{fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>
            ✦ Success Tips for Your Dispute Type
          </div>
          {(tips||[]).map((tip,i)=>(
            <div key={i} style={{fontSize:12,color:'var(--muted)',marginBottom:6,display:'flex',gap:8}}>
              <span style={{color:'#10b981',fontWeight:700}}>✓</span>{tip}
            </div>
          ))}
        </div>
      )}

      {/* NEW TEMPLATES NOTE — Pro only */}
      {userPlan==='pro' && (
        <div style={{marginTop:10,fontSize:12,color:'var(--muted)',padding:'10px 14px',background:'rgba(108,71,255,.06)',borderRadius:8,border:'1px solid rgba(108,71,255,.15)'}}>
          ⚡ <strong style={{color:'var(--accent3)'}}>New Templates First:</strong> As a Pro member you get access to new dispute templates before they launch to free users. Watch your email.
        </div>
      )}

      {/* CONTENT DISPLAY AREA */}
      {activeFeature==='phone' && (
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--accent3)',margin:'16px 0 6px',letterSpacing:'.06em',textTransform:'uppercase'}}>📞 Your Phone Script</div>
          {loading && !phoneScript ? <div style={{color:'var(--muted)',fontSize:13,padding:16}}>Generating your script...</div>
          : <div style={contentBox}>{phoneScript}</div>}
          {phoneScript && <button style={{marginTop:8,padding:'8px 16px',background:'var(--accent)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{navigator.clipboard.writeText(phoneScript)}}>Copy Script</button>}
        </div>
      )}

      {activeFeature==='followup' && (
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--accent3)',margin:'16px 0 6px',letterSpacing:'.06em',textTransform:'uppercase'}}>🔄 Your Follow-up Escalation Letter</div>
          {loading && !followUp ? <div style={{color:'var(--muted)',fontSize:13,padding:16}}>Generating follow-up letter...</div>
          : <div style={contentBox}>{followUp}</div>}
          {followUp && <button style={{marginTop:8,padding:'8px 16px',background:'var(--accent)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{navigator.clipboard.writeText(followUp)}}>Copy Letter</button>}
        </div>
      )}

      {activeFeature==='bbb' && (
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--accent3)',margin:'16px 0 6px',letterSpacing:'.06em',textTransform:'uppercase'}}>⭐ BBB Complaint Template</div>
          <div style={contentBox}>{bbbText}</div>
          <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
            <button style={{padding:'8px 16px',background:'var(--accent)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{navigator.clipboard.writeText(bbbText)}}>Copy Template</button>
            <a href="https://www.bbb.org/file-a-complaint" target="_blank" rel="noreferrer" style={{padding:'8px 16px',background:'transparent',border:'1px solid rgba(108,71,255,.3)',borderRadius:8,color:'var(--accent3)',fontSize:12,fontWeight:700,textDecoration:'none'}}>File at BBB.org →</a>
          </div>
        </div>
      )}

      {activeFeature==='smallclaims' && (
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--accent3)',margin:'16px 0 6px',letterSpacing:'.06em',textTransform:'uppercase'}}>⚖️ Small Claims Court Guide</div>
          <div style={contentBox}>{smallClaimsText}</div>
          <button style={{marginTop:8,padding:'8px 16px',background:'var(--accent)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{navigator.clipboard.writeText(smallClaimsText)}}>Copy Guide</button>
        </div>
      )}

      <div style={{fontSize:11,color:'var(--muted)',marginTop:14}}>
        ✓ PDF opens print dialog · Phone Script + Follow-up generated by AI · BBB template pre-filled with your details
      </div>
    </div>
  )
}


export default function App() {
  const [screen, setScreen] = useState('home')
  const [user, setUser] = useState(null)
  const [disputeType, setDisputeType] = useState(null)
  const [form, setForm] = useState({ company:'', amount:'', description:'', desired:'', tone:'firm', yourName:'', city:'', country:'US' })
  const [letter, setLetter] = useState('')
  const [tips, setTips] = useState([])
  const [copied, setCopied] = useState(false)
  const [wordIdx, setWordIdx] = useState(0)
  const [billing, setBilling] = useState('monthly')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [letterCount, setLetterCount] = useState(getLetterCount())
  const [darkMode, setDarkMode] = useState(true)
  const [testPlan, setTestPlan] = useState('free') // for testing only: 'free' | 'starter' | 'pro'

  const words = ['Overcharges','Denied Refunds','Stolen Deposits','Ignored Complaints','Unfair Charges']

  // Show signup modal on first visit
  useEffect(() => {
    const visited = localStorage.getItem('cb_visited')
    if (!visited && !user) {
      setTimeout(() => setShowAuthModal(true), 1500)
      localStorage.setItem('cb_visited', '1')
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setWordIdx(p=>(p+1)%words.length), 2400)
    return () => clearInterval(t)
  }, [])

  function handleGoogleSignIn() {
    // Production: integrate Firebase Google OAuth
    const mockUser = { name:'Demo User', email:'demo@gmail.com', avatar:'D', plan:'free' }
    setUser(mockUser)
    setShowAuthModal(false)
    localStorage.setItem('cb_usage', JSON.stringify({ month:new Date().toISOString().slice(0,7), count:0 }))
    setLetterCount(0)
  }

  function signOut() { setUser(null); setLetterCount(getLetterCount()) }

  const userPlan = TESTING_MODE ? testPlan : (user?.plan || 'free')
  const canGenerate = TESTING_MODE ? true : (userPlan !== 'free' || letterCount < FREE_LIMIT)

  async function generate() {
    if (!disputeType || !form.company || !form.description) return
    if (!canGenerate) { setShowAuthModal(true); return }
    setScreen('loading')
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('No key')
      const typeInfo = DISPUTE_TYPES.find(d=>d.id===disputeType)
      const toneInfo = TONES.find(t=>t.id===form.tone)
      const deadline = { firm:14, urgent:10, final:7 }[form.tone] || 14
      const today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})
      const prompt =
        "You are a consumer rights attorney. Write a powerful specific dispute letter.\n\n" +
        "DISPUTE: "+typeInfo.label+"\nCOMPANY: "+form.company+"\nAMOUNT: "+(form.amount?"$"+form.amount:"unspecified")+
        "\nSITUATION: "+form.description+"\nDESIRED: "+(form.desired||"full refund/resolution")+
        "\nTONE: "+toneInfo.label+"\nSENDER: "+(form.yourName||"[YOUR NAME]")+", "+(form.city||"[CITY]")+", "+form.country+
        "\nDEADLINE: "+deadline+" days\nDATE: "+today+"\n\n"+
        "Write a complete formal dispute letter with sender block, date, company recipient, RE: subject in caps, "+
        "opening, specific situation, real consumer protection laws for "+form.country+", "+deadline+
        "-day deadline with exact date, consequences if ignored, professional closing. Under 400 words."
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+apiKey },
        body:JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], max_tokens:1000, temperature:0.7 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message||'error')
      const text = data.choices?.[0]?.message?.content
      setLetter(text && text.length>80 ? text : generateTemplate({disputeType,form}))
    } catch { setLetter(generateTemplate({disputeType,form})) }
    if (userPlan==='free') { incrementLetterCount(); setLetterCount(getLetterCount()) }
    setTips(TIPS[disputeType]||TIPS.other)
    setScreen('result')
  }

  function copyLetter() { navigator.clipboard.writeText(letter); setCopied(true); setTimeout(()=>setCopied(false),2500) }

  function reset() { setScreen('home'); setLetter(''); setDisputeType(null); setForm({ company:'',amount:'',description:'',desired:'',tone:'firm',yourName:'',city:'',country:'US' }); window.scrollTo(0,0) }

  const C = { // CSS vars shorthand for inline styles
    accent:'#6c47ff', text:'#e8e4ff', muted:'#8b85b0', dark:'#0a0618',
    surface:'rgba(255,255,255,0.06)', border:'rgba(108,71,255,0.2)',
    success:'#10b981',
  }

  const cardStyle = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(108,71,255,0.2)', borderRadius:16, backdropFilter:'blur(4px)' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        /* DEFAULT = DARK MODE */
        :root{
          --accent:#6c47ff;
          --accent2:#8b5cf6;
          --accent3:#a78bfa;
          --success:#10b981;
        }
        /* DARK MODE VARS */
        .dark-mode{
          --bg:#0a0618;
          --text:#e8e4ff;
          --muted:#8b85b0;
          --border:rgba(108,71,255,0.2);
          --surface:rgba(255,255,255,0.05);
          --card:rgba(255,255,255,0.05);
          --nav-bg:rgba(10,6,24,0.88);
          --input-bg:rgba(255,255,255,0.06);
          --reviews-fade-l:linear-gradient(90deg,#0a0618,transparent);
          --reviews-fade-r:linear-gradient(-90deg,#0a0618,transparent);
        }
        /* LIGHT MODE VARS */
        .light-mode{
          --bg:#f0eeff;
          --text:#1a1040;
          --muted:#6b6895;
          --border:rgba(108,71,255,0.15);
          --surface:rgba(255,255,255,0.95);
          --card:#ffffff;
          --nav-bg:rgba(240,238,255,0.92);
          --input-bg:#ffffff;
          --reviews-fade-l:linear-gradient(90deg,#f0eeff,transparent);
          --reviews-fade-r:linear-gradient(-90deg,#f0eeff,transparent);
        }
        /* LIGHT MODE OVERRIDES */
        .light-mode .hero-h1,.light-mode .sec-title,.light-mode .how-card h3,
        .light-mode .type-label,.light-mode .fcard-head h2,.light-mode .result-title,
        .light-mode .loading-wrap h2,.light-mode .policy-wrap h1,.light-mode .policy-wrap h2,
        .light-mode .plan-price,.light-mode .review-name,.light-mode .tone-name,
        .light-mode .modal h2{color:#1a1040!important}
        .light-mode .logo-claw{color:#1a1040!important}
        .light-mode .hero-sub,.light-mode .how-card p,.light-mode .type-desc,
        .light-mode .review-text,.light-mode .plan-desc,.light-mode .review-loc,
        .light-mode .loading-wrap p,.light-mode .policy-wrap p,.light-mode .modal p,
        .light-mode .field label,.light-mode .tone-small{color:#6b6895!important}
        .light-mode .how-card,.light-mode .type-card,.light-mode .review-card,
        .light-mode .plan-card,.light-mode .fcard,.light-mode .tip-item,
        .light-mode .disclaimer,.light-mode .modal{background:#ffffff;box-shadow:0 2px 20px rgba(108,71,255,.08)}
        .light-mode .fcard-body{background:#faf9ff}
        .light-mode .fcard-head{background:rgba(108,71,255,.05)}
        .light-mode .stats-bar{background:rgba(255,255,255,.9)}
        .light-mode .stat-n{color:#1a1040!important}
        .light-mode .letter-box{background:#ffffff;color:#1a1040}
        .light-mode .field input,.light-mode .field textarea,.light-mode .field select{background:#ffffff;color:#1a1040;border-color:rgba(108,71,255,.2)}
        .light-mode .tone-btn{background:#f5f3ff;border-color:rgba(108,71,255,.15);color:#1a1040}
        .light-mode .tone-btn.selected{background:rgba(108,71,255,.08);border-color:var(--accent)}
        .light-mode .google-btn{background:#f5f3ff;color:#1a1040;border-color:rgba(108,71,255,.2)}
        .light-mode .r-btn-out{background:#f5f3ff;color:#1a1040;border-color:rgba(108,71,255,.2)}
        .light-mode .plan-feat,.light-mode .feat-no{color:#1a1040}
        .light-mode .review-footer .review-tag{background:rgba(108,71,255,.08)}
        .light-mode .modal-benefit{background:rgba(108,71,255,.05)}
        .light-mode .modal-benefit-item{color:#6b6895}
        .light-mode .modal-skip{color:#6b6895}
        .light-mode .how-num{box-shadow:0 4px 14px rgba(108,71,255,.2)}
        .light-mode body,.light-mode .app{color:var(--text)}
        .light-mode .hero-h1,.light-mode .sec-title,.light-mode .how-card h3,.light-mode .type-label,.light-mode .fcard-head h2,.light-mode .result-title,.light-mode .loading-wrap h2,.light-mode .policy-wrap h1,.light-mode .policy-wrap h2,.light-mode .plan-price,.light-mode .plan-name,.light-mode .review-name{color:#1a1040!important}
        .light-mode .logo-claw{color:#1a1040!important}
        .light-mode .nav{background:var(--nav-bg)}
        .light-mode .how-card,.light-mode .type-card,.light-mode .review-card,.light-mode .plan-card,.light-mode .fcard,.light-mode .stats-bar{background:rgba(255,255,255,0.9);box-shadow:0 2px 20px rgba(108,71,255,.08)}
        .light-mode .letter-box{background:rgba(255,255,255,.95);color:#1a1040}
        .light-mode .field input,.light-mode .field textarea,.light-mode .field select{background:rgba(255,255,255,.9);color:#1a1040}
        .light-mode .tone-btn{background:rgba(255,255,255,.9);color:#1a1040}
        .light-mode .tone-name{color:#1a1040!important}
        .light-mode .modal{background:#ffffff}
        .light-mode .google-btn{background:rgba(0,0,0,.04);color:#1a1040}
        .light-mode .modal h2,.light-mode .modal p{color:#1a1040}
        .light-mode .reviews-wrap::before{background:linear-gradient(90deg,#f8f7ff,transparent)!important}
        .light-mode .reviews-wrap::after{background:linear-gradient(-90deg,#f8f7ff,transparent)!important}
        .light-mode .review-text,.light-mode .how-card p,.light-mode .type-desc{color:#6b6895}
        .light-mode .fcard-body{background:#f8f7ff}
        html{scroll-behavior:smooth}
        body{background:transparent;color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;line-height:1.6;overflow-x:hidden}
        ::selection{background:var(--accent);color:#fff}
        .app{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:0 24px 100px}

        /* NAV */
        .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
        .logo{display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none}
        .logo-text{font-size:22px;font-weight:800;letter-spacing:-0.5px}
        .logo-claw{color:#fff}
        .logo-back{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nav-right{display:flex;align-items:center;gap:8px}
        .nav-btn{padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .nav-ghost{background:transparent;color:var(--muted)}
        .nav-ghost:hover{color:var(--text);background:var(--surface)}
        .nav-solid{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 4px 14px rgba(108,71,255,.35)}
        .nav-solid:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(108,71,255,.45)}
        .user-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .letter-chip{background:rgba(108,71,255,.15);color:var(--accent3);font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;border:1px solid var(--border)}

        /* HERO */
        .hero{padding:90px 0 70px;text-align:center}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(108,71,255,.12);border:1px solid var(--border);color:var(--accent3);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:8px 18px;border-radius:100px;margin-bottom:36px}
        .hero-dot{width:6px;height:6px;background:var(--success);border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .hero-h1{font-size:clamp(42px,7vw,82px);font-weight:800;line-height:1.0;letter-spacing:-3px;color:#fff;margin-bottom:0}
        .hero-rotating{font-size:clamp(42px,7vw,82px);font-weight:800;line-height:1.05;letter-spacing:-3px;background:linear-gradient(135deg,var(--accent),var(--accent2),#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;min-height:1.12em;animation:wIn .4s cubic-bezier(.34,1.56,.64,1)}
        @keyframes wIn{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}
        .hero-sub{font-size:18px;color:var(--muted);max-width:520px;margin:28px auto 48px;line-height:1.75}
        .hero-ctas{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:72px}
        .btn-main{padding:16px 34px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;box-shadow:0 8px 28px rgba(108,71,255,.4)}
        .btn-main:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(108,71,255,.5)}
        .btn-ghost{padding:16px 24px;background:rgba(255,255,255,.05);color:var(--text);border:1.5px solid var(--border);border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .btn-ghost:hover{border-color:var(--accent3);color:#fff;background:rgba(108,71,255,.08)}

        /* STATS */
        .stats-bar{display:flex;justify-content:center;flex-wrap:wrap;max-width:600px;margin:0 auto;border-radius:20px;overflow:hidden;border:1px solid var(--border);background:rgba(255,255,255,.04)}
        .stat-cell{flex:1;min-width:120px;padding:22px 16px;text-align:center;border-right:1px solid var(--border)}
        .stat-cell:last-child{border:none}
        .stat-n{font-size:28px;font-weight:800;color:#fff;display:block;letter-spacing:-1px}
        .stat-l{font-size:11px;color:var(--muted);font-weight:500;margin-top:4px}

        /* SECTION */
        .sec{padding:72px 0}
        .sec-eye{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent3);margin-bottom:14px}
        .sec-title{font-size:clamp(26px,4vw,46px);font-weight:800;letter-spacing:-1.5px;color:#fff;text-align:center;margin-bottom:12px}
        .sec-sub{font-size:16px;color:var(--muted);text-align:center;max-width:480px;margin:0 auto 48px;line-height:1.65}

        /* HOW */
        .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:640px){.how-grid{grid-template-columns:1fr}}
        .how-card{border-radius:18px;padding:28px;transition:all .25s;border:1px solid var(--border);background:var(--card)}
        .how-card:hover{transform:translateY(-6px);border-color:var(--accent3);box-shadow:0 20px 48px rgba(108,71,255,.15)}
        .how-num{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;margin-bottom:18px;box-shadow:0 4px 14px rgba(108,71,255,.4)}
        .how-card h3{font-size:16px;font-weight:700;margin-bottom:8px;color:#fff}
        .how-card p{font-size:13px;color:var(--muted);line-height:1.65}

        /* TYPES */
        .types-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:640px){.types-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:380px){.types-grid{grid-template-columns:1fr}}
        .type-card{border-radius:14px;padding:18px 16px;cursor:pointer;text-align:left;transition:all .2s;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;width:100%}
        .type-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 10px 28px rgba(108,71,255,.2)}
        .type-card.selected{border-color:var(--accent);background:rgba(108,71,255,.12)}
        .type-icon{font-size:22px;margin-bottom:10px;display:block}
        .type-label{font-size:13px;font-weight:700;display:block;margin-bottom:4px;color:#fff}
        .type-desc{font-size:11px;color:var(--muted);line-height:1.4}

        /* REVIEWS */
        .reviews-wrap{overflow:hidden;position:relative;margin:0 -24px}
        .reviews-wrap::before,.reviews-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
        .reviews-wrap::before{left:0;background:var(--reviews-fade-l)}
        .reviews-wrap::after{right:0;background:var(--reviews-fade-r)}
        .reviews-track{display:flex;gap:16px;animation:scroll 36s linear infinite;width:max-content;padding:8px 24px}
        .reviews-track:hover{animation-play-state:paused}
        @keyframes scroll{to{transform:translateX(-50%)}}
        .review-card{border-radius:18px;padding:24px;width:300px;flex-shrink:0;border:1px solid var(--border);background:var(--card);transition:all .2s}
        .review-card:hover{border-color:var(--accent3);transform:translateY(-4px)}
        .review-stars{color:#f59e0b;font-size:13px;margin-bottom:10px;letter-spacing:2px}
        .review-text{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:16px;font-style:italic}
        .review-footer{display:flex;align-items:center;justify-content:space-between}
        .review-name{font-size:13px;font-weight:700;color:#fff}
        .review-loc{font-size:11px;color:var(--muted)}
        .review-tag{font-size:10px;font-weight:700;background:rgba(108,71,255,.2);color:var(--accent3);padding:3px 10px;border-radius:100px;border:1px solid var(--border)}

        /* PRICING */
        .billing-toggle{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:40px}
        .tog-label{font-size:14px;font-weight:600;color:var(--muted);transition:color .2s}
        .tog-label.active{color:#fff}
        .tog-switch{width:48px;height:26px;background:var(--accent);border-radius:13px;cursor:pointer;position:relative;border:none;box-shadow:0 2px 10px rgba(108,71,255,.4)}
        .tog-switch::after{content:'';position:absolute;width:20px;height:20px;background:#fff;border-radius:50%;top:3px;left:3px;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
        .tog-switch.yearly::after{transform:translateX(22px)}
        .save-pill{background:rgba(16,185,129,.15);color:var(--success);font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;border:1px solid rgba(16,185,129,.25)}
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:700px){.pricing-grid{grid-template-columns:1fr}}
        .plan-card{border-radius:22px;padding:32px 28px;position:relative;transition:all .25s;border:1.5px solid var(--border);background:var(--card)}
        .plan-card.highlight{border-color:var(--accent);background:rgba(108,71,255,.08);box-shadow:0 16px 48px rgba(108,71,255,.2)}
        .plan-card:hover:not(.highlight){transform:translateY(-4px);border-color:var(--accent3)}
        .plan-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:11px;font-weight:700;padding:5px 16px;border-radius:100px;letter-spacing:.06em;white-space:nowrap;box-shadow:0 4px 14px rgba(108,71,255,.4)}
        .plan-name{font-size:12px;font-weight:700;color:var(--accent3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
        .plan-price{font-size:48px;font-weight:800;color:#fff;letter-spacing:-2px;line-height:1}
        .plan-period{font-size:14px;color:var(--muted);font-weight:500}
        .plan-yearly-note{font-size:12px;color:var(--success);font-weight:700;margin-top:4px}
        .plan-desc{font-size:13px;color:var(--muted);margin:12px 0 0;padding-bottom:20px;border-bottom:1px solid var(--border)}
        .plan-feats{list-style:none;margin:20px 0 28px;display:flex;flex-direction:column;gap:10px}
        .plan-feat{font-size:13px;display:flex;align-items:flex-start;gap:10px;color:var(--text)}
        .feat-yes{color:var(--success);font-weight:700;flex-shrink:0}
        .feat-no{font-size:12px;color:var(--muted);opacity:.4;display:flex;align-items:flex-start;gap:10px;text-decoration:line-through}
        .plan-btn{width:100%;padding:14px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;display:block;text-align:center;text-decoration:none}
        .plan-btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 4px 16px rgba(108,71,255,.4)}
        .plan-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(108,71,255,.5)}
        .plan-btn-outline{background:transparent;color:var(--text);border:1.5px solid var(--border)}
        .plan-btn-outline:hover{border-color:var(--accent3);color:#fff;background:rgba(108,71,255,.08)}
        .test-badge{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.25);color:var(--success);font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;margin-left:8px;letter-spacing:.04em}

        /* DISCLAIMER */
        .disclaimer{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:14px;padding:18px 22px;margin:40px 0;display:flex;gap:12px;align-items:flex-start}
        .disclaimer p{font-size:12px;color:var(--muted);line-height:1.7}
        .disclaimer strong{color:var(--text)}

        /* FORM */
        .form-wrap{max-width:720px;margin:0 auto}
        .fcard{border-radius:18px;overflow:hidden;margin-bottom:16px;border:1px solid var(--border);background:rgba(255,255,255,.04)}
        .fcard-head{padding:20px 26px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:rgba(108,71,255,.06)}
        .fcard-step{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:.08em}
        .fcard-head h2{font-size:16px;font-weight:700;color:#fff}
        .fcard-body{padding:24px}
        .field{margin-bottom:18px}
        .field:last-child{margin-bottom:0}
        .field label{display:block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
        .field input,.field textarea,.field select{width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:var(--text);outline:none;transition:border-color .15s;resize:vertical}
        .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent)}
        .field input::placeholder,.field textarea::placeholder{color:rgba(139,133,176,.4)}
        .field select option{background:#0d0825;color:var(--text)}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
        @media(max-width:540px){.two-col,.three-col{grid-template-columns:1fr}}
        .tone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:480px){.tone-grid{grid-template-columns:1fr}}
        .tone-btn{background:rgba(255,255,255,.05);border:1.5px solid var(--border);border-radius:12px;padding:14px;cursor:pointer;text-align:left;color:var(--text);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
        .tone-btn:hover{border-color:var(--accent3);background:rgba(108,71,255,.08)}
        .tone-btn.selected{border-color:var(--accent);background:rgba(108,71,255,.12)}
        .tone-name{font-size:13px;font-weight:700;display:block;margin-bottom:4px;color:#fff}
        .tone-small{font-size:11px;color:var(--muted);line-height:1.4}
        .gen-btn{width:100%;padding:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:700;cursor:pointer;transition:all .25s;margin-top:24px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 28px rgba(108,71,255,.4)}
        .gen-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 40px rgba(108,71,255,.5)}
        .gen-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
        .limit-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:12px;padding:16px 20px;margin-top:16px;display:flex;gap:12px;align-items:flex-start}
        .limit-warn p{font-size:13px;color:var(--text);line-height:1.55}
        .limit-warn strong{color:#f59e0b}

        /* LOADING */
        .loading-wrap{text-align:center;padding:100px 20px}
        .spinner{width:48px;height:48px;border:3px solid rgba(108,71,255,.2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 24px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-wrap h2{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px}
        .loading-wrap p{color:var(--muted);font-size:14px}

        /* RESULT */
        .result-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px}
        .ready-badge{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);color:var(--success);font-size:11px;font-weight:700;padding:5px 13px;border-radius:100px;letter-spacing:.06em}
        .result-title{font-size:22px;font-weight:800;color:#fff}
        .result-actions{display:flex;gap:8px;flex-wrap:wrap}
        .r-btn{padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s}
        .r-btn-main{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
        .r-btn-out{background:var(--surface);color:var(--text);border:1.5px solid var(--border)}
        .r-btn-out:hover{border-color:var(--accent3);color:#fff}
        .letter-box{background:rgba(255,255,255,.05);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:14px;padding:28px;font-size:13.5px;line-height:1.85;white-space:pre-wrap;font-family:'Plus Jakarta Sans',sans-serif;color:var(--text);max-height:520px;overflow-y:auto}
        .letter-box::-webkit-scrollbar{width:4px}
        .letter-box::-webkit-scrollbar-track{background:transparent}
        .letter-box::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
        .tips-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:28px 0 14px;display:flex;align-items:center;gap:10px}
        .tips-label::after{content:'';flex:1;height:1px;background:var(--border)}
        .tips-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:500px){.tips-grid{grid-template-columns:1fr}}
        .tip-item{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:14px;font-size:12px;color:var(--muted);line-height:1.55;display:flex;gap:10px;align-items:flex-start}

        /* BACK */
        .back{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:6px;padding:24px 0 20px;font-weight:600;transition:color .15s}
        .back:hover{color:var(--accent3)}

        /* AUTH MODAL */
        .modal-overlay{position:fixed;inset:0;background:rgba(10,6,24,.8);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px;backdrop-filter:blur(8px)}
        .modal{background:#13102b;border:1px solid var(--border);border-radius:24px;width:100%;max-width:420px;padding:36px;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.5)}
        .modal h2{font-size:24px;font-weight:800;color:#fff;margin-bottom:10px;letter-spacing:-0.5px}
        .modal p{font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.65}
        .google-btn{width:100%;padding:15px;background:rgba(255,255,255,.07);border:1.5px solid var(--border);border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;transition:all .2s;color:#fff;margin-bottom:12px}
        .google-btn:hover{border-color:var(--accent);background:rgba(108,71,255,.1);transform:translateY(-1px)}
        .google-icon{width:20px;height:20px;flex-shrink:0}
        .modal-skip{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;transition:color .15s}
        .modal-skip:hover{color:var(--text)}
        .modal-benefit{background:rgba(108,71,255,.1);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:24px;text-align:left}
        .modal-benefit-item{display:flex;gap:10px;align-items:center;font-size:13px;color:var(--muted);margin-bottom:8px}
        .modal-benefit-item:last-child{margin:0}
        .modal-benefit-item span:first-child{color:var(--success);font-size:14px}

        /* POLICY */
        .policy-wrap{max-width:720px;margin:0 auto;padding:40px 0}
        .policy-wrap h1{font-size:32px;font-weight:800;color:#fff;margin-bottom:8px;letter-spacing:-1px}
        .policy-date{font-size:13px;color:var(--muted);margin-bottom:36px}
        .policy-wrap h2{font-size:18px;font-weight:700;color:#fff;margin:32px 0 10px}
        .policy-wrap p{font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:14px}

        /* FOOTER */
        .footer{border-top:1px solid var(--border);padding:40px 0;text-align:center;color:var(--muted);font-size:13px;margin-top:60px}
        .footer-logo{font-size:20px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px}
        .footer a{color:var(--accent3);text-decoration:none}
        .footer a:hover{color:#fff}

        /* TOAST */
        /* THEME TOGGLE */
        .theme-toggle{position:fixed;bottom:24px;right:24px;z-index:200;background:rgba(108,71,255,.15);border:1px solid rgba(108,71,255,.3);border-radius:100px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:700;color:var(--accent3);display:flex;align-items:center;gap:6px;backdrop-filter:blur(12px);transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
        .theme-toggle:hover{background:rgba(108,71,255,.25);transform:translateY(-2px)}
        .light-mode .theme-toggle{background:rgba(255,255,255,.9);border-color:rgba(108,71,255,.2);color:var(--accent)}

        /* TEST PLAN SWITCHER */
        .test-switcher{position:fixed;bottom:24px;left:24px;z-index:200;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:12px;padding:10px 14px;backdrop-filter:blur(12px);font-family:'Plus Jakarta Sans',sans-serif}
        .test-switcher-label{font-size:10px;font-weight:700;color:var(--success);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}
        .test-switcher-btns{display:flex;gap:6px}
        .test-plan-btn{padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid rgba(16,185,129,.25);background:transparent;color:var(--success);font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s}
        .test-plan-btn.active{background:rgba(16,185,129,.2);border-color:var(--success)}
        .test-plan-btn:hover{background:rgba(16,185,129,.15)}

        .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#13102b;border:1px solid var(--border);color:#fff;padding:13px 28px;border-radius:12px;font-weight:700;font-size:14px;z-index:9999;animation:tIn .2s ease;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,.4)}
        @keyframes tIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>

      {darkMode && <AnimatedBg />}
      {/* Full-width background for light mode */}
      {!darkMode && <div style={{position:'fixed',inset:0,background:'#f0eeff',zIndex:0}}/>}

      <div className={`app ${darkMode?"dark-mode":"light-mode"}`} style={{position:'relative',zIndex:1}}>

        {/* NAV */}
        <nav className="nav">
          <div className="logo" onClick={reset}>
            <LogoIcon size={36}/>
            <span className="logo-text">
              <span className="logo-claw">Claw</span><span className="logo-back">back</span>
            </span>
          </div>
          <div className="nav-right">
            {screen==='home' && (
              <button className="nav-btn nav-ghost" onClick={()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}>
                Pricing
              </button>
            )}
            {user ? (
              <>
                <span className="letter-chip">
                  {userPlan==='free' ? `${Math.max(0,FREE_LIMIT-letterCount)} free left` : '∞ Pro'}
                </span>
                <div className="user-av" title="Sign out" onClick={signOut}>{user.avatar}</div>
              </>
            ) : (
              <button className="nav-btn nav-solid" onClick={()=>setShowAuthModal(true)}>
                Sign Up
              </button>
            )}
            {screen!=='home' && <button className="nav-btn nav-ghost" onClick={reset}>← Home</button>}
          </div>
        </nav>

        {/* HOME */}
        {screen==='home' && (<>

          <section className="hero">
            <div className="hero-badge"><span className="hero-dot"/>Free · Instant · No Hidden Fees</div>
            <h1 className="hero-h1">Stop accepting</h1>
            <span className="hero-rotating" key={wordIdx}>{words[wordIdx]}</span>
            <p className="hero-sub">Generate a legally-sharp dispute letter in seconds. Trusted by thousands to recover money from companies that count on you giving up.</p>
            <div className="hero-ctas">
              <button className="btn-main" onClick={()=>setScreen('form')}>Generate My Letter ⚡</button>
              <button className="btn-ghost" onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>See how it works</button>
            </div>
            <div className="stats-bar">
              <div className="stat-cell"><span className="stat-n">$2.8T</span><div className="stat-l">Overcharged yearly</div></div>
              <div className="stat-cell"><span className="stat-n">73%</span><div className="stat-l">Resolved with letter</div></div>
              <div className="stat-cell"><span className="stat-n">9</span><div className="stat-l">Dispute types</div></div>
              <div className="stat-cell"><span className="stat-n">4</span><div className="stat-l">Countries</div></div>
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
                {n:'02',title:'Describe what happened',body:'Tell us the company name and what went wrong. The more specific you are, the stronger the letter.'},
                {n:'03',title:'Copy and send it',body:'Instant letter with real consumer protection laws. Copy, send certified mail, get your money back.'},
              ].map(s=>(
                <div className="how-card" key={s.n}>
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
            <p className="sec-sub">Click any category to start your letter immediately.</p>
            <div className="types-grid">
              {DISPUTE_TYPES.map(d=>(
                <button key={d.id} className="type-card" onClick={()=>{setDisputeType(d.id);setScreen('form')}}>
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
                  <div className="review-card" key={i}>
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
            <p className="sec-sub">Free plan gives 2 letters per month. Upgrade for unlimited + PDF + phone scripts.</p>

            <div className="billing-toggle">
              <span className={`tog-label ${billing==='monthly'?'active':''}`}>Monthly</span>
              <button className={`tog-switch ${billing==='yearly'?'yearly':''}`} onClick={()=>setBilling(b=>b==='monthly'?'yearly':'monthly')}/>
              <span className={`tog-label ${billing==='yearly'?'active':''}`}>Yearly</span>
              {billing==='yearly' && <span className="save-pill">Save 17%</span>}
            </div>

            {TESTING_MODE && (
              <div style={{textAlign:'center',marginBottom:20,padding:'10px',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',borderRadius:10,fontSize:13,color:'var(--success)'}}>
                🧪 Testing mode — all plans are free to check features
              </div>
            )}

            <div className="pricing-grid">
              {PLANS.map(p=>(
                <div key={p.name} className={`plan-card ${p.highlight?'highlight':''}`}>
                  {p.badge && <div className="plan-badge">{p.badge}</div>}
                  <div className="plan-name">{p.name}</div>
                  <div>
                    <span className="plan-price">
                      {TESTING_MODE && !p.isFree ? '$0' : billing==='yearly'&&p.yearlyPrice&&!p.isFree ? p.yearlyPrice : p.price}
                    </span>
                    <span className="plan-period">
                      {p.isFree ? '/forever' : TESTING_MODE ? ' (free to test)' : billing==='yearly' ? '/mo' : `/${p.period}`}
                    </span>
                    {TESTING_MODE && !p.isFree && <span className="test-badge">TESTING</span>}
                  </div>
                  {billing==='yearly' && p.yearlyTotal && !TESTING_MODE && !p.isFree && (
                    <div className="plan-yearly-note">{p.yearlyTotal}/year · save 17%</div>
                  )}
                  <div className="plan-desc">{p.desc}</div>
                  <ul className="plan-feats">
                    {p.features.map(f=>(
                      <li className="plan-feat" key={f}><span className="feat-yes">✓</span>{f}</li>
                    ))}
                    {p.locked && p.locked.map(f=>(
                      <li className="feat-no" key={f}><span style={{flexShrink:0}}>—</span>{f}</li>
                    ))}
                  </ul>
                  {p.isFree ? (
                    <button className="plan-btn plan-btn-outline" onClick={()=>setScreen('form')}>
                      Start Free — No Card Needed
                    </button>
                  ) : TESTING_MODE ? (
                    <button className="plan-btn plan-btn-outline" onClick={()=>setScreen('form')}>
                      Test {p.name} Features Free →
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
          </section>

          {/* DISCLAIMER */}
          <div className="disclaimer">
            <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
            <p><strong>Legal Disclaimer:</strong> Clawback generates dispute letter templates for informational purposes only. We are not a law firm and do not provide legal advice. Letters are based on general consumer protection laws and may not apply to every situation. For complex legal matters, consult a qualified attorney. Results are not guaranteed.</p>
          </div>

          {/* FINAL CTA */}
          <section style={{padding:'64px 0',textAlign:'center',borderTop:'1px solid var(--border)'}}>
            <h2 style={{fontSize:'clamp(26px,4vw,46px)',fontWeight:800,letterSpacing:'-1.5px',color:'var(--text)',marginBottom:14}}>Ready to fight back?</h2>
            <p style={{fontSize:16,color:'var(--muted)',marginBottom:32,maxWidth:380,margin:'0 auto 32px'}}>Generate your first letter free. No signup required.</p>
            <button className="btn-main" style={{margin:'0 auto'}} onClick={()=>setScreen('form')}>Generate My Letter — Free ⚡</button>
          </section>
        </>)}

        {/* FORM */}
        {screen==='form' && (<>
          <button className="back" onClick={reset}>← Back to home</button>
          <div className="form-wrap">
            <div style={{marginBottom:24,textAlign:'center'}}>
              <h2 style={{fontSize:26,fontWeight:800,color:'var(--text)',letterSpacing:'-0.5px'}}>Build your dispute letter</h2>
              <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Takes about 2 minutes</p>
              {TESTING_MODE && (
                <div style={{marginTop:12,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.25)',borderRadius:10,padding:'10px 16px',fontSize:13,color:'var(--success)'}}>
                  🧪 Testing as <strong>{testPlan.charAt(0).toUpperCase()+testPlan.slice(1)} plan</strong> — switch plans using the button at bottom-left
                  {testPlan==='free' && ' · 2 letters/month · Copy only'}
                  {testPlan==='starter' && ' · Unlimited · PDF · Phone script · Follow-up letter'}
                  {testPlan==='pro' && ' · Everything · BBB template · Small claims guide · Priority support'}
                </div>
              )}
              {!user && (
                <div style={{marginTop:10,fontSize:12,color:'var(--muted)'}}>
                  {Math.max(0,FREE_LIMIT-letterCount)} free letter{FREE_LIMIT-letterCount===1?'':'s'} remaining ·{' '}
                  <span style={{color:'var(--accent3)',cursor:'pointer',fontWeight:600}} onClick={()=>setShowAuthModal(true)}>Sign up to save history</span>
                </div>
              )}
            </div>

            <div className="fcard">
              <div className="fcard-head"><span className="fcard-step">Step 1</span><h2>Dispute type</h2></div>
              <div className="fcard-body">
                <div className="types-grid">
                  {DISPUTE_TYPES.map(d=>(
                    <button key={d.id} className={`type-card ${disputeType===d.id?'selected':''}`} onClick={()=>setDisputeType(d.id)}>
                      <span className="type-icon">{d.icon}</span>
                      <span className="type-label">{d.label}</span>
                      <span className="type-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="fcard">
              <div className="fcard-head"><span className="fcard-step">Step 2</span><h2>What happened?</h2></div>
              <div className="fcard-body">
                <div className="two-col">
                  <div className="field"><label>Company name *</label><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="e.g. Comcast, John Smith"/></div>
                  <div className="field"><label>Amount in dispute</label><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="e.g. 350"/></div>
                </div>
                <div className="field">
                  <label>Describe what happened *</label>
                  <textarea rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Specific dates, what was promised, what happened, any prior attempts to resolve..."/>
                </div>
                <div className="field"><label>What do you want?</label><input value={form.desired} onChange={e=>setForm({...form,desired:e.target.value})} placeholder="e.g. Full refund of $350, fix the work, return deposit"/></div>
              </div>
            </div>

            <div className="fcard">
              <div className="fcard-head"><span className="fcard-step">Step 3</span><h2>Your details & tone</h2></div>
              <div className="fcard-body">
                <div className="three-col" style={{marginBottom:20}}>
                  <div className="field" style={{marginBottom:0}}><label>Your name</label><input value={form.yourName} onChange={e=>setForm({...form,yourName:e.target.value})} placeholder="Full name"/></div>
                  <div className="field" style={{marginBottom:0}}><label>City / State</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="e.g. Austin, TX"/></div>
                  <div className="field" style={{marginBottom:0}}>
                    <label>Country</label>
                    <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})}>
                      {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Letter Tone</div>
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
                      <p><strong>2 free letters used this month.</strong><br/>Sign up to track usage or upgrade for unlimited letters.</p>
                      <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                        <button className="nav-btn nav-solid" style={{padding:'8px 16px',fontSize:13}} onClick={()=>setShowAuthModal(true)}>Sign Up with Google</button>
                        <button style={{padding:'8px 16px',fontSize:13,background:'transparent',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text)',cursor:'pointer',fontFamily:'inherit',fontWeight:600}} onClick={()=>{reset();setTimeout(()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}),100)}}>View Plans →</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="gen-btn" disabled={!disputeType||!form.company||!form.description} onClick={generate}>
                    ⚡ Generate My Dispute Letter
                  </button>
                )}
                {canGenerate && (!disputeType||!form.company||!form.description) && (
                  <p style={{textAlign:'center',fontSize:12,color:'var(--muted)',marginTop:10}}>Select dispute type, company and description to continue</p>
                )}
              </div>
            </div>
          </div>
        </>)}

        {/* LOADING */}
        {screen==='loading' && (
          <div className="loading-wrap">
            <div className="spinner"/>
            <h2 style={{color:'var(--text)'}}>Writing your dispute letter...</h2>
            <p>AI is drafting a specific letter with real consumer protection laws for your situation.</p>
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
          {/* PLAN SPECIFIC FEATURES */}
          {(userPlan==='starter'||userPlan==='pro') && (
            <PlanFeatures userPlan={userPlan} letter={letter} form={form} disputeType={disputeType} tips={tips}/>
          )}

          {userPlan==='free' && (
            <div style={{textAlign:'center',marginTop:48,paddingTop:40,borderTop:'1px solid var(--border)'}}>
              <p style={{fontSize:14,color:'var(--muted)',marginBottom:20}}>Need unlimited letters + PDF + phone scripts?</p>
              <button className="btn-main" style={{margin:'0 auto'}} onClick={()=>{reset();setTimeout(()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}),100)}}>
                View Plans →
              </button>
            </div>
          )}
        </>)}

        {/* PRIVACY */}
        {screen==='privacy' && (
          <div className="policy-wrap">
            <button className="back" onClick={()=>setScreen('home')}>← Back</button>
            <h1>Privacy Policy</h1>
            <p className="policy-date">Last updated: April 2026</p>
            <h2>1. Information We Collect</h2>
            <p>Clawback does not store personal information on our servers. All dispute details stay in your browser only.</p>
            <p>Letter text is sent to Groq AI to generate a response, governed by Groq's privacy policy at groq.com.</p>
            <h2>2. Google Sign Up</h2>
            <p>If you sign up with Google, we receive your name, email and profile picture. This is only used to track your letter usage and is not shared with any third party.</p>
            <h2>3. Cookies</h2>
            <p>We use localStorage to track how many free letters you have used this month. We do not use tracking cookies or analytics tools.</p>
            <h2>4. Payments</h2>
            <p>All payments are processed by PayPal. We do not store payment information.</p>
            <h2>5. Contact</h2>
            <p>Questions? Email us at getclawback@gmail.com</p>
          </div>
        )}

        {/* TERMS */}
        {screen==='terms' && (
          <div className="policy-wrap">
            <button className="back" onClick={()=>setScreen('home')}>← Back</button>
            <h1>Terms of Use</h1>
            <p className="policy-date">Last updated: April 2026</p>
            <h2>1. Not Legal Advice</h2>
            <p>Clawback is a letter generation tool, not a law firm. Letters are for informational purposes only and do not constitute legal advice. For legal matters, consult a qualified attorney.</p>
            <h2>2. No Guarantee of Results</h2>
            <p>Clawback does not guarantee that sending a dispute letter will result in a refund or resolution. Results depend on the specific circumstances and the other party's response.</p>
            <h2>3. Acceptable Use</h2>
            <p>You agree to use Clawback only for legitimate consumer disputes. You must not use Clawback to generate fraudulent, misleading or harassing communications.</p>
            <h2>4. Accuracy of Information</h2>
            <p>You are responsible for ensuring the information you provide is accurate and truthful.</p>
            <h2>5. Free Plan Limitations</h2>
            <p>The free plan allows 2 letters per month. Clawback reserves the right to enforce these limits at any time.</p>
            <h2>6. Subscriptions and Refunds</h2>
            <p>Paid subscriptions are billed through PayPal. You may cancel at any time through your PayPal account. Refunds are available within 7 days of payment if no paid features have been used.</p>
            <h2>7. Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. Continued use constitutes acceptance.</p>
            <h2>8. Contact</h2>
            <p>Questions about these terms? Email us at getclawback@gmail.com</p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-logo">
            <LogoIcon size={26}/>
            <span style={{fontWeight:800}}>
              <span style={{color:'var(--text)'}}>Claw</span>
              <span style={{background:'linear-gradient(135deg,#6c47ff,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>back</span>
            </span>
          </div>
          <p>Free consumer defence tool for US, Canada, Australia & UK</p>
          <p style={{marginTop:10}}>
            <a href="#" onClick={e=>{e.preventDefault();setScreen('privacy')}}>Privacy Policy</a>
            {' · '}
            <a href="#" onClick={e=>{e.preventDefault();setScreen('terms')}}>Terms of Use</a>
          </p>
          <p style={{marginTop:10,fontSize:11,color:'var(--muted)'}}>Clawback is not a law firm. Letters are for informational purposes only.</p>
        </footer>
      </div>

      {/* THEME TOGGLE */}
      <button className="theme-toggle" onClick={()=>setDarkMode(d=>!d)}>
        {darkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
      </button>

      {/* TEST PLAN SWITCHER - remove before launch */}
      {TESTING_MODE && (
        <div className="test-switcher">
          <div className="test-switcher-label">🧪 Test as plan:</div>
          <div className="test-switcher-btns">
            {['free','starter','pro'].map(p=>(
              <button key={p} className={`test-plan-btn ${testPlan===p?'active':''}`} onClick={()=>setTestPlan(p)}>
                {p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAuthModal(false)}>
          <div className="modal">
            <LogoIcon size={44} style={{margin:'0 auto 16px'}}/>
            <h2 style={{marginTop:16}}>Sign up to Clawback</h2>
            <p>Free forever. Sign up to save your letter history and track usage across devices.</p>
            <div className="modal-benefit">
              <div className="modal-benefit-item"><span>✓</span>2 free dispute letters every month</div>
              <div className="modal-benefit-item"><span>✓</span>Save your letter history</div>
              <div className="modal-benefit-item"><span>✓</span>Track usage across all devices</div>
            </div>
            <button className="google-btn" onClick={handleGoogleSignIn}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="modal-skip" onClick={()=>setShowAuthModal(false)}>
              Skip for now — continue without signing up
            </button>
          </div>
        </div>
      )}

      {copied && <div className="toast">✓ Copied to clipboard!</div>}
    </>
  )
}
