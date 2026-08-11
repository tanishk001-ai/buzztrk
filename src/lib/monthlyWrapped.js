// Wrapped, monthly cadence — replaces the old fabricated annual story with
// a light, quick recap computed from this month's real data. 2-3 cards,
// same framing rules as always: personal, positive, never comparative
// against other users. Any comparison here is against the user's own
// month, not other people.
import { categoryMeta } from './categorize'

const NON_SPEND = new Set(['income'])

export function computeMonthlyWrapped({ monthSpendByCategory, budgets, today }) {
  const monthName = today.toLocaleDateString('en-IN', { month: 'long' })
  const spendEntries = Object.entries(monthSpendByCategory).filter(([cat]) => !NON_SPEND.has(cat))
  const totalSpend = spendEntries.reduce((s, [, amt]) => s + amt, 0)
  const top = [...spendEntries].sort((a, b) => b[1] - a[1])[0]

  const cards = [
    { id: 'intro', kind: 'intro', headline: `Your ${monthName},\nso far.`, sub: 'A quick look back.' },
  ]

  if (top && totalSpend > 0) {
    const meta = categoryMeta(top[0])
    cards.push({
      id: 'top-category',
      kind: 'top-category',
      headline: meta.label,
      sub: `was where most of your money went this month`,
      category: top[0],
    })
  }

  if (budgets.length > 0) {
    const onTrackCount = budgets.filter((b) => (monthSpendByCategory[b.category] || 0) <= b.limit).length
    const allOnTrack = onTrackCount === budgets.length
    cards.push({
      id: 'outro',
      kind: 'outro',
      headline: allOnTrack ? 'Every category\non track.' : `${onTrackCount}/${budgets.length}\non track.`,
      sub: allOnTrack ? 'Keep it up.' : 'Still a solid month of tracking.',
    })
  } else {
    cards.push({
      id: 'outro',
      kind: 'outro',
      headline: 'Keep\ntracking.',
      sub: 'Set a budget to see how you\'re pacing next time.',
    })
  }

  return { month: monthName, cards: cards.slice(0, 3) }
}
