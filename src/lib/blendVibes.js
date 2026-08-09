// Seven "fun stats" layered on top of Blend's existing, already-verified
// ledger — no new data model, just new views on the same expense/settlement
// fields (payer, split, amount, description, payment method, timestamps).
// Same rule as Wrapped governs the copy here: comparisons celebrate, they
// never call anyone out. There is no "slowest to settle" or "biggest
// debtor" stat, by design.

const MS_PER_DAY = 1000 * 60 * 60 * 24
const OVERDUE_DAYS_THRESHOLD = 3

// ── Purpose tagging (for Signature Order + Group Vibe) ──────────────────────
// A small keyword set tuned to typical *group* expense descriptions
// (trips, hangouts, shared meals) — deliberately separate from
// lib/categorize.js, which is tuned to individual UPI transaction
// narrations and doesn't cover things like "flight" or "hostel" well.
const PURPOSE_RULES = [
  { id: 'food', keywords: ['biryani', 'lunch', 'dinner', 'brunch', 'breakfast', 'cafe', 'coffee', 'food', 'pizza', 'burger', 'snack', 'drinks', 'cake', 'restaurant'] },
  { id: 'travel', keywords: ['flight', 'train', 'bus', 'scuba', 'diving', 'trip', 'tour', 'sightseeing', 'taxi fare'] },
  { id: 'stay', keywords: ['hostel', 'hotel', 'booking', 'accommodation', 'stay', 'airbnb', 'lodge'] },
  { id: 'entertainment', keywords: ['movie', 'concert', 'pvr', 'inox', 'cinema', 'party', 'club', 'game'] },
  { id: 'transport', keywords: ['cab', 'taxi', 'uber', 'ola', 'metro', 'fuel', 'petrol'] },
  { id: 'shopping', keywords: ['grocery', 'groceries', 'shopping', 'supplies'] },
]

const PURPOSE_VIBE_LABELS = {
  food: { label: 'Biryani Nights', emoji: '🍗' },
  travel: { label: 'Wanderlust', emoji: '✈️' },
  stay: { label: 'Cozy Stays', emoji: '🏨' },
  entertainment: { label: 'Movie Marathons', emoji: '🎬' },
  transport: { label: 'Cab Rides', emoji: '🚕' },
  shopping: { label: 'Shopping Sprees', emoji: '🛍️' },
  other: { label: 'Good Vibes', emoji: '🎉' },
}

const GROUP_VIBE_BY_PURPOSE = {
  food: { label: 'Certified Foodie Squad', emoji: '🍗', color: 'var(--color-cat-food)' },
  entertainment: { label: 'Entertainment Enthusiasts', emoji: '🎬', color: 'var(--color-cat-entertainment)' },
  transport: { label: 'On-The-Go Crew', emoji: '🚕', color: 'var(--color-cat-transport)' },
  shopping: { label: 'Retail Therapy Regulars', emoji: '🛍️', color: 'var(--color-cat-shopping)' },
  other: { label: 'Squad Goals', emoji: '🤝', color: 'var(--color-cat-other)' },
}

const COMBINING_DIACRITICS_RE = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g')

function tagPurpose(description) {
  // Normalize diacritics ("Café" -> "cafe") so accented merchant/venue
  // names still match plain-ASCII keywords.
  const d = (description || '').normalize('NFD').replace(COMBINING_DIACRITICS_RE, '').toLowerCase()
  for (const rule of PURPOSE_RULES) {
    if (rule.keywords.some((k) => d.includes(k))) return rule.id
  }
  return 'other'
}

function purposeCounts(ledger) {
  const counts = {}
  for (const entry of ledger) {
    if (entry.type !== 'expense') continue
    const tag = tagPurpose(entry.description)
    counts[tag] = (counts[tag] || 0) + 1
  }
  return counts
}

function topEntry(counts) {
  let bestId = null
  let bestCount = -1
  for (const [id, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count
      bestId = id
    }
  }
  return bestId ? { id: bestId, count: bestCount } : null
}

// 1. The Sponsor — who has fronted the most money for the group so far.
export function computeSponsor(ledger, members) {
  const totals = {}
  for (const entry of ledger) {
    if (entry.type !== 'expense') continue
    totals[entry.paidBy] = (totals[entry.paidBy] || 0) + entry.amount
  }
  const top = topEntry(totals)
  if (!top) return null
  const member = members.find((m) => m.id === top.id)
  return { member: top.id, name: member?.name, amount: top.count }
}

// 2. Group's Signature Order — the dominant expense purpose, as a flavor tag.
export function computeSignatureOrder(ledger) {
  const counts = purposeCounts(ledger)
  const top = topEntry(counts)
  if (!top) return null
  const vibe = PURPOSE_VIBE_LABELS[top.id] || PURPOSE_VIBE_LABELS.other
  return { purpose: top.id, label: vibe.label, emoji: vibe.emoji, count: top.count }
}

// 3. Fastest Settler — shortest average gap between owing a share and
// settling it. Settlements aren't tied to a specific expense in the data
// model, so this matches each settlement to the most recent prior expense
// where `from` owed `to` a share — a reasonable approximation, not exact
// ledger-level linkage.
export function computeFastestSettler(ledger, members) {
  const settlements = ledger.filter((e) => e.type === 'settlement')
  const expenses = ledger.filter((e) => e.type === 'expense')
  const gapsByMember = {}

  for (const s of settlements) {
    let bestExpense = null
    for (const e of expenses) {
      if (e.date > s.date) continue
      if (e.paidBy !== s.to) continue
      if (!Object.keys(e.shares).includes(s.from)) continue
      if (!bestExpense || e.date > bestExpense.date) bestExpense = e
    }
    if (!bestExpense) continue
    const gapDays = Math.max(0, Math.round((s.date - bestExpense.date) / MS_PER_DAY))
    if (!gapsByMember[s.from]) gapsByMember[s.from] = []
    gapsByMember[s.from].push(gapDays)
  }

  let bestMember = null
  let bestAvg = Infinity
  for (const [memberId, gaps] of Object.entries(gapsByMember)) {
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
    if (avg < bestAvg) {
      bestAvg = avg
      bestMember = memberId
    }
  }
  if (!bestMember) return null
  const member = members.find((m) => m.id === bestMember)
  return { member: bestMember, name: member?.name, avgDays: Math.round(bestAvg * 10) / 10 }
}

// 4. Duo of the Month — the pair of members who most often share an expense.
export function computeDuoOfTheMonth(ledger, members) {
  const pairCounts = {}
  for (const entry of ledger) {
    if (entry.type !== 'expense') continue
    const ids = Object.keys(entry.shares)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`
        pairCounts[key] = (pairCounts[key] || 0) + 1
      }
    }
  }
  const top = topEntry(pairCounts)
  if (!top || top.count === 0) return null
  const [idA, idB] = top.id.split('|')
  return {
    memberA: idA,
    memberB: idB,
    nameA: members.find((m) => m.id === idA)?.name,
    nameB: members.find((m) => m.id === idB)?.name,
    count: top.count,
  }
}

// 5. Split Style — a light personality tag per member, based on whether
// they more often use equal or custom splits when they pay.
export function computeSplitStyles(ledger, members) {
  const tally = {}
  for (const entry of ledger) {
    if (entry.type !== 'expense') continue
    if (!tally[entry.paidBy]) tally[entry.paidBy] = { equal: 0, custom: 0 }
    tally[entry.paidBy][entry.splitType === 'custom' ? 'custom' : 'equal']++
  }
  const styles = []
  for (const m of members) {
    const t = tally[m.id]
    if (!t) continue
    let tag, emoji
    if (t.equal > t.custom) {
      tag = 'Equal Split Purist'
      emoji = '⚖️'
    } else if (t.custom > t.equal) {
      tag = 'Custom Split Perfectionist'
      emoji = '🎯'
    } else {
      tag = 'The Flexible One'
      emoji = '🌀'
    }
    styles.push({ member: m.id, name: m.name, tag, emoji })
  }
  return styles
}

// 6. The Comeback — settling up after being a little overdue, framed as a
// positive "back on track" moment. Uses the same expense-matching heuristic
// as Fastest Settler, but only surfaces the most recent gap that cleared
// the "was overdue" bar — never mentions lateness as a flaw.
export function computeComeback(ledger, members) {
  const settlements = [...ledger.filter((e) => e.type === 'settlement')].sort((a, b) => b.date - a.date)
  const expenses = ledger.filter((e) => e.type === 'expense')

  for (const s of settlements) {
    let bestExpense = null
    for (const e of expenses) {
      if (e.date > s.date) continue
      if (e.paidBy !== s.to) continue
      if (!Object.keys(e.shares).includes(s.from)) continue
      if (!bestExpense || e.date > bestExpense.date) bestExpense = e
    }
    if (!bestExpense) continue
    const gapDays = Math.round((s.date - bestExpense.date) / MS_PER_DAY)
    if (gapDays >= OVERDUE_DAYS_THRESHOLD) {
      const member = members.find((m) => m.id === s.from)
      return { member: s.from, name: member?.name, gapDays, description: bestExpense.description }
    }
  }
  return null
}

// 7. Group Vibe — a single badge for the group derived from its purpose
// mix. Travel/stay-heavy groups read as trip-mode; otherwise the dominant
// category gets its own badge, with a generic positive fallback.
export function computeGroupVibe(ledger) {
  const counts = purposeCounts(ledger)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  const travelHeavy = ((counts.travel || 0) + (counts.stay || 0)) / total >= 0.4
  if (travelHeavy) return { label: 'Trip Mode', emoji: '✈️', color: 'var(--color-cat-subs)' }

  const top = topEntry(counts)
  return GROUP_VIBE_BY_PURPOSE[top.id] || GROUP_VIBE_BY_PURPOSE.other
}

// Bundles everything for a single group render. Any stat without enough
// data comes back null and the UI simply omits that card.
export function computeBlendVibes(ledger, members) {
  return {
    sponsor: computeSponsor(ledger, members),
    signatureOrder: computeSignatureOrder(ledger),
    fastestSettler: computeFastestSettler(ledger, members),
    duo: computeDuoOfTheMonth(ledger, members),
    splitStyles: computeSplitStyles(ledger, members),
    comeback: computeComeback(ledger, members),
    groupVibe: computeGroupVibe(ledger),
  }
}
