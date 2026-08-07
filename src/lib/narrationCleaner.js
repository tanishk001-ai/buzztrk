// Ports the prefix-stripping / title-casing rules from
// reference/sgc-parser/cleaner.py into JS so BuzzTrk can turn raw bank
// narrations ("UPI/9876543210/SWIGGY BANGALORE") into readable names
// ("Swiggy Bangalore") entirely client-side.

const PREFIX_RULES = [
  /^UPI[/-][\d]+[/-]?/i,
  /^UPI[/-]/i,
  /^UPIREF[/-][\w]+[/-]?/i,

  /^NEFT\s+(?:CR|DR)[/-]?/i,
  /^NEFT[/-]?(?:CR|DR)?[/-][\w]+[/-]?/i,
  /^NEFT[/-]/i,
  /^RTGS[/-]?(?:CR|DR)?[/-][\w]+[/-]?/i,
  /^RTGS[/-]/i,

  /^IMPS[/-][\d]+[/-]?/i,
  /^IMPS[/-]/i,

  /^ATM\s+WDL[/-][\w\s]+[/-]?/i,
  /^ATM\s+(?:CASH\s+)?WITHDRAWAL\s*[/-]?/i,
  /^ATM[/-]/i,

  /^CHQ[/-]?(?:NO)?[/-]?[\d]+[/-]?/i,
  /^CHEQUE[/-]?(?:NO)?[/-]?[\d]+[/-]?/i,
  /^CHS[/-][\d]+[/-]?/i,

  /^POS[/-][\d*]+[/-]?/i,
  /^CARD[/-][\d*]+[/-]?/i,
  /^DEBIT\s+CARD[/-]?/i,

  /^NACH[/-]/i,
  /^ECS[/-]/i,
  /^ACH[/-]/i,
  /^SI[/-]/i,

  /^MB[/-]/i,
  /^IB[/-]/i,
  /^INB[/-]/i,
  /^MOB[/-]/i,

  /^MMT[/-]/i,
  /^PHONEPE[/-][\d]+[/-]?/i,
  /^PHONEPE[/-]/i,
  /^GPAY[/-]/i,
  /^GOOGLEPAY[/-]/i,
  /^PAYTM[/-][\d]+[/-]?/i,
  /^PAYTM[/-]/i,
  /^AMAZON\s*PAY[/-]/i,

  /^BY\s+TRANSFER[/-]?/i,
  /^TO\s+TRANSFER[/-]?/i,
  /^TRANSFER[/-]/i,
  /^TRF[/-]/i,

  /^[\d]{6,}[/-]/,
  /^[A-Z]{4}[\d]{6,}[/-]?/,
]

const NOISE_SUFFIXES = /\s*[/-]\s*(?:[\d]{6,}|[A-Z]{2,4}[\d]{4,})$/i
const ACCOUNT_NUMBER = /\b[\dX*]{8,}\b/
const EXTRA_SPACES = /\s{2,}/g
const SLASH_SPACE = /\s*\/\s*/g

const ACRONYMS = new Set([
  'upi', 'neft', 'rtgs', 'imps', 'atm', 'emi',
  'gst', 'tds', 'pf', 'esic', 'nach', 'ecs',
  'sbi', 'hdfc', 'icici', 'lic', 'ltd',
  'pvt', 'llp', 'opc', 'cr', 'dr',
])

function title(s) {
  const words = s.trim().split(/\s+/).filter(Boolean)
  return words
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
}

const TRUNCATED_SUFFIXES = new Set(['limi', 'limit', 'limite'])

const BRAND_MAP = {
  indusind: 'IndusInd',
  paytm: 'Paytm',
  mobikwik: 'Mobikwik',
  netflix: 'Netflix',
  amazon: 'Amazon',
  phonepe: 'PhonePe',
  gpay: 'GPay',
  swiggy: 'Swiggy',
  zomato: 'Zomato',
  ola: 'Ola',
  uber: 'Uber',
  myntra: 'Myntra',
  flipkart: 'Flipkart',
  bookmyshow: 'BookMyShow',
  spotify: 'Spotify',
  jio: 'Jio',
  airtel: 'Airtel',
}

const UPPER_KEEP = new Set(['hdfc', 'icici', 'sbi', 'axis', 'atm', 'emi', 'upi', 'imps', 'neft', 'rtgs'])

function cleanEntity(name) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => !TRUNCATED_SUFFIXES.has(p.toLowerCase()))
  return parts
    .map((p) => {
      const low = p.toLowerCase()
      if (BRAND_MAP[low]) return BRAND_MAP[low]
      if (UPPER_KEEP.has(low)) return p.toUpperCase()
      return p[0].toUpperCase() + p.slice(1).toLowerCase()
    })
    .join(' ')
}

function cleanMerchant(name) {
  let n = name.trim()
  const ptm = /^PTM\*(\w+)/i.exec(n)
  if (ptm) {
    const brand = ptm[1]
    return BRAND_MAP[brand.toLowerCase()] || title(brand)
  }
  n = n.replace(/\s+In\b/i, '').trim()
  return cleanEntity(n)
}

const IMPS_BANK_CODES = new Set([
  'bankof', 'stateb', 'hdfcb', 'icicib', 'pnbank', 'axisb',
  'unionb', 'canara', 'yesbnk', 'indusb', 'kotakb', 'federl',
])

function impsP2aHandler(name) {
  const n = name.trim()
  if (/^\d+$/.test(n) || IMPS_BANK_CODES.has(n.toLowerCase())) return 'IMPS Transfer'
  return `IMPS to ${title(n)}`
}

const P2_MERCHANT_MAP = {
  'amazon pa': 'Amazon Pay',
  amazonpa: 'Amazon Pay',
  'satvic mo': 'Satvic Movement',
  'vastram t': 'Vastram',
}

function cleanP2Name(name) {
  const low = name.toLowerCase().trim()
  if (P2_MERCHANT_MAP[low]) return P2_MERCHANT_MAP[low]
  return cleanEntity(name)
}

const P2_CELL_RE = /^P2[AM]\s*[-\s][-\s]*([A-Za-z][^-\n]+?)\s*-\s*\w/i

const BRAND_FIX = {
  paytmrecharge: 'Paytm Recharge',
  paytm_addmone: 'Paytm Add Money',
  'paytm addmone': 'Paytm Add Money',
  googleplay: 'Google Play',
  'google play': 'Google Play',
  'youtube cybs si': 'YouTube',
  youtube: 'YouTube',
  netflix: 'Netflix',
  one97: 'Paytm',
  'one97 communi': 'Paytm',
  'amazon pa': 'Amazon Pay',
  'satvic mo': 'Satvic Movement',
  'vastram t': 'Vastram',
  europride: 'Europride',
}

function applyBrandFix(result) {
  return BRAND_FIX[result.toLowerCase()] || result
}

// Axis-specific pattern table: [regex, handler(match) => string]
const AXIS_PATTERNS = [
  [/^AXMOB[/-]/i, () => 'Mobile Banking - AXMOB'],
  [/^MOB[/-]SELFFT[/-]([A-Za-z][^/]*)[/-]/i, (m) => `Self Transfer - ${title(m[1].trim())}`],
  [/^(?:MOB[/-])?TPFT[/-]([A-Za-z][^/\n]*?)(?:[/-]|$)/i, (m) => `Self Transfer - ${title(m[1].trim())}`],
  [/^PPR[\w]*_EMI_/i, () => 'EMI Payment'],
  [/^[\d]+:Int\.Pd:/i, () => 'Interest Paid'],
  [/^UPI[/-]P2A[/-][\d]*[/-]([A-Za-z][^/\n]*?)[/-]/i, (m) => cleanP2Name(m[1].trim())],
  [/^UPI[/-]P2M[/-][\d]*[/-]([A-Za-z][^/\n]*?)[/-]/i, (m) => cleanP2Name(m[1].trim())],
  [/^IMPS[/-]P2A[/-][\d]+[/-]([^/]+)[/-]/i, (m) => impsP2aHandler(m[1])],
  [/^ECOM\s*PUR[/-]([^/]+)[/-]/i, (m) => cleanMerchant(m[1])],
  [/^POS[/-]([^/]+)[/-]/i, (m) => cleanEntity(m[1].trim())],
  [/^ATM[-/]CASH[/-]([^/]+)[/-]/i, (m) => `ATM Withdrawal - ${cleanEntity(m[1].trim())}`],
  [/^BRN-PYMT-CARD-[\d]+/i, () => 'Card Payment'],
]

function applyAxisRules(text) {
  for (const [pattern, handler] of AXIS_PATTERNS) {
    const m = pattern.exec(text)
    if (m && m.index === 0) return handler(m)
  }
  return null
}

/**
 * Convert a raw bank narration string into a readable name/description.
 *   "UPI/9876543210/SWIGGY BANGALORE"   -> "Swiggy Bangalore"
 *   "NEFT/HDFC0001/MR SHARMA BUILDERS"  -> "Mr Sharma Builders"
 *   "ATM-CASH/HDFC BANK LIMI/PUNE/..."  -> "ATM Withdrawal - HDFC Bank"
 */
export function cleanNarration(raw) {
  if (!raw) return raw

  let text = raw.trim().replace(/\n/g, ' ').replace(/\r/g, ' ')
  text = text.replace(EXTRA_SPACES, ' ')

  const lower = text.toLowerCase()
  if (
    ['interest', 'charges', 'gst', 'tax', 'opening balance', 'closing balance', 'annual fee', 'min bal'].some((k) =>
      lower.includes(k),
    )
  ) {
    return title(text)
  }

  const p2m = P2_CELL_RE.exec(text)
  if (p2m) {
    return applyBrandFix(cleanP2Name(p2m[1].trim()))
  }

  const axisResult = applyAxisRules(text)
  if (axisResult) {
    return applyBrandFix(axisResult)
  }

  if (/^ATM/i.test(text)) {
    const locMatch = /(?:ATM\s+WDL[/-])([\w\s]+?)(?:[/-]|$)/i.exec(text)
    if (locMatch) {
      const loc = locMatch[1].trim()
      if (loc.length > 3 && !/^\d+$/.test(loc)) {
        return `ATM Withdrawal - ${title(loc)}`
      }
    }
    return 'ATM Withdrawal'
  }

  for (let i = 0; i < 4; i++) {
    const combined = new RegExp(PREFIX_RULES.map((r) => `(?:${r.source})`).join('|'), 'i')
    const stripped = text.replace(combined, '').replace(/^[\s/|-]+|[\s/|-]+$/g, '')
    if (stripped === text) break
    text = stripped
  }

  text = text.replace(NOISE_SUFFIXES, '').trim()
  text = text.replace(ACCOUNT_NUMBER, '').trim()
  text = text.replace(SLASH_SPACE, ' - ').replace(/^[\s-]+|[\s-]+$/g, '')
  text = text.replace(EXTRA_SPACES, ' ').trim()

  if (text.length < 3) return title(raw)

  return applyBrandFix(title(text))
}
