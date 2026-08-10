import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Button, Card, EmptyState, ProgressBar, formatINR } from '../components/ui'
import { goalProgress } from '../lib/goals'

const GOAL_EMOJIS = ['🎯', '💻', '✈️', '🎓', '🏍️', '📱', '🏠', '💍']

export default function Goals() {
  const { personalGoals, createPersonalGoal } = useAppState()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [emoji, setEmoji] = useState(GOAL_EMOJIS[0])

  const canSubmit = title.trim().length > 0 && Number(target) > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    createPersonalGoal(title, Number(target), emoji)
    setTitle('')
    setTarget('')
    setEmoji(GOAL_EMOJIS[0])
    setAdding(false)
  }

  return (
    <div>
      <Header title="Savings Goals" subtitle="Set a target, log what you put aside — no auto-debits" />

      <section className="px-5 mt-4">
        {adding ? (
          <Card className="mb-4">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">What are you saving for?</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Laptop Fund"
                  className="w-full mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Target amount</label>
                <div className="flex items-center gap-2 mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
                  <span className="text-base-400 font-numeral text-lg">₹</span>
                  <input
                    inputMode="numeric"
                    value={target}
                    onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-numeral text-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Icon</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {GOAL_EMOJIS.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setEmoji(em)}
                      className="w-11 h-11 rounded-full text-lg flex items-center justify-center border transition-colors"
                      style={{
                        borderColor: emoji === em ? 'var(--color-cat-groceries)' : 'var(--color-base-700)',
                        backgroundColor: emoji === em ? 'color-mix(in srgb, var(--color-cat-groceries) 20%, transparent)' : 'transparent',
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!canSubmit}>
                  Create goal
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full bg-cat-groceries text-base-950 rounded-2xl py-3 text-center text-sm font-bold active:scale-[0.97] transition-transform mb-4"
          >
            ＋ New savings goal
          </button>
        )}

        {personalGoals.length === 0 ? (
          <EmptyState emoji="🐷" title="No goals yet" sub="Set a target and start logging what you put aside." />
        ) : (
          <div className="space-y-3">
            {personalGoals.map((g) => {
              const { total, pct } = goalProgress(g)
              return (
                <Link key={g.id} to={`/goals/${g.id}`}>
                  <Card>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {g.emoji} {g.title}
                      </span>
                      <span className="text-xs text-base-400">{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color="var(--color-income)" />
                    <p className="font-numeral text-sm font-bold mt-2">
                      {formatINR(total)} <span className="text-base-400 text-xs font-body font-normal">/ {formatINR(g.target)}</span>
                    </p>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
