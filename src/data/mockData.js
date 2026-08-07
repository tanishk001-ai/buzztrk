// Realistic Indian mock seed data for the BuzzTrk prototype.
// Everything here is fabricated for demo purposes — no real accounts,
// no real people, no real transactions.

const D = (y, m, d) => new Date(y, m - 1, d)

// "Today" is pinned so the prototype always tells the same story:
// salary/pocket-money lands on the 1st, spend is heavy in week one and
// two, and the user is scraping by (borrowing from a friend, dipping
// into a BNPL-style due) by the second half of the month — the exact
// pattern BuzzTrk exists to make visible.
export const TODAY = D(2026, 8, 8)
const Y = 2026
const M = 8

let _id = 1
const nextId = (prefix) => `${prefix}-${_id++}`

// ── Passive auto-collected feed ─────────────────────────────────────────────
// Behaves like it was pulled automatically (SMS/bank-style parsing), same
// shape as what statementParser.js produces from a real upload.
export const AUTO_TRANSACTIONS = [
  { date: D(Y, M, 1), description: 'Salary Credit - Innosphere Pvt Ltd', amount: 24000, category: 'income', type: 'credit' },
  { date: D(Y, M, 1), description: 'Housing Society - Maintenance Charge', amount: 1800, category: 'rent', type: 'debit' },
  { date: D(Y, M, 1), description: 'Rent - Landlord Ramesh Gupta', amount: 8000, category: 'rent', type: 'debit' },
  { date: D(Y, M, 2), description: 'Swiggy Koramangala', amount: 340, category: 'food', type: 'debit' },
  { date: D(Y, M, 2), description: 'Zepto', amount: 620, category: 'groceries', type: 'debit' },
  { date: D(Y, M, 2), description: 'Netflix', amount: 199, category: 'subs', type: 'debit' },
  { date: D(Y, M, 3), description: 'Ola', amount: 180, category: 'transport', type: 'debit' },
  { date: D(Y, M, 3), description: 'Myntra', amount: 1450, category: 'shopping', type: 'debit' },
  { date: D(Y, M, 3), description: 'Starbucks Indiranagar', amount: 460, category: 'food', type: 'debit' },
  { date: D(Y, M, 4), description: 'Zomato', amount: 385, category: 'food', type: 'debit' },
  { date: D(Y, M, 4), description: 'Jio Recharge', amount: 299, category: 'bills', type: 'debit' },
  { date: D(Y, M, 4), description: 'BookMyShow - PVR Forum Mall', amount: 700, category: 'entertainment', type: 'debit' },
  { date: D(Y, M, 5), description: 'Blinkit', amount: 540, category: 'groceries', type: 'debit' },
  { date: D(Y, M, 5), description: 'Spotify', amount: 119, category: 'subs', type: 'debit' },
  { date: D(Y, M, 5), description: 'Uber', amount: 220, category: 'transport', type: 'debit' },
  { date: D(Y, M, 6), description: 'Domino\'s Pizza', amount: 510, category: 'food', type: 'debit' },
  { date: D(Y, M, 6), description: 'Amazon', amount: 2100, category: 'shopping', type: 'debit' },
  { date: D(Y, M, 7), description: 'Swiggy Instamart', amount: 410, category: 'groceries', type: 'debit' },
  { date: D(Y, M, 7), description: 'PVR Cinemas', amount: 600, category: 'entertainment', type: 'debit' },
  { date: D(Y, M, 7), description: 'Rapido', amount: 95, category: 'transport', type: 'debit' },
  { date: D(Y, M, 8), description: 'Starbucks MG Road', amount: 380, category: 'food', type: 'debit' },
  { date: D(Y, M, 8), description: 'Apollo Pharmacy', amount: 260, category: 'health', type: 'debit' },
]

// ── Manually entered cash expenses ──────────────────────────────────────────
export const CASH_TRANSACTIONS = [
  { date: D(Y, M, 2), description: 'Auto fare', amount: 60, category: 'transport' },
  { date: D(Y, M, 5), description: 'Street food - MG Road', amount: 150, category: 'food' },
  { date: D(Y, M, 7), description: 'Cash - shared cab', amount: 90, category: 'transport' },
]

// ── Budgets (per category, monthly) ─────────────────────────────────────────
export const BUDGETS = [
  { category: 'food', limit: 3000 },
  { category: 'groceries', limit: 2500 },
  { category: 'transport', limit: 1500 },
  { category: 'shopping', limit: 3000 },
  { category: 'subs', limit: 500 },
  { category: 'bills', limit: 800 },
  { category: 'entertainment', limit: 1500 },
]

// ── Pending dues / EMI tracker ───────────────────────────────────────────────
export const DUES = [
  { id: nextId('due'), kind: 'emi', title: 'Phone EMI - Bajaj Finserv', amount: 1899, dueDate: D(Y, M, 12), recurring: true },
  { id: nextId('due'), kind: 'emi', title: 'Laptop EMI - HDFC Card', amount: 2450, dueDate: D(Y, M, 15), recurring: true },
  { id: nextId('due'), kind: 'bnpl', title: 'Slice - Bill Due', amount: 1200, dueDate: D(Y, M, 10), recurring: false },
  { id: nextId('due'), kind: 'owed', title: 'Owe Arjun for concert tickets', amount: 700, dueDate: D(Y, M, 14), recurring: false },
  { id: nextId('due'), kind: 'owed', title: 'Owe Priya - dinner split', amount: 340, dueDate: D(Y, M, 9), recurring: false },
]

// ── Blend: friend group expense tracking (Splitwise-style, no settlement) ──
export const BLEND_GROUP = {
  id: 'grp-1',
  name: 'Weekend Crew',
  members: [
    { id: 'me', name: 'You', avatarColor: 'var(--color-cat-food)' },
    { id: 'arjun', name: 'Arjun', avatarColor: 'var(--color-cat-transport)' },
    { id: 'priya', name: 'Priya', avatarColor: 'var(--color-cat-shopping)' },
    { id: 'zoya', name: 'Zoya', avatarColor: 'var(--color-cat-subs)' },
    { id: 'kabir', name: 'Kabir', avatarColor: 'var(--color-cat-groceries)' },
  ],
}

export const BLEND_EXPENSES = [
  { id: nextId('bx'), date: D(Y, M, 3), title: 'Biryani night', amount: 1600, paidBy: 'me', split: ['me', 'arjun', 'priya', 'zoya'], settled: true },
  { id: nextId('bx'), date: D(Y, M, 5), title: 'Movie tickets - PVR', amount: 2800, paidBy: 'arjun', split: ['me', 'arjun', 'priya', 'zoya', 'kabir'], settled: false },
  { id: nextId('bx'), date: D(Y, M, 6), title: 'Cab to Nandi Hills', amount: 1200, paidBy: 'priya', split: ['me', 'priya', 'kabir'], settled: false },
  { id: nextId('bx'), date: D(Y, M, 7), title: 'Café hangout', amount: 980, paidBy: 'zoya', split: ['me', 'arjun', 'zoya'], settled: false },
  { id: nextId('bx'), date: D(Y, M, 8), title: 'Concert tickets', amount: 2800, paidBy: 'arjun', split: ['me', 'arjun'], settled: false },
]

// "who pays first / last" streaks — playful, not punitive
export const BLEND_STATS = {
  paysFirstStreak: { member: 'priya', count: 4 },
  paysLastStreak: { member: 'kabir', count: 3 },
}

// ── Streaks, points & rewards ────────────────────────────────────────────────
export const STREAK = {
  currentStreak: 12,
  longestStreak: 21,
  points: 1840,
  history: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1], // last 13 days, 1 = tracked
}

export const POINT_EVENTS = [
  { id: nextId('pt'), label: 'Logged expenses 5 days straight', points: 50, date: D(Y, M, 7) },
  { id: nextId('pt'), label: 'Stayed under Transport budget', points: 30, date: D(Y, M, 6) },
  { id: nextId('pt'), label: 'Reviewed weekly spend summary', points: 20, date: D(Y, M, 5) },
]

export const REWARDS_CATALOG = [
  { id: 'rw-1', title: 'BuzzTrk Sticker Pack', cost: 200, emoji: '✨' },
  { id: 'rw-2', title: '₹100 Zepto Voucher', cost: 900, emoji: '🛒' },
  { id: 'rw-3', title: 'BuzzTrk Tote Bag', cost: 1200, emoji: '👜' },
  { id: 'rw-4', title: '₹250 BookMyShow Voucher', cost: 2000, emoji: '🎬' },
  { id: 'rw-5', title: 'Limited Coin Badge', cost: 500, emoji: '🪙' },
]

// ── Wrapped-style annual recap (mock, generated once a year) ────────────────
export const WRAPPED_2025 = {
  year: 2025,
  cards: [
    { id: 'w1', kind: 'intro', headline: 'Your 2025,\nfinancially.', sub: 'Let’s look back.' },
    { id: 'w2', kind: 'stat', headline: '287', sub: 'days you tracked spending', big: true },
    { id: 'w3', kind: 'stat', headline: '₹1.4L', sub: 'total spend you actually saw coming', big: true },
    { id: 'w4', kind: 'top-category', headline: 'Eating Out', sub: 'was your #1 category — and you still stayed close to budget 8 out of 12 months', category: 'food' },
    { id: 'w5', kind: 'streak', headline: '21-day', sub: 'longest tracking streak. That’s discipline, not luck.' },
    { id: 'w6', kind: 'good-habit', headline: 'Zero', sub: 'months you ran out of money before payday — down from 4 the year before' },
    { id: 'w7', kind: 'outro', headline: 'That’s a\nfinancially sound year.', sub: 'Here’s to more of that.' },
  ],
}

// ── Advice (opt-in only, factual & non-judgmental, Cred-style) ─────────────
export function generateAdvice({ transactions, budgets }) {
  const insights = []
  const spendByCat = {}
  for (const t of transactions) {
    if (t.type === 'credit') continue
    spendByCat[t.category] = (spendByCat[t.category] || 0) + t.amount
  }
  for (const b of budgets) {
    const spent = spendByCat[b.category] || 0
    const pct = Math.round((spent / b.limit) * 100)
    if (pct >= 90) {
      insights.push({
        id: `adv-${b.category}`,
        tone: pct >= 100 ? 'over' : 'warn',
        text: `You've used ${pct}% of your ${b.category} budget this month — ₹${spent} of ₹${b.limit}.`,
      })
    }
  }
  const dueTotal = DUES.reduce((s, d) => s + d.amount, 0)
  if (dueTotal > 0) {
    insights.push({
      id: 'adv-dues',
      tone: 'neutral',
      text: `You have ₹${dueTotal} in upcoming EMIs and dues over the next 2 weeks — worth setting aside now.`,
    })
  }
  insights.push({
    id: 'adv-pattern',
    tone: 'neutral',
    text: 'Most of your spend this month landed in the first week — pacing it across the month could ease the last-week squeeze.',
  })
  return insights
}
