// A single private composite number — deliberately not CIBIL-shaped:
// no bands (poor/fair/good/excellent), no danger color, no "dropping"
// language, no comparison to anyone else. It's shown with the bare number
// only, never a "/100" or visible ceiling, so it reads as an internal,
// personal, growth-oriented metric rather than a graded score.
//
// Reuses existing signal computations rather than scoring from scratch:
// budget adherence and savings-consistency come straight from
// computePersonalityScores() (the same math behind the personality
// result), and tracking consistency reuses the streak system already
// computed in AppState.
import { computePersonalityScores } from './personality'

function clamp01(n) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

const STREAK_TARGET_DAYS = 30

export function computeMoneySense({ transactions, budgets, monthSpendByCategory, personalGoals, blendGroups, currentStreak }) {
  const scores = computePersonalityScores({ transactions, budgets, monthSpendByCategory, personalGoals, blendGroups })
  const trackingScore = clamp01(currentStreak / STREAK_TARGET_DAYS)

  const breakdown = [
    { id: 'budget', label: 'Budget adherence', value: scores.planner, blurb: 'How often your spend stays under what you set.' },
    { id: 'savings', label: 'Savings consistency', value: scores.saver, blurb: 'How much of what you earn you put toward goals.' },
    { id: 'tracking', label: 'Tracking consistency', value: trackingScore, blurb: 'How steady your logging streak has been.' },
  ]

  const composite = breakdown.reduce((s, b) => s + b.value, 0) / breakdown.length
  const score = Math.round(composite * 100)

  return { score, breakdown }
}
