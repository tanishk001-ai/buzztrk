import { useMemo } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, Button, Avatar, SectionTitle, formatINR, formatDate } from '../components/ui'

function memberById(group, id) {
  return group.members.find((m) => m.id === id)
}

export default function Blend() {
  const { blendGroup, blendExpenses, blendStats, settleBlendExpense } = useAppState()

  const balances = useMemo(() => {
    const bal = {}
    for (const m of blendGroup.members) if (m.id !== 'me') bal[m.id] = 0
    for (const e of blendExpenses) {
      if (e.settled) continue
      const share = e.amount / e.split.length
      if (e.paidBy === 'me') {
        for (const id of e.split) {
          if (id !== 'me') bal[id] = (bal[id] || 0) + share
        }
      } else if (e.split.includes('me')) {
        bal[e.paidBy] = (bal[e.paidBy] || 0) - share
      }
    }
    return bal
  }, [blendGroup, blendExpenses])

  const netTotal = Object.values(balances).reduce((s, v) => s + v, 0)

  return (
    <div>
      <Header title="Blend" subtitle={blendGroup.name} />

      <section className="px-5 mt-2">
        <p className="text-base-400 text-sm">{netTotal >= 0 ? 'You are owed' : 'You owe overall'}</p>
        <p
          className="font-display text-4xl font-numeral mt-1"
          style={{ color: netTotal >= 0 ? 'var(--color-good)' : 'var(--color-over)' }}
        >
          {formatINR(Math.abs(netTotal))}
        </p>
        <p className="text-base-400 text-xs mt-1">Settle up outside the app, then mark it done here — BuzzTrk never moves money.</p>
      </section>

      <section className="px-5 mt-6">
        <SectionTitle>Who owes what</SectionTitle>
        <Card className="p-0 overflow-hidden">
          {blendGroup.members
            .filter((m) => m.id !== 'me')
            .map((m, i, arr) => {
              const amt = balances[m.id] || 0
              return (
                <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}>
                  <Avatar name={m.name} color={m.avatarColor} />
                  <p className="flex-1 text-sm font-medium">{m.name}</p>
                  <p className="font-numeral text-sm font-bold" style={{ color: amt === 0 ? 'var(--color-base-400)' : amt > 0 ? 'var(--color-good)' : 'var(--color-over)' }}>
                    {amt === 0 ? 'Settled' : amt > 0 ? `Owes you ${formatINR(amt)}` : `You owe ${formatINR(-amt)}`}
                  </p>
                </div>
              )
            })}
        </Card>
      </section>

      <section className="px-5 mt-6">
        <SectionTitle>Squad stats</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-5">
            <p className="text-2xl mb-1">⚡</p>
            <p className="font-bold text-sm">{memberById(blendGroup, blendStats.paysFirstStreak.member)?.name} pays first</p>
            <p className="text-base-400 text-xs mt-0.5">{blendStats.paysFirstStreak.count} times running</p>
          </Card>
          <Card className="text-center py-5">
            <p className="text-2xl mb-1">🐢</p>
            <p className="font-bold text-sm">{memberById(blendGroup, blendStats.paysLastStreak.member)?.name} pays last</p>
            <p className="text-base-400 text-xs mt-0.5">{blendStats.paysLastStreak.count} times running</p>
          </Card>
        </div>
      </section>

      <section className="px-5 mt-6">
        <SectionTitle>Recent expenses</SectionTitle>
        <div className="space-y-3">
          {blendExpenses
            .slice()
            .sort((a, b) => b.date - a.date)
            .map((e) => {
              const payer = memberById(blendGroup, e.paidBy)
              return (
                <Card key={e.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={payer?.name} color={payer?.avatarColor} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{e.title}</p>
                      <p className="text-xs text-base-400">
                        {payer?.name} paid · {formatDate(e.date)} · split {e.split.length} ways
                      </p>
                    </div>
                    <p className="font-numeral font-bold text-sm">{formatINR(e.amount)}</p>
                  </div>
                  {!e.settled && (
                    <Button variant="ghost" className="w-full mt-3 !py-2 text-sm" onClick={() => settleBlendExpense(e.id)}>
                      Mark settled
                    </Button>
                  )}
                  {e.settled && <p className="text-xs text-cat-groceries mt-3 font-semibold">✓ Settled</p>}
                </Card>
              )
            })}
        </div>
      </section>
    </div>
  )
}
