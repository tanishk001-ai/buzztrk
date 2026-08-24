import { useMemo, useRef } from 'react'
import { useAppState } from '../state/AppState'
import { BackButton, Card } from '../components/ui'
import { Icon } from '../components/icons'
import { computePersonalityResult } from '../lib/personality'
import ShareButton from '../components/ShareButton'

const SIGNAL_EXPLAINERS = {
  planner: (s) => `${Math.round(s.planner * 100)}% of your budgeted categories are on track this month.`,
  spontaneous: (s) => `A large share of your discretionary spend is small, unplanned purchases.`,
  saver: (s) => `You've put aside a meaningful share of what you've earned this month.`,
  weekendWarrior: (s) => `${Math.round(s.weekendWarrior * 100)}% of your food & entertainment spend lands on weekends.`,
  foodie: (s) => `Food & eating out is ${Math.round(s.foodie * 100)}% of your discretionary spend.`,
  socialite: (s) => `${Math.round(s.socialite * 100)}% of your money this month moved through shared, group spending.`,
}

export default function Personality() {
  const { transactions, budgets, monthSpendByCategory, personalGoals, blendGroups } = useAppState()

  const result = useMemo(
    () => computePersonalityResult({ transactions, budgets, monthSpendByCategory, personalGoals, blendGroups }),
    [transactions, budgets, monthSpendByCategory, personalGoals, blendGroups],
  )

  if (!result.ready) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/" />
        <div className="flex flex-col items-center text-center py-16">
          <div className="text-base-400 mb-3 animate-float-slow">
            <Icon name="search" size={40} strokeWidth={1.4} />
          </div>
          <p className="font-semibold mb-1">Still figuring you out</p>
          <p className="text-base-400 text-sm max-w-xs">
            Log {result.transactionsNeeded} more transaction{result.transactionsNeeded === 1 ? '' : 's'} and we'll have
            enough to spot your spending personality.
          </p>
        </div>
      </div>
    )
  }

  const explain = SIGNAL_EXPLAINERS[result.type](result.scores)
  const cardRef = useRef(null)

  return (
    <div className="min-h-svh">
      <div className="px-5 pt-6">
        <BackButton fallback="/" />
      </div>

      <div
        ref={cardRef}
        className="mx-5 mt-4 rounded-[1.75rem] p-8 text-center relative"
        style={{ background: `linear-gradient(155deg, ${result.color}, var(--color-wrap-2))` }}
      >
        <div className="absolute top-3 right-3">
          <ShareButton targetRef={cardRef} filename="buzztrk-personality.png" shareTitle="My BuzzTrk spending personality" shareText={`I'm ${result.label} on BuzzTrk`} />
        </div>
        <p className="text-base-950/70 text-sm font-semibold uppercase tracking-wide">Your spending personality</p>
        <div className="text-base-950 my-4 flex justify-center">
          <Icon name={result.emoji} size={56} strokeWidth={1.4} />
        </div>
        <p className="font-display text-3xl text-base-950 leading-tight">{result.label}</p>
        <p className="text-base-950/80 text-sm mt-3 max-w-xs mx-auto">{result.tagline}</p>
      </div>

      <div className="px-5 mt-5">
        <Card>
          <p className="text-xs font-semibold text-base-400 uppercase tracking-wide mb-1">Why this fits</p>
          <p className="text-sm">{explain}</p>
        </Card>
        <p className="text-base-400 text-xs mt-4 text-center px-4">
          Based on your own patterns only — never compared against other users.
        </p>
      </div>
    </div>
  )
}
