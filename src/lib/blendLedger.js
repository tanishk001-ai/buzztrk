// Core ledger math for Blend groups — mirrors how Google Pay Groups (and
// Splitwise) work: every expense and settlement is recorded in full, in
// order, but the headline balance shown to a user is every transaction
// between a pair of people netted down to a single signed number.

export const MAX_GROUP_MEMBERS = 10

// Reuses the app's existing category color tokens for member avatars —
// keeps the palette visually consistent without introducing new CSS.
export const AVATAR_PALETTE = [
  'var(--color-cat-food)',
  'var(--color-cat-transport)',
  'var(--color-cat-shopping)',
  'var(--color-cat-subs)',
  'var(--color-cat-groceries)',
  'var(--color-cat-bills)',
  'var(--color-cat-rent)',
  'var(--color-cat-entertainment)',
  'var(--color-cat-health)',
  'var(--color-cat-emi)',
]

export function avatarColorForIndex(i) {
  return AVATAR_PALETTE[i % AVATAR_PALETTE.length]
}

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', emoji: '💵' },
  { id: 'upi', label: 'UPI', emoji: '📱' },
  { id: 'card', label: 'Card', emoji: '💳' },
  { id: 'other', label: 'Other', emoji: '🔖' },
]

export function paymentMethodMeta(id) {
  return PAYMENT_METHODS.find((m) => m.id === id) || PAYMENT_METHODS[PAYMENT_METHODS.length - 1]
}

function round2(n) {
  return Math.round(n * 100) / 100
}

// Splits `amount` equally among `memberIds`, distributing any rounding
// remainder in paise across the first few members so shares always sum
// exactly to `amount` (never off by a cent due to division).
export function splitEqually(amount, memberIds) {
  const n = memberIds.length
  const base = Math.floor((amount / n) * 100) / 100
  const shares = {}
  let allocated = 0
  for (const id of memberIds) {
    shares[id] = base
    allocated = round2(allocated + base)
  }
  let remainderPaise = Math.round((amount - allocated) * 100)
  let i = 0
  while (remainderPaise > 0 && memberIds.length > 0) {
    const id = memberIds[i % memberIds.length]
    shares[id] = round2(shares[id] + 0.01)
    remainderPaise -= 1
    i++
  }
  return shares
}

export function customSplitSum(shares) {
  return round2(Object.values(shares).reduce((s, v) => s + Number(v || 0), 0))
}

export function isValidCustomSplit(amount, shares) {
  return Math.abs(customSplitSum(shares) - round2(Number(amount))) < 0.01
}

function addDebt(pairNet, debtor, creditor, amount) {
  if (debtor === creditor || !amount) return
  const [a, b] = debtor < creditor ? [debtor, creditor] : [creditor, debtor]
  const key = `${a}|${b}`
  const sign = debtor === a ? 1 : -1
  pairNet[key] = (pairNet[key] || 0) + sign * amount
}

/**
 * Nets every expense + settlement in a group's ledger down to one signed
 * balance per pair of members that has ever had activity together.
 * Returns [{ a, b, amount }] where amount > 0 means `a` owes `b`,
 * amount < 0 means `b` owes `a`. Fully-settled pairs (net ~0) are omitted.
 */
export function computePairNet(ledger) {
  const pairNet = {}
  for (const entry of ledger) {
    if (entry.type === 'expense') {
      for (const [memberId, share] of Object.entries(entry.shares)) {
        if (memberId === entry.paidBy) continue
        addDebt(pairNet, memberId, entry.paidBy, share)
      }
    } else if (entry.type === 'settlement') {
      // `from` handed `to` real money — equivalent to a new debt in the
      // reverse direction, which nets against whatever `from` already
      // owed `to` from expenses.
      addDebt(pairNet, entry.to, entry.from, entry.amount)
    }
  }
  const result = []
  for (const [key, amount] of Object.entries(pairNet)) {
    const rounded = round2(amount)
    if (Math.abs(rounded) < 0.01) continue
    const [a, b] = key.split('|')
    result.push({ a, b, amount: rounded })
  }
  return result
}

// Net balance of `memberId` against every other member who shares
// activity with them. Positive = that other member owes `memberId`.
// Negative = `memberId` owes that other member.
export function computeBalancesFor(memberId, pairNet) {
  const balances = {}
  for (const { a, b, amount } of pairNet) {
    if (a === memberId) balances[b] = round2((balances[b] || 0) - amount)
    else if (b === memberId) balances[a] = round2((balances[a] || 0) + amount)
  }
  return balances
}

export function computeOverallNet(memberId, pairNet) {
  const balances = computeBalancesFor(memberId, pairNet)
  return round2(Object.values(balances).reduce((s, v) => s + v, 0))
}

// True if a ledger entry involves the given member (as payer, a
// split participant, or either side of a settlement).
export function entryInvolvesMember(entry, memberId) {
  if (entry.type === 'expense') {
    return entry.paidBy === memberId || Object.keys(entry.shares).includes(memberId)
  }
  return entry.from === memberId || entry.to === memberId
}

export function entryInvolvesPair(entry, memberIdA, memberIdB) {
  return entryInvolvesMember(entry, memberIdA) && entryInvolvesMember(entry, memberIdB)
}

// Filters a group's ledger down to what `viewerId` is allowed to see —
// entries tagged "hidden from" that member (the surprise-planning case)
// disappear from their view entirely: not in history, not in balances, not
// in fun stats. Anyone not tagged sees the entry as normal, including the
// person who created it, so they can reveal it later.
export function visibleLedger(ledger, viewerId) {
  return ledger.filter((entry) => !entry.hiddenFrom || !entry.hiddenFrom.includes(viewerId))
}
