import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Button, Card, Avatar, SectionTitle, formatINR, formatDate } from '../components/ui'

function memberById(group, id) {
  return group.members.find((m) => m.id === id)
}

export default function Blend() {
  const { blendGroup, blendExpenses, blendStats, settleBlendExpense, addBlendExpense } = useAppState()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('me')
  const [split, setSplit] = useState(blendGroup.members.map((m) => m.id))

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

  const toggleSplit = (id) => {
    setSplit((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submitExpense = (e) => {
    e.preventDefault()
    if (!title.trim() || !amount || Number(amount) <= 0 || split.length === 0) return
    addBlendExpense({ title: title.trim(), amount: Number(amount), paidBy, split })
    setTitle('')
    setAmount('')
    setPaidBy('me')
    setSplit(blendGroup.members.map((m) => m.id))
    setAdding(false)
  }

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

      {blendStats && (
        <section className="px-5 mt-6">
          <SectionTitle>Squad stats</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center py-5">
              <p className="text-2xl mb-1">⚡</p>
              <p className="font-bold text-sm">{memberById(blendGroup, blendStats.paysFirstStreak.member)?.name} pays first</p>
              <p className="text-base-400 text-xs mt-0.5">{blendStats.paysFirstStreak.count} times running</p>
            </Card>
            {blendStats.paysLastStreak && (
              <Card className="text-center py-5">
                <p className="text-2xl mb-1">🐢</p>
                <p className="font-bold text-sm">{memberById(blendGroup, blendStats.paysLastStreak.member)?.name} pays last</p>
                <p className="text-base-400 text-xs mt-0.5">{blendStats.paysLastStreak.count} times running</p>
              </Card>
            )}
          </div>
        </section>
      )}

      <section className="px-5 mt-6">
        <SectionTitle
          action={
            !adding && (
              <button onClick={() => setAdding(true)} className="text-xs font-semibold text-base-400 underline decoration-base-600">
                ＋ Add expense
              </button>
            )
          }
        >
          Recent expenses
        </SectionTitle>

        {adding && (
          <Card className="mb-3">
            <form onSubmit={submitExpense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">What was it?</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dinner at Toit"
                  className="w-full mt-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Amount</label>
                <div className="flex items-center gap-2 mt-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
                  <span className="text-base-400 font-numeral text-lg">₹</span>
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-numeral text-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Who paid?</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {blendGroup.members.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaidBy(m.id)}
                      className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors"
                      style={{
                        borderColor: paidBy === m.id ? m.avatarColor : 'var(--color-base-700)',
                        backgroundColor: paidBy === m.id ? `color-mix(in srgb, ${m.avatarColor} 20%, transparent)` : 'transparent',
                        color: paidBy === m.id ? m.avatarColor : 'var(--color-base-200)',
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Split between</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {blendGroup.members.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleSplit(m.id)}
                      className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors"
                      style={{
                        borderColor: split.includes(m.id) ? m.avatarColor : 'var(--color-base-700)',
                        backgroundColor: split.includes(m.id) ? `color-mix(in srgb, ${m.avatarColor} 20%, transparent)` : 'transparent',
                        color: split.includes(m.id) ? m.avatarColor : 'var(--color-base-400)',
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!title.trim() || !amount || split.length === 0}>
                  Add
                </Button>
              </div>
            </form>
          </Card>
        )}

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
