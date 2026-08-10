import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card, Avatar, EmptyState, SectionTitle, formatINR, formatDate } from '../components/ui'
import JourneyPath from '../components/JourneyPath'
import { goalProgress, goalBreakdownByMember } from '../lib/goals'

const GOAL_EMOJIS = ['🏝️', '🎉', '🏔️', '🎟️', '🏠', '🎯']

function memberById(members, id) {
  return members.find((m) => m.id === id)
}

export default function BlendGroupGoal() {
  const { groupId } = useParams()
  const { blendGroups, groupGoals, createGroupGoal, logGroupContribution } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)
  const goal = groupGoals.find((g) => g.groupId === groupId)

  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [emoji, setEmoji] = useState(GOAL_EMOJIS[0])

  const [contribMember, setContribMember] = useState('me')
  const [contribAmount, setContribAmount] = useState('')
  const [contribNote, setContribNote] = useState('')

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState emoji="🤷" title="Group not found" />
      </div>
    )
  }

  if (!goal) {
    const canSubmit = title.trim().length > 0 && Number(target) > 0
    const submit = (e) => {
      e.preventDefault()
      if (!canSubmit) return
      createGroupGoal(group.id, title, Number(target), emoji)
    }
    return (
      <div className="px-5 pt-6">
        <div className="flex items-start gap-3 mb-1">
          <BackButton fallback={`/blend/${group.id}`} className="mt-0.5" />
          <h1 className="font-display text-2xl">Set a group goal</h1>
        </div>
        <p className="text-base-400 text-sm mb-6">{group.name} — everyone can chip in toward it.</p>

        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">What are you saving for?</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next Trip Fund"
                className="w-full mt-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Target amount</label>
              <div className="flex items-center gap-2 mt-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
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
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              Create group goal
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  const { total, pct, remaining, reached } = goalProgress(goal)
  const breakdown = goalBreakdownByMember(goal, group.members)
  const amountNum = Number(contribAmount) || 0
  const canContribute = amountNum > 0

  const submitContribution = (e) => {
    e.preventDefault()
    if (!canContribute) return
    logGroupContribution(goal.id, contribMember, amountNum, contribNote.trim())
    setContribAmount('')
    setContribNote('')
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback={`/blend/${group.id}`} className="mt-0.5" />
        <h1 className="font-display text-2xl">
          {goal.emoji} {goal.title}
        </h1>
      </div>
      <p className="text-base-400 text-sm mb-4">{reached ? 'Goal reached! 🎉' : `${formatINR(remaining)} left to go`}</p>

      <Card className="mb-4">
        <JourneyPath pct={pct} emoji="👥" color="var(--color-income)" destinationEmoji={goal.emoji} />
        <div className="flex items-baseline justify-between mt-2">
          <p className="font-numeral text-2xl font-bold" style={{ color: 'var(--color-income)' }}>
            {formatINR(total)}
          </p>
          <p className="text-base-400 text-sm">/ {formatINR(goal.target)}</p>
        </div>
      </Card>

      <section className="mb-4">
        <SectionTitle>Who's contributed</SectionTitle>
        {breakdown.length === 0 ? (
          <Card>
            <p className="text-base-400 text-sm">No contributions logged yet.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {breakdown.map((row, i) => (
              <div key={row.memberId} className={`flex items-center gap-3 px-5 py-3.5 ${i !== breakdown.length - 1 ? 'border-b border-base-700' : ''}`}>
                <Avatar name={row.name} color={row.avatarColor} size={32} />
                <p className="flex-1 text-sm font-medium">{row.name}</p>
                <p className="font-numeral text-sm font-bold" style={{ color: 'var(--color-income)' }}>
                  {formatINR(row.amount)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </section>

      <Card className="mb-4">
        <form onSubmit={submitContribution} className="space-y-3">
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Log a contribution</label>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setContribMember(m.id)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors"
                style={{
                  borderColor: contribMember === m.id ? m.avatarColor : 'var(--color-base-700)',
                  backgroundColor: contribMember === m.id ? `color-mix(in srgb, ${m.avatarColor} 20%, transparent)` : 'transparent',
                  color: contribMember === m.id ? m.avatarColor : 'var(--color-base-200)',
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
            <span className="text-base-400 font-numeral text-lg">₹</span>
            <input
              inputMode="numeric"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              className="w-full bg-transparent outline-none font-numeral text-lg"
            />
          </div>
          <input
            value={contribNote}
            onChange={(e) => setContribNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-base-900 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries text-sm"
          />
          <Button type="submit" className="w-full" disabled={!canContribute}>
            Log contribution
          </Button>
        </form>
      </Card>

      <section>
        <SectionTitle>History</SectionTitle>
        <Card className="p-0 overflow-hidden">
          {[...goal.contributions]
            .sort((a, b) => b.date - a.date)
            .map((c, i, arr) => {
              const member = memberById(group.members, c.memberId)
              return (
                <div key={c.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}>
                  <Avatar name={member?.name} color={member?.avatarColor} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member?.name}{c.note ? ` — ${c.note}` : ''}</p>
                    <p className="text-xs text-base-400">{formatDate(c.date)}</p>
                  </div>
                  <p className="font-numeral text-sm font-bold" style={{ color: 'var(--color-income)' }}>
                    +{formatINR(c.amount)}
                  </p>
                </div>
              )
            })}
        </Card>
      </section>
    </div>
  )
}
