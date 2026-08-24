import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import { BackButton, Card, EmptyState, formatDate } from '../components/ui'
import { IconBadge } from '../components/icons'
import { computeAchievements } from '../lib/achievements'
import { computeMoneySense } from '../lib/moneySense'

const FEATURED_COUNT = 3

function BadgeCard({ badge }) {
  return (
    <Card className="flex items-center gap-3">
      <IconBadge name={badge.emoji} color="var(--color-coin)" size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{badge.title}</p>
        <p className="text-xs text-base-400 mt-0.5">{badge.sub ? `${badge.sub} · ` : ''}{formatDate(badge.date)}</p>
      </div>
    </Card>
  )
}

export default function Profile() {
  const { transactions, budgets, monthSpendByCategory, personalGoals, groupGoals, blendGroups, streak, achievedMilestones } =
    useAppState()
  const [showAllBadges, setShowAllBadges] = useState(false)

  const badges = useMemo(
    () => computeAchievements({ achievedMilestones, personalGoals, groupGoals, blendGroups }),
    [achievedMilestones, personalGoals, groupGoals, blendGroups],
  )

  const moneySense = useMemo(
    () =>
      computeMoneySense({
        transactions,
        budgets,
        monthSpendByCategory,
        personalGoals,
        blendGroups,
        currentStreak: streak.currentStreak,
      }),
    [transactions, budgets, monthSpendByCategory, personalGoals, blendGroups, streak.currentStreak],
  )

  const featured = badges.slice(0, FEATURED_COUNT)
  const rest = badges.slice(FEATURED_COUNT)

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback="/" className="mt-0.5" />
        <h1 className="font-display text-2xl">Profile</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">Private to you — never shown to anyone else, never part of The Recap.</p>

      <section className="mb-8">
        <Card className="bg-base-800">
          <p className="text-xs font-semibold text-base-400 uppercase tracking-wide">Money Sense</p>
          <p className="font-display text-6xl font-numeral mt-2" style={{ color: 'var(--color-income)' }}>
            {moneySense.score}
          </p>
          <p className="text-base-200 text-sm mt-2">
            Builds up as you track consistently, stay on budget, and save toward your goals — there's no ceiling and
            nothing here can go "bad."
          </p>
          <div className="mt-5 space-y-3">
            {moneySense.breakdown.map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-base-200">{b.label}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-base-700 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(b.value * 100)}%`, backgroundColor: 'var(--color-income)' }}
                  />
                </div>
                <p className="text-base-400 text-xs mt-1">{b.blurb}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base-200 font-semibold text-sm tracking-wide uppercase">Achievements</h2>
          {badges.length > FEATURED_COUNT && (
            <button
              onClick={() => setShowAllBadges((s) => !s)}
              className="text-xs font-semibold text-base-400 underline decoration-base-600"
            >
              {showAllBadges ? 'Show less' : `View all (${badges.length})`}
            </button>
          )}
        </div>

        {badges.length === 0 ? (
          <EmptyState icon="trophy" title="Nothing yet" sub="Keep tracking — your first milestones will show up here." />
        ) : (
          <div className="space-y-3">
            {(showAllBadges ? badges : featured).map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        )}
        {!showAllBadges && rest.length > 0 && (
          <p className="text-base-400 text-xs mt-3 text-center">+{rest.length} more earned</p>
        )}
      </section>
    </div>
  )
}
