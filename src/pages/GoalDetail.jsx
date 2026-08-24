import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card, Coin, EmptyState, SectionTitle, formatINR, formatDate } from '../components/ui'
import { Icon } from '../components/icons'
import JourneyPath from '../components/JourneyPath'
import { goalProgress } from '../lib/goals'

export default function GoalDetail() {
  const { goalId } = useParams()
  const { personalGoals, logPersonalContribution, earnPoints } = useAppState()
  const goal = personalGoals.find((g) => g.id === goalId)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [justLogged, setJustLogged] = useState(false)

  if (!goal) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/goals" />
        <EmptyState icon="search" title="Goal not found" />
      </div>
    )
  }

  const { total, pct, remaining, reached } = goalProgress(goal)
  const amountNum = Number(amount) || 0
  const canSubmit = amountNum > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    logPersonalContribution(goal.id, amountNum, note.trim())
    earnPoints(10, `Put aside ${formatINR(amountNum)} toward ${goal.title}`)
    setAmount('')
    setNote('')
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 1400)
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback="/goals" className="mt-0.5" />
        <h1 className="font-display text-2xl flex items-center gap-2">
          <Icon name={goal.emoji} size={22} />
          {goal.title}
        </h1>
      </div>
      <p className="text-base-400 text-sm mb-4 flex items-center gap-1">
        {reached ? (
          <>
            Goal reached! <Icon name="party" size={14} color="var(--color-income)" />
          </>
        ) : (
          `${formatINR(remaining)} left to go`
        )}
      </p>

      <Card className="mb-4">
        <JourneyPath pct={pct} emoji="smile" color="var(--color-income)" destinationEmoji={goal.emoji} />
        <div className="flex items-baseline justify-between mt-2">
          <p className="font-numeral text-2xl font-bold" style={{ color: 'var(--color-income)' }}>
            {formatINR(total)}
          </p>
          <p className="text-base-400 text-sm">/ {formatINR(goal.target)}</p>
        </div>
      </Card>

      {justLogged ? (
        <Card className="flex flex-col items-center py-8 mb-4 animate-coin-pop">
          <div className="mb-2">
            <Coin size={36} />
          </div>
          <p className="font-bold">+10 points</p>
          <p className="text-base-400 text-sm">Nice — logged it.</p>
        </Card>
      ) : (
        <Card className="mb-4">
          <form onSubmit={submit} className="space-y-3">
            <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">I put aside...</label>
            <div className="flex items-center gap-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
              <span className="text-base-400 font-numeral text-lg">₹</span>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="0"
                className="w-full bg-transparent outline-none font-numeral text-lg"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made it possible? (optional)"
              className="w-full bg-base-900 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries text-sm"
            />
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              Log contribution
            </Button>
          </form>
        </Card>
      )}

      <section>
        <SectionTitle>History</SectionTitle>
        {goal.contributions.length === 0 ? (
          <Card>
            <p className="text-base-400 text-sm">Nothing logged yet.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {[...goal.contributions]
              .sort((a, b) => b.date - a.date)
              .map((c, i, arr) => (
                <div key={c.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}>
                  {c.source === 'reward' ? <Coin size={22} /> : <Icon name="piggy" size={20} color="var(--color-income)" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.note || (c.source === 'reward' ? 'Reward redemption' : 'Manual contribution')}</p>
                    <p className="text-xs text-base-400">{formatDate(c.date)}</p>
                  </div>
                  <p className="font-numeral text-sm font-bold" style={{ color: 'var(--color-income)' }}>
                    +{formatINR(c.amount)}
                  </p>
                </div>
              ))}
          </Card>
        )}
      </section>
    </div>
  )
}
