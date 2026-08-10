// Realistic Indian mock seed data for the BuzzTrk prototype.
// Everything here is fabricated for demo purposes — no real accounts,
// no real people, no real transactions.

import { categoryMeta } from '../lib/categorize'
import { splitEqually, avatarColorForIndex } from '../lib/blendLedger'

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
  { id: nextId('due'), kind: 'owed', title: 'Owe Kabir - petrol split', amount: 150, dueDate: D(Y, M, 5), recurring: false },
]

// ── Blend: multi-group expense tracking (Splitwise/GPay-Groups-style) ──────
// Each group has its own member list and its own independent ledger — no
// shared totals across groups. Every ledger entry is either an 'expense'
// (paidBy + per-person shares, which can be an equal or custom split among
// a subset of the group) or a 'settlement' (a direct payment between two
// members recorded to net against prior expense debts). The headline
// balance shown in the UI is always the *netted* result of these entries
// (see src/lib/blendLedger.js#computePairNet), never a running list.

function membersFrom(namesWithMe) {
  return namesWithMe.map((name, i) => ({
    id: name.toLowerCase() === 'you' ? 'me' : name.toLowerCase(),
    name,
    avatarColor: avatarColorForIndex(i),
  }))
}

const weekendCrewMembers = membersFrom(['You', 'Arjun', 'Priya', 'Zoya', 'Kabir'])

export const BLEND_GROUPS = [
  {
    id: 'grp-weekend-crew',
    name: 'Weekend Crew',
    createdAt: D(Y, M, 1),
    members: weekendCrewMembers,
    ledger: [
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 3), description: 'Biryani night', amount: 1600,
        paidBy: 'me', splitType: 'equal', paymentMethod: 'upi',
        shares: splitEqually(1600, ['me', 'arjun', 'priya', 'zoya']), // partial split — Kabir sat this one out
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 5), description: 'Movie tickets - PVR', amount: 2800,
        paidBy: 'arjun', splitType: 'equal', paymentMethod: 'card',
        shares: splitEqually(2800, ['me', 'arjun', 'priya', 'zoya', 'kabir']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 6), description: 'Cab to Nandi Hills', amount: 1200,
        paidBy: 'priya', splitType: 'equal', paymentMethod: 'upi',
        shares: splitEqually(1200, ['me', 'priya', 'kabir']), // partial — Arjun and Zoya weren't on this trip
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 7), description: 'Café hangout', amount: 980,
        paidBy: 'zoya', splitType: 'equal', paymentMethod: 'cash',
        shares: splitEqually(980, ['me', 'arjun', 'zoya']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 7), description: 'Coffee run', amount: 100,
        paidBy: 'me', splitType: 'equal', paymentMethod: 'cash',
        shares: splitEqually(100, ['me', 'arjun']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 8), description: 'Metro tickets', amount: 80,
        paidBy: 'arjun', splitType: 'equal', paymentMethod: 'upi',
        shares: splitEqually(80, ['me', 'arjun']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 8), description: 'Grocery run for the trip', amount: 900,
        paidBy: 'priya', splitType: 'custom', paymentMethod: 'upi',
        shares: { me: 500, priya: 200, kabir: 200 }, // custom split — 'me' grabbed extra supplies
      },
      {
        id: nextId('bx'), type: 'settlement', date: D(Y, M, 8), from: 'kabir', to: 'priya', amount: 200,
        note: 'Cab share settled up in cash',
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 8), description: 'Concert tickets', amount: 2800,
        paidBy: 'arjun', splitType: 'equal', paymentMethod: 'card',
        shares: splitEqually(2800, ['me', 'arjun']),
      },
    ],
  },
  {
    id: 'grp-goa-trip',
    name: 'Goa Trip',
    createdAt: D(Y, M, 4),
    members: membersFrom(['You', 'Arjun', 'Zoya']),
    ledger: [
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 4), description: 'Flight tickets', amount: 6000,
        paidBy: 'me', splitType: 'equal', paymentMethod: 'card',
        shares: splitEqually(6000, ['me', 'arjun', 'zoya']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 5), description: 'Hostel booking', amount: 3600,
        paidBy: 'arjun', splitType: 'equal', paymentMethod: 'upi',
        shares: splitEqually(3600, ['me', 'arjun', 'zoya']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 6), description: 'Scuba diving', amount: 4500,
        paidBy: 'zoya', splitType: 'equal', paymentMethod: 'card',
        shares: splitEqually(4500, ['me', 'zoya']), // partial — Arjun opted out
      },
    ],
  },
  {
    id: 'grp-office-lunch',
    name: 'Office Lunch Gang',
    createdAt: D(Y, M, 2),
    members: membersFrom(['You', 'Rahul', 'Sana']),
    ledger: [
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 2), description: 'Lunch at Truffles', amount: 900,
        paidBy: 'me', splitType: 'equal', paymentMethod: 'card',
        shares: splitEqually(900, ['me', 'rahul', 'sana']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 3), description: 'Lunch at Truffles', amount: 750,
        paidBy: 'rahul', splitType: 'equal', paymentMethod: 'upi',
        shares: splitEqually(750, ['me', 'rahul', 'sana']),
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 4), description: 'Cab share to office', amount: 200,
        paidBy: 'sana', splitType: 'custom', paymentMethod: 'cash',
        shares: { me: 80, sana: 60, rahul: 60 }, // custom — 'me' got picked up first, further away
      },
      {
        id: nextId('bx'), type: 'expense', date: D(Y, M, 5), description: 'Birthday cake for Sana', amount: 450,
        paidBy: 'me', splitType: 'equal', paymentMethod: 'upi',
        shares: splitEqually(450, ['me', 'rahul']), // partial — it's for Sana, she doesn't chip in
      },
      {
        id: nextId('bx'), type: 'settlement', date: D(Y, M, 8), from: 'me', to: 'rahul', amount: 250,
        note: 'Lunch from the 3rd, settled up',
      },
    ],
  },
]

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

// Deliberately no cash-value vouchers or brand coupons here — redeeming
// spending power would contradict a tool whose whole point is helping users
// avoid impulsive spend. Rewards are merch, cosmetic flair, or a symbolic
// boost toward the user's own savings goal (never a real money transfer).
export const REWARDS_CATALOG = [
  { id: 'rw-1', title: 'BuzzTrk Sticker Pack', cost: 200, emoji: '✨', type: 'merch' },
  { id: 'rw-2', title: 'Coin Badge — Profile Flair', cost: 500, emoji: '🪙', type: 'flair' },
  { id: 'rw-3', title: 'Neon App Theme Unlock', cost: 700, emoji: '🌈', type: 'flair' },
  { id: 'rw-4', title: 'Savings Goal Boost +₹500', cost: 900, emoji: '🐷', type: 'savings', savingsAmount: 500 },
  { id: 'rw-5', title: 'BuzzTrk Tote Bag', cost: 1200, emoji: '👜', type: 'merch' },
]

// ── Savings goals — personal + group ─────────────────────────────────────────
// Same manual-entry honesty as cash expenses and Blend settlements: the user
// (or a group member) logs "I put aside ₹X", nothing here moves real money.
export const PERSONAL_GOALS = [
  {
    id: 'goal-laptop',
    title: 'New Laptop Fund',
    emoji: '💻',
    target: 5000,
    createdAt: D(Y, M, 2),
    contributions: [
      { id: nextId('contrib'), amount: 800, date: D(Y, M, 3), note: 'Skipped eating out this week', source: 'manual' },
      { id: nextId('contrib'), amount: 450, date: D(Y, M, 6), note: 'Saved on cab fares', source: 'manual' },
    ],
  },
]

export const GROUP_GOALS = [
  {
    id: 'ggoal-next-trip',
    groupId: 'grp-weekend-crew',
    title: 'Next Trip Fund',
    emoji: '🏝️',
    target: 10000,
    createdAt: D(Y, M, 5),
    contributions: [
      { id: nextId('contrib'), memberId: 'me', amount: 1000, date: D(Y, M, 6), note: '' },
      { id: nextId('contrib'), memberId: 'arjun', amount: 1500, date: D(Y, M, 7), note: '' },
      { id: nextId('contrib'), memberId: 'priya', amount: 800, date: D(Y, M, 8), note: '' },
    ],
  },
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
// Every insight here is computed from the live transactions/budgets/dues
// passed in (not the static seed arrays above) so it stays accurate as the
// user marks dues paid, adds budgets, or logs expenses. Nothing is shown
// unless it's actually true of the current data — this can legitimately
// return an empty list.
export function generateAdvice({ transactions, monthSpendByCategory, budgets, dues, today }) {
  const insights = []

  for (const b of budgets) {
    const spent = monthSpendByCategory[b.category] || 0
    const pct = Math.round((spent / b.limit) * 100)
    if (pct >= 90) {
      const label = categoryMeta(b.category).label
      insights.push({
        id: `adv-${b.category}`,
        tone: pct >= 100 ? 'over' : 'warn',
        text: `You've used ${pct}% of your ${label} budget this month — ₹${spent} of ₹${b.limit}.`,
      })
    }
  }

  const upcomingDues = dues.filter((d) => (d.dueDate - today) / (1000 * 60 * 60 * 24) <= 14)
  const dueTotal = upcomingDues.reduce((s, d) => s + d.amount, 0)
  if (dueTotal > 0) {
    insights.push({
      id: 'adv-dues',
      tone: 'neutral',
      text: `You have ₹${dueTotal} in EMIs and dues coming up in the next 2 weeks — worth setting aside now.`,
    })
  }

  // First-week pacing — only surfaced when it's actually true of this
  // month's data, not shown as a generic tip regardless of pattern.
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const weekEnd = new Date(start)
  weekEnd.setDate(weekEnd.getDate() + 6)
  let weekSpend = 0
  let totalSpend = 0
  for (const t of transactions) {
    if (t.type !== 'debit' || t.date < start || t.date > today) continue
    totalSpend += t.amount
    if (t.date <= weekEnd) weekSpend += t.amount
  }
  const daysSoFar = today.getDate()
  if (totalSpend > 0 && daysSoFar >= 8) {
    const sharePct = weekSpend / totalSpend
    if (sharePct >= 0.5) {
      insights.push({
        id: 'adv-pattern',
        tone: 'neutral',
        text: `${Math.round(sharePct * 100)}% of this month's spend (₹${weekSpend} of ₹${totalSpend}) happened in the first week — pacing it out could ease the squeeze later in the month.`,
      })
    }
  }

  return insights
}
