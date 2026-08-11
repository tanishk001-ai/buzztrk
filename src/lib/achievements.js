// Achievements is a consolidation surface, not a new scoring system — every
// badge here reads from a computation that already exists elsewhere in the
// app. Nothing new is decided about what counts as an achievement; this
// file only gathers and formats.
import { goalProgress } from './goals'
import { computeBlendVibes } from './blendVibes'

function dateReached(goal) {
  const sorted = [...goal.contributions].sort((a, b) => a.date - b.date)
  let total = 0
  for (const c of sorted) {
    total += c.amount
    if (total >= goal.target) return c.date
  }
  return sorted[sorted.length - 1]?.date
}

/**
 * @param {object} input
 * @param {Array} input.achievedMilestones - celebration history from AppState (streak records, first settle-up, etc.)
 * @param {Array} input.personalGoals
 * @param {Array} input.groupGoals
 * @param {Array} input.blendGroups
 */
export function computeAchievements({ achievedMilestones, personalGoals, groupGoals, blendGroups }) {
  const badges = []

  // Celebrations already tracked in AppState (streak record, first full
  // month, first settle-up, all-budgets-on-track) — same events, just given
  // a permanent home instead of a one-shot toast.
  for (const m of achievedMilestones) {
    badges.push({ id: m.id, emoji: m.emoji, title: m.message, sub: null, date: m.date, category: 'celebration' })
  }

  // Savings goals reached — reuses goalProgress() as-is.
  for (const g of personalGoals) {
    const { reached } = goalProgress(g)
    if (reached) {
      badges.push({
        id: `goal-${g.id}`,
        emoji: g.emoji,
        title: `Goal reached: ${g.title}`,
        sub: `Hit your ₹${g.target.toLocaleString('en-IN')} target`,
        date: dateReached(g),
        category: 'savings',
      })
    }
  }
  for (const g of groupGoals) {
    const { reached } = goalProgress(g)
    if (reached) {
      const group = blendGroups.find((bg) => bg.id === g.groupId)
      badges.push({
        id: `ggoal-${g.id}`,
        emoji: g.emoji,
        title: `Group goal reached: ${g.title}`,
        sub: group ? `With ${group.name}` : null,
        date: dateReached(g),
        category: 'savings',
      })
    }
  }

  // Notable Blend standing — reuses computeBlendVibes() per group, same
  // math that already powers each group's Squad Highlights.
  for (const group of blendGroups) {
    const vibes = computeBlendVibes(group.ledger, group.members)
    const asOf = [...group.ledger].sort((a, b) => b.date - a.date)[0]?.date
    if (!asOf) continue
    if (vibes.sponsor?.member === 'me') {
      badges.push({
        id: `sponsor-${group.id}`,
        emoji: '👑',
        title: `The Sponsor of ${group.name}`,
        sub: `Fronted the most for the group`,
        date: asOf,
        category: 'blend',
      })
    }
    if (vibes.fastestSettler?.member === 'me') {
      badges.push({
        id: `fastest-${group.id}`,
        emoji: '🏃',
        title: `Fastest Settler in ${group.name}`,
        sub: null,
        date: asOf,
        category: 'blend',
      })
    }
  }

  badges.sort((a, b) => b.date - a.date)
  return badges
}
