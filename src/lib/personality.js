// Spending-personality scoring — six types, each scored 0-1 from real
// tracked data (category mix, budget adherence, weekend pattern, Blend
// activity). The highest-scoring type wins, gated behind a minimum data
// volume so it never renders off a handful of transactions. Same framing
// rule as everywhere else: positive, personal, never comparative against
// other users — there's no "type" for someone who spends carelessly.

const MIN_TRANSACTIONS_FOR_RESULT = 10

// Fixed/non-discretionary categories are excluded from mix-based scoring
// (Planner/Foodie/Socialite) — rent and EMI don't reflect a "personality,"
// they're just bills everyone has.
const NON_DISCRETIONARY = new Set(['rent', 'emi', 'cash_withdrawal', 'transfers', 'income', 'other'])

const PERSONALITY_TYPES = {
  planner: {
    label: 'The Planner',
    emoji: '📋',
    color: 'var(--color-cat-groceries)',
    tagline: 'You budget it, then you stick to it.',
  },
  spontaneous: {
    label: 'The Spontaneous Spender',
    emoji: '✨',
    color: 'var(--color-cat-shopping)',
    tagline: 'Small purchases, big variety — you follow the moment.',
  },
  saver: {
    label: 'The Saver',
    emoji: '🐷',
    color: 'var(--color-income)',
    tagline: "You're already paying your future self first.",
  },
  weekendWarrior: {
    label: 'Weekend Warrior',
    emoji: '🎉',
    color: 'var(--color-cat-entertainment)',
    tagline: 'Weekdays are for saving, weekends are for living.',
  },
  foodie: {
    label: 'The Foodie',
    emoji: '🍔',
    color: 'var(--color-cat-food)',
    tagline: 'Food is where your money — and your heart — goes.',
  },
  socialite: {
    label: 'The Socialite',
    emoji: '🤝',
    color: 'var(--color-cat-transport)',
    tagline: 'Your money moves with your people.',
  },
}

function clamp01(n) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * @param {object} input
 * @param {Array} input.transactions - personal transactions (debit + credit), current month
 * @param {Array} input.budgets - [{category, limit}]
 * @param {object} input.monthSpendByCategory - {category: amount}
 * @param {Array} input.personalGoals - [{contributions:[{amount}]}]
 * @param {Array} input.blendGroups - [{ledger, members}] — 'me' is always a member id
 */
export function computePersonalityScores(input) {
  const { transactions, budgets, monthSpendByCategory, personalGoals, blendGroups } = input
  const debitTxns = transactions.filter((t) => t.type === 'debit')

  const discretionaryTotal = Object.entries(monthSpendByCategory)
    .filter(([cat]) => !NON_DISCRETIONARY.has(cat))
    .reduce((s, [, amt]) => s + amt, 0)

  // My own share of Blend activity — not the full pooled expense amount,
  // since a ₹6000 flight split 3 ways is ₹2000 of *my* money, not ₹6000.
  let myBlendShare = 0
  for (const group of blendGroups) {
    for (const entry of group.ledger) {
      if (entry.type !== 'expense') continue
      if (entry.shares.me != null) myBlendShare += entry.shares.me
    }
  }

  // ── Planner: fraction of budgeted categories currently on track ────────
  const plannerScore = budgets.length === 0
    ? 0
    : clamp01(budgets.filter((b) => (monthSpendByCategory[b.category] || 0) <= b.limit).length / budgets.length)

  // ── Spontaneous: small, frequent, manually-logged (i.e. not on a
  // recurring bill) discretionary purchases. Category-touch diversity was
  // tried here first and dropped — almost any active month touches most
  // spend categories (rent, subs, groceries are just life, not spontaneity),
  // so it barely discriminated and could tip the result on an unrelated
  // signal. Small-transaction share and manual/cash-entry share are more
  // direct proxies for "unplanned."
  const discretionaryTxns = debitTxns.filter((t) => !NON_DISCRETIONARY.has(t.category) && t.category !== 'subs' && t.category !== 'bills')
  const smallTxnRatio = discretionaryTxns.length > 0
    ? discretionaryTxns.filter((t) => t.amount < 500).length / discretionaryTxns.length
    : 0
  const cashRatio = discretionaryTxns.length > 0
    ? discretionaryTxns.filter((t) => t.source === 'cash').length / discretionaryTxns.length
    : 0
  const spontaneousScore = clamp01(smallTxnRatio * 0.6 + cashRatio * 0.4)

  // ── Saver: personal goal contributions this month vs income logged ─────
  const incomeTotal = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const contributionsTotal = personalGoals.reduce(
    (s, g) => s + g.contributions.reduce((s2, c) => s2 + c.amount, 0),
    0,
  )
  const saverScore = incomeTotal > 0 ? clamp01(contributionsTotal / incomeTotal) : 0

  // ── Weekend Warrior: food+entertainment spend concentrated on Sat/Sun ──
  const funCats = new Set(['food', 'entertainment'])
  const funTxns = debitTxns.filter((t) => funCats.has(t.category))
  const funTotal = funTxns.reduce((s, t) => s + t.amount, 0)
  const funWeekendTotal = funTxns.filter((t) => isWeekend(t.date)).reduce((s, t) => s + t.amount, 0)
  const weekendWarriorScore = funTotal > 0 ? clamp01(funWeekendTotal / funTotal) : 0

  // ── Foodie: food share of discretionary spend ──────────────────────────
  const foodTotal = monthSpendByCategory.food || 0
  const foodieScore = discretionaryTotal > 0 ? clamp01(foodTotal / discretionaryTotal) : 0

  // ── Socialite: my Blend share vs my solo discretionary spend ───────────
  const socialiteScore = myBlendShare + discretionaryTotal > 0
    ? clamp01(myBlendShare / (myBlendShare + discretionaryTotal))
    : 0

  return {
    planner: plannerScore,
    spontaneous: spontaneousScore,
    saver: saverScore,
    weekendWarrior: weekendWarriorScore,
    foodie: foodieScore,
    socialite: socialiteScore,
  }
}

export function computePersonalityResult(input) {
  const debitCount = input.transactions.filter((t) => t.type === 'debit').length
  if (debitCount < MIN_TRANSACTIONS_FOR_RESULT) {
    return { ready: false, transactionsNeeded: MIN_TRANSACTIONS_FOR_RESULT - debitCount }
  }

  const scores = computePersonalityScores(input)
  let bestType = null
  let bestScore = -1
  // Object key order = tie-break priority when scores are equal.
  for (const type of Object.keys(PERSONALITY_TYPES)) {
    if (scores[type] > bestScore) {
      bestScore = scores[type]
      bestType = type
    }
  }

  return {
    ready: true,
    type: bestType,
    score: bestScore,
    scores,
    ...PERSONALITY_TYPES[bestType],
  }
}

export { PERSONALITY_TYPES }
