// New for BuzzTrk (not present in the original SGC accountant tool):
// maps a cleaned narration/merchant string to a personal spend category.

export const CATEGORIES = [
  // Income is deliberately visually distinct (gold, not a spend hue) and is
  // never counted toward "spent this month" — Dashboard/Budgets already
  // filter to type === 'debit', so income naturally falls out of spend totals.
  { id: 'income', label: 'Income', color: 'var(--color-income)', emoji: '💰' },
  { id: 'food', label: 'Eating Out', color: 'var(--color-cat-food)', emoji: '🍔' },
  { id: 'groceries', label: 'Groceries', color: 'var(--color-cat-groceries)', emoji: '🛒' },
  { id: 'transport', label: 'Transport', color: 'var(--color-cat-transport)', emoji: '🚕' },
  { id: 'shopping', label: 'Shopping', color: 'var(--color-cat-shopping)', emoji: '🛍️' },
  { id: 'subs', label: 'Subscriptions', color: 'var(--color-cat-subs)', emoji: '📺' },
  { id: 'bills', label: 'Bills & Recharges', color: 'var(--color-cat-bills)', emoji: '🧾' },
  { id: 'rent', label: 'Rent & Housing', color: 'var(--color-cat-rent)', emoji: '🏠' },
  { id: 'entertainment', label: 'Entertainment', color: 'var(--color-cat-entertainment)', emoji: '🎬' },
  { id: 'health', label: 'Health', color: 'var(--color-cat-health)', emoji: '💊' },
  { id: 'cash_withdrawal', label: 'Cash Withdrawal', color: 'var(--color-cat-cash)', emoji: '🏧' },
  { id: 'transfers', label: 'Transfers', color: 'var(--color-cat-transfers)', emoji: '↔️' },
  { id: 'emi', label: 'EMI & Dues', color: 'var(--color-cat-emi)', emoji: '💳' },
  { id: 'other', label: 'Other', color: 'var(--color-cat-other)', emoji: '❔' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// Curated swatches for user-created categories — distinct from the fixed
// per-category hues above so a custom category never visually collides
// with a built-in one.
export const CUSTOM_CATEGORY_COLORS = [
  '#E85D75', '#5DB3E8', '#F2A65A', '#8ED081', '#C792EA', '#5FD4C6', '#F27878', '#A6A6F0',
]

function slugify(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'category'
}

// Registers a user-created category at runtime. CATEGORIES/CATEGORY_MAP are
// module-level and mutated in place (rather than reassigned) so every
// existing `import { CATEGORIES }` reference sees the new entry on its next
// render — callers still need to re-render to observe it, which
// useAppState()'s addCustomCategory takes care of.
export function addCategory(label, emoji, color) {
  const trimmed = label.trim()
  let id = slugify(trimmed)
  let suffix = 2
  while (CATEGORY_MAP[id]) {
    id = `${slugify(trimmed)}_${suffix++}`
  }
  const category = { id, label: trimmed, color: color || CUSTOM_CATEGORY_COLORS[CATEGORIES.length % CUSTOM_CATEGORY_COLORS.length], emoji: emoji || '🏷️', custom: true }
  CATEGORIES.push(category)
  CATEGORY_MAP[id] = category
  return id
}

// Ordered keyword rules — first match wins. Keys are lowercase substrings
// matched against the cleaned narration/merchant string.
const RULES = [
  { id: 'food', keywords: ['swiggy', 'zomato', 'dominos', 'pizza', 'mcdonald', 'kfc', 'burger', 'starbucks', 'chai', 'chaayos', 'cafe', 'restaurant', 'eatfit', 'faasos', 'behrouz', 'biryani', 'dunzo food', 'ccd', 'barbeque'] },
  { id: 'groceries', keywords: ['zepto', 'blinkit', 'bigbasket', 'big basket', 'grofers', 'instamart', 'dmart', 'grocery', 'more supermarket', 'reliance fresh', 'nature basket'] },
  { id: 'transport', keywords: ['ola', 'uber', 'rapido', 'metro', 'irctc', 'redbus', 'petrol', 'fuel', 'indian oil', 'bharat petroleum', 'hp petrol', 'fastag', 'parking', 'auto', 'yulu'] },
  { id: 'shopping', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'shopping', 'decathlon', 'lifestyle', 'h&m', 'zara', 'croma', 'reliance digital'] },
  { id: 'subs', keywords: ['netflix', 'spotify', 'hotstar', 'prime video', 'youtube', 'apple.com/bill', 'google play', 'jiocinema', 'sonyliv', 'gym membership', 'cult.fit sub'] },
  { id: 'bills', keywords: ['jio', 'airtel', 'vi ', 'vodafone', 'recharge', 'electricity', 'bescom', 'water bill', 'broadband', 'wifi', 'gas cylinder', 'lpg', 'dth', 'tata sky'] },
  { id: 'rent', keywords: ['rent', 'landlord', 'housing society', 'maintenance charge', 'pg fee'] },
  { id: 'entertainment', keywords: ['bookmyshow', 'pvr', 'inox', 'cinema', 'movie', 'concert', 'event'] },
  { id: 'health', keywords: ['pharmeasy', 'apollo pharmacy', 'netmeds', '1mg', 'pharmacy', 'hospital', 'clinic', 'diagnostic'] },
  { id: 'emi', keywords: ['emi', 'loan', 'slice', 'lazypay', 'simpl', 'creditline', 'bnpl'] },
  { id: 'cash_withdrawal', keywords: ['atm withdrawal', 'atm-cash', 'atm cash', 'cash withdrawal', 'cash wdl', 'atm wdl'] },
  { id: 'transfers', keywords: ['self transfer', 'imps transfer', 'upi transfer', 'sent to', 'received from', 'p2p'] },
]

const INCOME_KEYWORDS = ['salary', 'stipend', 'freelance', 'interest credit', 'interest paid', 'fd interest', 'refund', 'cashback', 'reimbursement', 'cheque deposit', 'dividend']

/**
 * @param {string} description - cleaned narration/merchant text
 * @param {'debit'|'credit'} [type] - when known, a credit transaction is
 *   always income; without it, only keyword-recognized credits are caught.
 */
export function categorize(description, type) {
  const d = (description || '').toLowerCase()
  if (type === 'credit') return 'income'
  if (INCOME_KEYWORDS.some((k) => d.includes(k))) return 'income'
  for (const rule of RULES) {
    if (rule.keywords.some((k) => d.includes(k))) return rule.id
  }
  return 'other'
}

export function categoryMeta(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other
}
