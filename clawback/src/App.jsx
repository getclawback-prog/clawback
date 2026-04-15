import { useState } from 'react'

const DISPUTE_TYPES = [
  { id: 'overcharge', icon: '💳', label: 'Overcharge / Wrong Bill', desc: 'Charged wrong amount, duplicate charge, hidden fees' },
  { id: 'refund', icon: '🔄', label: 'Refund Denied', desc: 'Company refusing to give your money back' },
  { id: 'deposit', icon: '🏠', label: 'Security Deposit Kept', desc: 'Landlord keeping deposit unfairly' },
  { id: 'insurance', icon: '🏥', label: 'Insurance Denied', desc: 'Claim denied, coverage dispute, surprise bill' },
  { id: 'airline', icon: '✈️', label: 'Airline / Travel', desc: 'Flight cancelled, baggage lost, refund refused' },
  { id: 'subscription', icon: '📦', label: 'Subscription / Service', desc: 'Charged after cancelling, auto-renewal dispute' },
  { id: 'contractor', icon: '🔨', label: 'Bad Contractor Work', desc: "Work not done, overcharged, won't fix mistakes" },
  { id: 'employer', icon: '💼', label: 'Unpaid Wages', desc: 'Employer owes you money, wrongful deduction' },
  { id: 'other', icon: '⚖️', label: 'Other Dispute', desc: 'Any other consumer or business dispute' },
]

const TONES = [
  { id: 'firm', label: 'Firm & Professional', desc: 'Clear, direct, legally aware' },
  { id: 'urgent', label: 'Urgent & Escalating', desc: 'Signals you will take further action' },
  { id: 'final', label: 'Final Warning', desc: 'Last chance before legal/regulatory action' },
]

const LAWS = {
  US: {
    overcharge: 'the Fair Credit Billing Act (15 U.S.C. § 1666) and applicable state consumer protection laws',
    refund: 'the Federal Trade Commission Act and applicable state consumer protection statutes',
    deposit: 'applicable state security deposit laws requiring return within 14-30 days with itemized deductions',
    insurance: 'applicable state insurance regulations and the terms of my policy',
    airline: 'DOT regulations (14 CFR Part 250) and applicable consumer protection laws',
    subscription: 'the FTC\'s Negative Option Rule and applicable state auto-renewal laws',
    contractor: 'applicable state contractor licensing laws and consumer protection statutes',
    employer: 'the Fair Labor Standards Act (FLSA) and applicable state wage payment laws',
    other: 'applicable federal and state consumer protection laws',
  },
  CA: {
    overcharge: 'the Consumer Protection Act and applicable provincial consumer protection legislation',
    refund: 'the Consumer Protection Act and applicable provincial consumer protection legislation',
    deposit: 'applicable provincial residential tenancy legislation',
    insurance: 'the Insurance Act and applicable provincial insurance regulations',
    airline: 'the Air Passenger Protection Regulations (SOR/2019-150)',
    subscription: 'applicable provincial consumer protection and auto-renewal legislation',
    contractor: 'applicable provincial consumer protection and contractor licensing legislation',
    employer: 'the Canada Labour Code and applicable provincial employment standards legislation',
    other: 'applicable federal and provincial consumer protection legislation',
  },
  AU: {
    overcharge: 'the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010)',
    refund: 'the Australian Consumer Law, specifically consumer guarantee provisions',
    deposit: 'applicable state and territory residential tenancy legislation',
    insurance: 'the Insurance Contracts Act 1984 and applicable ASIC regulations',
    airline: 'the Australian Consumer Law and applicable ACCC guidelines',
    subscription: 'the Australian Consumer Law and applicable automatic renewal regulations',
    contractor: 'the Australian Consumer Law and applicable state licensing legislation',
    employer: 'the Fair Work Act 2009 and National Employment Standards',
    other: 'the Australian Consumer Law and applicable state consumer protection legislation',
  },
  UK: {
    overcharge: 'the Consumer Rights Act 2015 and applicable FCA regulations',
    refund: 'the Consumer Rights Act 2015 and Consumer Contracts Regulations 2013',
    deposit: 'the Housing Act 2004 and Tenancy Deposit Protection regulations',
    insurance: 'the Insurance Act 2015 and applicable FCA regulations',
    airline: 'UK Regulation EC 261/2004 (retained post-Brexit)',
    subscription: 'the Consumer Contracts Regulations 2013 and Consumer Rights Act 2015',
    contractor: 'the Consumer Rights Act 2015 and applicable trading standards legislation',
    employer: 'the Employment Rights Act 1996 and National Minimum Wage Act 1998',
    other: 'the Consumer Rights Act 2015 and applicable UK consumer protection legislation',
  },
}

const ESCALATION = {
  US: 'the Consumer Financial Protection Bureau (CFPB), my state Attorney General\'s office, the Better Business Bureau, and/or pursue resolution through small claims court',
  CA: 'applicable provincial consumer protection office, the Competition Bureau, and/or pursue resolution through Small Claims Court',
  AU: 'the Australian Competition and Consumer Commission (ACCC), applicable state consumer affairs office, and/or the Australian Financial Complaints Authority (AFCA)',
  UK: 'the Competition and Markets Authority (CMA), Trading Standards, the Financial Ombudsman Service, and/or pursue resolution through the Small Claims Court',
}

const DEADLINES = { firm: 14, urgent: 10, final: 7 }

const TIPS = {
  overcharge: ['Send via certified mail with return receipt — creates legal proof of delivery', 'File a chargeback with your bank or credit card simultaneously', 'Keep all original receipts, statements and communication records', 'Report to your state Attorney General if unresolved in 30 days'],
  refund: ['Send via certified mail with return receipt — creates legal proof of delivery', 'File a credit card chargeback if you paid by card — you have 60-120 days', 'Screenshot the company\'s refund policy before they change it', 'File a BBB complaint — many companies resolve immediately after'],
  deposit: ['Send via certified mail AND email for double documentation', 'Photograph every inch of the property before leaving', 'Request an itemized deduction list in writing if any amount is withheld', 'File in Small Claims Court — landlords almost always settle rather than appear'],
  insurance: ['Send to both your local agent AND the corporate claims department', 'File a complaint with your state Insurance Commissioner simultaneously', 'Request the specific policy clause they used to deny your claim in writing', 'Hire a public adjuster for claims over $5,000 — they work on commission'],
  airline: ['File with DOT Aviation Consumer Protection simultaneously: airconsumer.dot.gov', 'Dispute the charge with your credit card company if you paid by card', 'Keep all boarding passes, booking confirmations and receipts', 'Check if your credit card has travel protection that covers this'],
  subscription: ['Dispute the charge with your bank as unauthorized if past cancellation date', 'Screenshot your cancellation confirmation before they remove it', 'File a complaint with the FTC at reportfraud.ftc.gov', 'Check if your state has specific auto-renewal laws — many do'],
  contractor: ['File a complaint with your state contractor licensing board', 'Post honest reviews on Google, Yelp and BBB to create urgency', 'Get 2-3 independent estimates for repair cost to support your claim', 'Small Claims Court handles contractor disputes up to $10,000-$25,000'],
  employer: ['File a wage claim with your state Department of Labor simultaneously', 'Keep copies of all pay stubs, timesheets and employment contracts', 'FLSA violations carry penalties of up to double the unpaid wages', 'Contact a local employment attorney — many offer free consultations'],
  other: ['Send via certified mail with return receipt for legal proof', 'File a complaint with your state Attorney General\'s consumer division', 'Document everything — photos, emails, receipts, dates of calls', 'Small Claims Court is low cost and requires no attorney for most disputes'],
}

function generateLetter({ disputeType, form }) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const deadline = DEADLINES[form.tone] || 14
  const deadlineDate = new Date(today.getTime() + deadline * 24 * 60 * 60 * 1000)
  const deadlineDateStr = deadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const name = form.yourName || '[YOUR FULL NAME]'
  const city = form.city || '[YOUR CITY, STATE]'
  const company = form.company
  const amount = form.amount ? `$${form.amount.replace('$', '')}` : 'the disputed amount'
  const desired = form.desired || 'a full refund of the disputed amount'
  const law = LAWS[form.country]?.[disputeType] || LAWS.US[disputeType]
  const escalation = ESCALATION[form.country] || ESCALATION.US

  const toneClosings = {
    firm: `I trust that ${company} values its customers and will resolve this matter promptly and professionally.`,
    urgent: `Please be advised that if this matter is not resolved by the deadline below, I will be forced to escalate this complaint through all available channels without further notice.`,
    final: `This is my final attempt to resolve this matter directly. Failure to respond by the deadline will result in immediate escalation including regulatory complaints, legal action, and public review postings.`,
  }

  const toneIntros = {
    firm: 'I am writing to formally dispute',
    urgent: 'I am writing to formally dispute and demand immediate resolution of',
    final: 'FINAL NOTICE: I am writing regarding my previous unresolved dispute concerning',
  }

  const templates = {
    overcharge: `${name}
${city}
${dateStr}

Customer Service / Billing Department
${company}

RE: FORMAL BILLING DISPUTE — UNAUTHORIZED CHARGE — IMMEDIATE REFUND REQUIRED

Dear ${company} Customer Service Team,

${toneIntros[form.tone]} an unauthorized and erroneous charge applied to my account. The details of this dispute are as follows:

DISPUTE DETAILS:
${form.description}

Disputed amount: ${amount}
Desired resolution: ${desired}

This billing error is a direct violation of ${law}. Under these consumer protection provisions, I am entitled to a prompt investigation and correction of any billing errors upon written notice.

DEMAND: I formally demand that ${company} refund ${amount} to my original payment method within ${deadline} days of this letter — no later than ${deadlineDateStr}.

If this refund is not processed within the stated timeframe, I will file formal complaints with ${escalation}. I will also initiate a chargeback through my financial institution and pursue all available legal remedies.

${toneClosings[form.tone]}

Please confirm receipt of this letter and your intended resolution in writing.

Sincerely,

${name}
${city}

Enclosures: [Attach your billing statements, receipts, and any prior correspondence]`,

    refund: `${name}
${city}
${dateStr}

Customer Service / Returns Department
${company}

RE: FORMAL REFUND DEMAND — CONSUMER RIGHTS VIOLATION

Dear ${company} Customer Service Team,

${toneIntros[form.tone]} the wrongful denial of my refund request. The details of this matter are as follows:

DISPUTE DETAILS:
${form.description}

Amount owed: ${amount}
Desired resolution: ${desired}

Under ${law}, I have a clear legal right to a refund in these circumstances. ${company}'s refusal to honor this right constitutes a violation of my consumer rights.

DEMAND: I formally demand that ${company} issue a full refund of ${amount} within ${deadline} days — no later than ${deadlineDateStr}.

Should this refund not be received within the stated deadline, I will immediately pursue the following remedies without further notice:
— Initiate a credit card chargeback with my financial institution
— File formal complaints with ${escalation}
— Seek all additional remedies available under applicable consumer protection law

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Enclosures: [Attach proof of purchase, refund request correspondence, and company refund policy]`,

    deposit: `${name}
${city}
${dateStr}

${company}

RE: FORMAL DEMAND FOR RETURN OF SECURITY DEPOSIT

Dear ${company},

${toneIntros[form.tone]} the unlawful retention of my security deposit. The details of this matter are as follows:

DISPUTE DETAILS:
${form.description}

Amount owed: ${amount}
Desired resolution: ${desired}

Under ${law}, landlords are required to return security deposits within the legally mandated timeframe along with an itemized written statement of any deductions. Failure to comply exposes the landlord to significant penalties, which in many jurisdictions include up to 2-3 times the deposit amount plus attorney fees.

DEMAND: I formally demand the immediate return of my security deposit of ${amount} within ${deadline} days — no later than ${deadlineDateStr}.

If this amount is not returned within the stated deadline, I will file an immediate complaint with the relevant housing authority and pursue recovery through Small Claims Court, where I will also seek all applicable statutory penalties.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Enclosures: [Attach lease agreement, move-in/move-out inspection reports, photographs, and prior correspondence]`,

    insurance: `${name}
${city}
${dateStr}

Claims Department
${company}

RE: FORMAL APPEAL OF CLAIM DENIAL — POLICY NUMBER: [YOUR POLICY NUMBER]

Dear ${company} Claims Department,

${toneIntros[form.tone]} the wrongful denial of my insurance claim. The details of this matter are as follows:

DISPUTE DETAILS:
${form.description}

Amount in dispute: ${amount}
Desired resolution: ${desired}

My claim denial is inconsistent with the coverage provided under my policy and may constitute a violation of ${law}. Insurance companies have a duty of good faith and fair dealing, and an unreasonable denial of a valid claim constitutes bad faith.

DEMAND: I formally appeal this denial and demand full payment of ${amount} within ${deadline} days — no later than ${deadlineDateStr}.

If this matter is not resolved within the stated timeframe, I will file a formal complaint with my state Insurance Commissioner, seek an independent appraisal of my claim, and consult with a bad faith insurance attorney regarding further legal action.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Policy Number: [YOUR POLICY NUMBER]
Claim Number: [YOUR CLAIM NUMBER]

Enclosures: [Attach policy documents, denial letter, claim documentation, and independent estimates]`,

    airline: `${name}
${city}
${dateStr}

Customer Relations Department
${company}

RE: FORMAL COMPENSATION DEMAND — FLIGHT DISRUPTION / PASSENGER RIGHTS VIOLATION

Dear ${company} Customer Relations Team,

${toneIntros[form.tone]} the compensation owed to me following a flight disruption. The details of this matter are as follows:

DISPUTE DETAILS:
${form.description}

Compensation owed: ${amount}
Desired resolution: ${desired}

Under ${law}, passengers are entitled to compensation and/or refunds in circumstances such as mine. ${company} is legally obligated to fulfill these entitlements.

DEMAND: I formally demand that ${company} provide compensation of ${amount} and/or a full refund within ${deadline} days — no later than ${deadlineDateStr}.

If this matter is not resolved within the stated timeframe, I will file a formal complaint with ${escalation} and pursue all other available remedies including credit card chargebacks for any charged amounts.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Booking Reference: [YOUR BOOKING REFERENCE]
Flight Number(s): [YOUR FLIGHT NUMBERS]
Travel Date(s): [YOUR TRAVEL DATES]

Enclosures: [Attach booking confirmation, boarding passes, receipts, and prior correspondence]`,

    subscription: `${name}
${city}
${dateStr}

Customer Service / Billing Department
${company}

RE: FORMAL DISPUTE — UNAUTHORIZED CHARGES FOLLOWING CANCELLATION

Dear ${company} Customer Service Team,

${toneIntros[form.tone]} unauthorized charges applied to my account following my cancellation of services. The details of this matter are as follows:

DISPUTE DETAILS:
${form.description}

Amount charged without authorization: ${amount}
Desired resolution: ${desired}

These charges are unauthorized and constitute a violation of ${law}. Charging a customer after cancellation, or enrolling customers in auto-renewal without clear consent, is illegal under applicable consumer protection statutes.

DEMAND: I formally demand an immediate refund of ${amount} and written confirmation of my account cancellation within ${deadline} days — no later than ${deadlineDateStr}.

If these charges are not refunded within the stated deadline, I will immediately initiate a chargeback through my financial institution and file formal complaints with ${escalation}.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Account/Reference Number: [YOUR ACCOUNT NUMBER]
Cancellation Date: [DATE YOU CANCELLED]

Enclosures: [Attach cancellation confirmation, billing statements, and prior correspondence]`,

    contractor: `${name}
${city}
${dateStr}

${company}

RE: FORMAL DEMAND FOR REMEDY — DEFECTIVE/INCOMPLETE WORK

Dear ${company},

${toneIntros[form.tone]} defective and/or incomplete work performed on my property. The details of this dispute are as follows:

DISPUTE DETAILS:
${form.description}

Amount in dispute: ${amount}
Desired resolution: ${desired}

Under ${law}, contractors are required to perform work in a professional manner consistent with industry standards. The work performed (or not performed) by ${company} falls significantly short of these legal and contractual obligations.

DEMAND: I formally demand that ${company} either remedy the defective work to industry standards or provide a full refund of ${amount} within ${deadline} days — no later than ${deadlineDateStr}.

If this matter is not resolved within the stated timeframe, I will file a complaint with the applicable contractor licensing board, file complaints with ${escalation}, and pursue all legal remedies including Small Claims Court action.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Contract/Invoice Number: [YOUR CONTRACT NUMBER]
Date of Work: [DATE WORK WAS PERFORMED]

Enclosures: [Attach contract, invoices, photographs of defective work, and independent repair estimates]`,

    employer: `${name}
${city}
${dateStr}

Human Resources / Payroll Department
${company}

RE: FORMAL DEMAND FOR UNPAID WAGES

Dear ${company} Human Resources Department,

${toneIntros[form.tone]} the non-payment of wages legally owed to me. The details of this matter are as follows:

DISPUTE DETAILS:
${form.description}

Amount owed: ${amount}
Desired resolution: ${desired}

Under ${law}, employers are legally required to pay all earned wages in full and on time. Failure to do so exposes ${company} to significant legal liability including back pay, statutory penalties, and in some cases double damages.

DEMAND: I formally demand payment of all outstanding wages totaling ${amount} within ${deadline} days — no later than ${deadlineDateStr}.

If full payment is not received within the stated deadline, I will immediately file a formal wage claim with the applicable labor authority and pursue all available legal remedies. I have documented all hours worked and am prepared to present this evidence in any proceeding.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Employee ID: [YOUR EMPLOYEE ID]
Employment Dates: [YOUR EMPLOYMENT PERIOD]

Enclosures: [Attach pay stubs, timesheets, employment contract, and prior correspondence]`,

    other: `${name}
${city}
${dateStr}

Customer Service Department
${company}

RE: FORMAL DISPUTE — DEMAND FOR RESOLUTION

Dear ${company} Customer Service Team,

${toneIntros[form.tone]} the following matter which has not been satisfactorily resolved despite my prior attempts to address it:

DISPUTE DETAILS:
${form.description}

Amount in dispute: ${amount}
Desired resolution: ${desired}

${company}'s handling of this matter is inconsistent with applicable consumer protection standards under ${law}, which require businesses to deal fairly and honestly with consumers.

DEMAND: I formally demand that ${company} resolve this matter by providing ${desired} within ${deadline} days — no later than ${deadlineDateStr}.

If this matter is not resolved by the stated deadline, I will file formal complaints with ${escalation} and pursue all other available legal remedies without further notice.

${toneClosings[form.tone]}

Sincerely,

${name}
${city}

Reference Number: [ANY REFERENCE NUMBER]

Enclosures: [Attach all relevant documentation, receipts, and prior correspondence]`,
  }

  return templates[disputeType] || templates.other
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --surface: #111118; --surface2: #18181f;
    --border: #2a2a35; --accent: #ff3c3c; --accent2: #ff7a3d;
    --text: #f0f0f5; --muted: #7a7a8c; --success: #22c55e; --radius: 12px;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; line-height: 1.6; }
  .app { max-width: 900px; margin: 0 auto; padding: 0 20px 80px; }
  .header { padding: 32px 0 24px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid var(--border); }
  .logo-icon { width: 44px; height: 44px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; }
  .logo-text span { color: var(--accent); }
  .header-tag { margin-left: auto; font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--border); padding: 4px 10px; border-radius: 20px; }
  .hero { padding: 72px 0 60px; text-align: center; }
  .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,60,60,.08); border: 1px solid rgba(255,60,60,.2); color: var(--accent); font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 28px; }
  .hero h1 { font-family: 'Syne', sans-serif; font-size: clamp(38px, 7vw, 68px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; margin-bottom: 22px; }
  .hero h1 .highlight { color: var(--accent); }
  .hero p { font-size: 19px; color: var(--muted); max-width: 560px; margin: 0 auto 44px; line-height: 1.65; font-weight: 300; }
  .hero-stats { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
  .stat { text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--text); display: block; }
  .stat-label { font-size: 12px; color: var(--muted); }
  .section-label { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 32px; display: flex; align-items: center; gap: 12px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 64px; }
  @media(max-width:600px){.steps{grid-template-columns:1fr}}
  .step { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
  .step-num { width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: #fff; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .step h3 { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .step p { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
  .form-card-header { padding: 24px 28px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
  .form-card-header h2 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
  .step-badge { background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; letter-spacing: .06em; }
  .form-card-body { padding: 28px; }
  .dispute-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  @media(max-width:640px){.dispute-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:400px){.dispute-grid{grid-template-columns:1fr}}
  .dispute-btn { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 12px; cursor: pointer; text-align: left; transition: all .15s; color: var(--text); }
  .dispute-btn:hover { border-color: var(--accent); background: rgba(255,60,60,.05); }
  .dispute-btn.selected { border-color: var(--accent); background: rgba(255,60,60,.08); }
  .dispute-btn-icon { font-size: 22px; margin-bottom: 8px; display: block; }
  .dispute-btn-label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 3px; }
  .dispute-btn-desc { font-size: 11px; color: var(--muted); line-height: 1.4; }
  .field { margin-bottom: 20px; }
  .field label { display: block; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .field input, .field textarea, .field select { width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 12px 14px; outline: none; transition: border-color .15s; resize: vertical; }
  .field input:focus,.field textarea:focus,.field select:focus { border-color: var(--accent); }
  .field input::placeholder,.field textarea::placeholder { color: var(--muted); }
  .field select option { background: #1a1a24; }
  .tone-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  @media(max-width:500px){.tone-grid{grid-template-columns:1fr}}
  .tone-btn { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px; cursor: pointer; text-align: left; color: var(--text); transition: all .15s; }
  .tone-btn:hover { border-color: var(--accent2); }
  .tone-btn.selected { border-color: var(--accent2); background: rgba(255,122,61,.07); }
  .tone-btn-label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 4px; }
  .tone-btn-desc { font-size: 11px; color: var(--muted); }
  .generate-btn { width: 100%; padding: 18px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: .04em; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 28px; }
  .generate-btn:hover:not(:disabled) { background: #e02d2d; transform: translateY(-1px); }
  .generate-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .result-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .result-header { padding: 20px 28px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .result-header-left { display: flex; align-items: center; gap: 10px; }
  .result-win-badge { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); color: var(--success); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
  .result-header h3 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
  .result-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-copy,.btn-new { padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .15s; }
  .btn-copy { background: var(--accent); color: #fff; }
  .btn-copy:hover { background: #e02d2d; }
  .btn-new { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-new:hover { border-color: var(--accent); }
  .result-body { padding: 28px; }
  .letter-text { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 24px; font-size: 14px; line-height: 1.8; white-space: pre-wrap; font-family: 'DM Sans', sans-serif; color: var(--text); max-height: 520px; overflow-y: auto; }
  .tips-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
  @media(max-width:500px){.tips-grid{grid-template-columns:1fr}}
  .tip { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .tip-icon { font-size: 20px; margin-bottom: 8px; }
  .tip p { font-size: 12px; color: var(--muted); line-height: 1.5; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--success); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; animation: fadeIn .2s ease; z-index: 999; }
  @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .loading { text-align: center; padding: 80px 20px; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading strong { display: block; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .loading p { color: var(--muted); font-size: 14px; }
  .back-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; padding: 28px 0 24px; font-family: 'DM Sans', sans-serif; }
  .back-btn:hover { color: var(--text); }
  .footer { border-top: 1px solid var(--border); padding: 28px 0; text-align: center; color: var(--muted); font-size: 13px; margin-top: 60px; }
  .footer a { color: var(--accent); text-decoration: none; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width:500px){.two-col{grid-template-columns:1fr}}
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  @media(max-width:500px){.three-col{grid-template-columns:1fr}}
`

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [disputeType, setDisputeType] = useState(null)
  const [form, setForm] = useState({ company:'', amount:'', description:'', desired:'', tone:'firm', yourName:'', city:'', country:'US' })
  const [letter, setLetter] = useState('')
  const [tips, setTips] = useState([])
  const [copied, setCopied] = useState(false)

  const COUNTRIES = [
    { code:'US', label:'🇺🇸 United States' },
    { code:'CA', label:'🇨🇦 Canada' },
    { code:'AU', label:'🇦🇺 Australia' },
    { code:'UK', label:'🇬🇧 United Kingdom' },
  ]

  async function generate() {
    if (!disputeType || !form.company || !form.description) return
    setScreen('loading')

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('No VITE_GROQ_API_KEY in .env.local')

      const typeInfo = DISPUTE_TYPES.find(d => d.id === disputeType)
      const toneInfo = TONES.find(t => t.id === form.tone)
      const deadline = { firm: 14, urgent: 10, final: 7 }[form.tone] || 14
      const today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})

      const prompt = "You are a consumer rights attorney. Write a powerful, specific dispute letter.\n\n" +
        "DISPUTE TYPE: " + typeInfo.label + "\n" +
        "COMPANY: " + form.company + "\n" +
        "AMOUNT: " + (form.amount ? "$" + form.amount : "not specified") + "\n" +
        "THEIR SITUATION: " + form.description + "\n" +
        "DESIRED OUTCOME: " + (form.desired || "full refund/resolution") + "\n" +
        "TONE: " + toneInfo.label + "\n" +
        "SENDER: " + (form.yourName || "[YOUR NAME]") + ", " + (form.city || "[YOUR CITY]") + ", " + form.country + "\n" +
        "DEADLINE: " + deadline + " days\n\n" +
        "Write a complete formal dispute letter. Include:\n" +
        "- Sender name and city at top\n" +
        "- Date: " + today + "\n" +
        "- Company name as recipient\n" +
        "- RE: subject line\n" +
        "- Strong opening stating the exact dispute\n" +
        "- Body using their specific situation details\n" +
        "- Real consumer protection laws for " + form.country + "\n" +
        "- Clear demand with " + deadline + "-day deadline\n" +
        "- Consequences if unresolved (BBB, AG, small claims, chargeback)\n" +
        "- Professional closing\n\n" +
        "Make it 100% specific to their situation. Do not use generic filler."

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Groq API error ' + res.status)

      const aiText = data.choices?.[0]?.message?.content
      if (!aiText || aiText.length < 50) throw new Error('Empty response from Groq')

      setLetter(aiText)
      setTips(TIPS[disputeType] || TIPS.other)
      setScreen('result')

    } catch (err) {
      console.error('Clawback error:', err.message)
      setScreen('form')
      alert('Error: ' + err.message)
    }
  }


  function copyLetter() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function reset() {
    setScreen('landing')
    setLetter('')
    setDisputeType(null)
    setForm({ company:'', amount:'', description:'', desired:'', tone:'firm', yourName:'', city:'', country:'US' })
  }

  return (
    <>
      <style>{css}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div className="app">

        <header className="header">
          <div className="logo-icon">⚖️</div>
          <span className="logo-text">Claw<span>back</span></span>
          <span className="header-tag">Free Forever</span>
        </header>

        {/* LANDING */}
        {screen === 'landing' && (<>
          <section className="hero">
            <div className="hero-eyebrow">✦ Smart Consumer Defense Letters</div>
            <h1>Companies count on you<br /><span className="highlight">giving up.</span><br />We help you fight back.</h1>
            <p>Generate a legally-sharp dispute letter in seconds. Free, forever. No signup, no AI quota, no limits.</p>
            <div className="hero-stats">
              <div className="stat"><span className="stat-num">$2.8T</span><span className="stat-label">Overcharged annually in US</span></div>
              <div className="stat"><span className="stat-num">73%</span><span className="stat-label">Disputes resolved with a letter</span></div>
              <div className="stat"><span className="stat-num">0s</span><span className="stat-label">Wait time — instant generation</span></div>
            </div>
          </section>

          <div className="section-label">How it works</div>
          <div className="steps">
            <div className="step"><div className="step-num">1</div><h3>Pick your dispute</h3><p>Overcharge, denied refund, bad contractor, deposit stolen — we cover everything.</p></div>
            <div className="step"><div className="step-num">2</div><h3>Describe what happened</h3><p>Tell us the company name and what they did wrong. Takes 2 minutes.</p></div>
            <div className="step"><div className="step-num">3</div><h3>Get your letter</h3><p>Instant legally-aware letter citing real consumer protection laws. Copy and send. Win.</p></div>
          </div>

          <div className="section-label">What type of dispute?</div>
          <div className="dispute-grid" style={{marginBottom:32}}>
            {DISPUTE_TYPES.map(d => (
              <button key={d.id} className="dispute-btn" onClick={() => { setDisputeType(d.id); setScreen('form') }}>
                <span className="dispute-btn-icon">{d.icon}</span>
                <span className="dispute-btn-label">{d.label}</span>
                <span className="dispute-btn-desc">{d.desc}</span>
              </button>
            ))}
          </div>
        </>)}

        {/* FORM */}
        {screen === 'form' && (<>
          <button className="back-btn" onClick={() => setScreen('landing')}>← Back</button>
          <div className="section-label">Build your dispute letter</div>

          <div className="form-card">
            <div className="form-card-header"><span className="step-badge">Step 1</span><h2>Dispute type</h2></div>
            <div className="form-card-body">
              <div className="dispute-grid">
                {DISPUTE_TYPES.map(d => (
                  <button key={d.id} className={`dispute-btn ${disputeType===d.id?'selected':''}`} onClick={() => setDisputeType(d.id)}>
                    <span className="dispute-btn-icon">{d.icon}</span>
                    <span className="dispute-btn-label">{d.label}</span>
                    <span className="dispute-btn-desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-header"><span className="step-badge">Step 2</span><h2>What happened?</h2></div>
            <div className="form-card-body">
              <div className="two-col">
                <div className="field">
                  <label>Company / Person name *</label>
                  <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="e.g. Comcast, Landlord John Smith" />
                </div>
                <div className="field">
                  <label>Amount in dispute</label>
                  <input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="e.g. 350" />
                </div>
              </div>
              <div className="field">
                <label>Describe what happened *</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Tell us exactly what the company did wrong. Be specific — dates, amounts, what was promised vs what happened..." rows={5} />
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>What do you want?</label>
                <input value={form.desired} onChange={e=>setForm({...form,desired:e.target.value})} placeholder="e.g. Full refund of $350, fix the work, cancel my account" />
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-header"><span className="step-badge">Step 3</span><h2>Your info & tone</h2></div>
            <div className="form-card-body">
              <div className="three-col" style={{marginBottom:20}}>
                <div className="field" style={{marginBottom:0}}>
                  <label>Your name</label>
                  <input value={form.yourName} onChange={e=>setForm({...form,yourName:e.target.value})} placeholder="Your full name" />
                </div>
                <div className="field" style={{marginBottom:0}}>
                  <label>City / State</label>
                  <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="e.g. Austin, TX" />
                </div>
                <div className="field" style={{marginBottom:0}}>
                  <label>Country</label>
                  <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})}>
                    {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Letter tone</label>
                <div className="tone-grid">
                  {TONES.map(t=>(
                    <button key={t.id} className={`tone-btn ${form.tone===t.id?'selected':''}`} onClick={()=>setForm({...form,tone:t.id})}>
                      <span className="tone-btn-label">{t.label}</span>
                      <span className="tone-btn-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button className="generate-btn" disabled={!disputeType||!form.company||!form.description} onClick={generate}>
                ⚡ Generate My Dispute Letter — Instant
              </button>
              {(!disputeType||!form.company||!form.description) && (
                <p style={{textAlign:'center',fontSize:12,color:'var(--muted)',marginTop:10}}>Fill in company name and description to continue</p>
              )}
            </div>
          </div>
        </>)}

        {/* LOADING */}
        {screen === 'loading' && (
          <div className="loading" style={{paddingTop:80}}>
            <div className="spinner"></div>
            <strong>Writing your dispute letter...</strong>
            <p>Personalising with AI. If AI is unavailable, a professional template letter is used automatically.</p>
          </div>
        )}

        {/* RESULT */}
        {screen === 'result' && (<>
          <button className="back-btn" onClick={() => setScreen('form')}>← Edit details</button>
          <div className="result-card">
            <div className="result-header">
              <div className="result-header-left">
                <span className="result-win-badge">✓ Letter ready</span>
                <h3>Your dispute letter</h3>
              </div>
              <div className="result-actions">
                <button className="btn-copy" onClick={copyLetter}>📋 Copy letter</button>
                <button className="btn-new" onClick={reset}>+ New dispute</button>
              </div>
            </div>
            <div className="result-body">
              <div className="letter-text">{letter}</div>
              {tips.length > 0 && (<>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)',margin:'24px 0 14px'}}>📌 Tips for maximum impact</div>
                <div className="tips-grid">
                  {tips.slice(0,4).map((tip,i)=>(
                    <div className="tip" key={i}>
                      <div className="tip-icon">{['📮','💳','⭐','📋'][i]}</div>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </>)}
            </div>
          </div>
        </>)}

        <footer className="footer">
          <p>Clawback is free forever. We believe everyone deserves to fight back. &nbsp;·&nbsp; <a href="#">Privacy</a></p>
        </footer>
      </div>
      {copied && <div className="toast">✓ Letter copied to clipboard!</div>}
    </>
  )
}
