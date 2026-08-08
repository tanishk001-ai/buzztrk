import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Card, Avatar, SectionTitle, EmptyState, formatINR, formatDate } from '../components/ui'
import { computePairNet, computeBalancesFor, computeOverallNet, paymentMethodMeta } from '../lib/blendLedger'
import { computeBlendFunStats } from '../lib/blendStats'

function memberById(members, id) {
  return members.find((m) => m.id === id)
}

export default function BlendGroup() {
  const { groupId } = useParams()
  const { blendGroups } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)

  const pairNet = useMemo(() => (group ? computePairNet(group.ledger) : []), [group])
  const myBalances = useMemo(() => computeBalancesFor('me', pairNet), [pairNet])
  const myNet = useMemo(() => computeOverallNet('me', pairNet), [pairNet])
  const otherPairs = useMemo(() => pairNet.filter(({ a, b }) => a !== 'me' && b !== 'me'), [pairNet])
  const funStats = useMemo(() => (group ? computeBlendFunStats(group.ledger, group.members) : null), [group])
  const recent = useMemo(() => (group ? [...group.ledger].sort((a, b) => b.date - a.date).slice(0, 5) : []), [group])

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState emoji="🤷" title="Group not found" sub="It may have been removed." />
      </div>
    )
  }

  return (
    <div>
      <header className="flex items-start justify-between px-5 pt-6 pb-2 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <BackButton fallback="/blend" className="mt-0.5" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl truncate">{group.name}</h1>
            <p className="text-base-400 text-sm mt-0.5">{group.members.length} members</p>
          </div>
        </div>
        <div className="flex -space-x-2 shrink-0 mt-1">
          {group.members.map((m) => (
            <Avatar key={m.id} name={m.name} color={m.avatarColor} size={32} />
          ))}
        </div>
      </header>

      <section className="px-5 mt-2">
        <p className="text-base-400 text-sm">{myNet === 0 ? 'Your balance' : myNet > 0 ? 'You are owed' : 'You owe overall'}</p>
        <p
          className="font-display text-4xl font-numeral mt-1"
          style={{ color: myNet === 0 ? 'var(--color-base-50)' : myNet > 0 ? 'var(--color-good)' : 'var(--color-over)' }}
        >
          {myNet === 0 ? 'All settled up' : formatINR(Math.abs(myNet))}
        </p>
        <p className="text-base-400 text-xs mt-1">
          Settle up outside the app, then record it here — BuzzTrk never moves money.
        </p>

        <div className="flex gap-2 mt-4">
          <Link to={`/blend/${group.id}/add-expense`} className="flex-1">
            <div className="bg-cat-groceries text-base-950 rounded-2xl py-3 text-center text-sm font-bold active:scale-[0.97] transition-transform">
              ＋ Add expense
            </div>
          </Link>
          <Link to={`/blend/${group.id}/settle-up`} className="flex-1">
            <div className="bg-base-800 border border-base-700 rounded-2xl py-3 text-center text-sm font-semibold active:scale-[0.97] transition-transform">
              Settle up
            </div>
          </Link>
        </div>
      </section>

      <section className="px-5 mt-6">
        <SectionTitle>Who owes what</SectionTitle>
        {Object.keys(myBalances).length === 0 ? (
          <Card>
            <p className="text-base-400 text-sm">No balances yet — add your first expense.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {group.members
              .filter((m) => m.id !== 'me' && m.id in myBalances)
              .map((m, i, arr) => {
                const amt = myBalances[m.id]
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}>
                    <Avatar name={m.name} color={m.avatarColor} />
                    <p className="flex-1 text-sm font-medium">{m.name}</p>
                    <p
                      className="font-numeral text-sm font-bold"
                      style={{ color: amt > 0 ? 'var(--color-good)' : 'var(--color-over)' }}
                    >
                      {amt > 0 ? `Owes you ${formatINR(amt)}` : `You owe ${formatINR(-amt)}`}
                    </p>
                  </div>
                )
              })}
          </Card>
        )}
      </section>

      {otherPairs.length > 0 && (
        <section className="px-5 mt-6">
          <SectionTitle>Other balances in the group</SectionTitle>
          <Card className="p-0 overflow-hidden">
            {otherPairs.map(({ a, b, amount }, i) => {
              const debtor = memberById(group.members, amount > 0 ? a : b)
              const creditor = memberById(group.members, amount > 0 ? b : a)
              return (
                <div key={`${a}-${b}`} className={`flex items-center justify-between px-5 py-3 ${i !== otherPairs.length - 1 ? 'border-b border-base-700' : ''}`}>
                  <p className="text-sm text-base-200">
                    {debtor?.name} owes {creditor?.name}
                  </p>
                  <p className="font-numeral text-sm font-bold">{formatINR(Math.abs(amount))}</p>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {funStats && (
        <section className="px-5 mt-6">
          <SectionTitle>Squad stats</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center py-5">
              <p className="text-2xl mb-1">⚡</p>
              <p className="font-bold text-sm">{memberById(group.members, funStats.paysFirstStreak.member)?.name} pays first</p>
              <p className="text-base-400 text-xs mt-0.5">{funStats.paysFirstStreak.count} times running</p>
            </Card>
            {funStats.paysLastStreak && (
              <Card className="text-center py-5">
                <p className="text-2xl mb-1">🐢</p>
                <p className="font-bold text-sm">{memberById(group.members, funStats.paysLastStreak.member)?.name} pays last</p>
                <p className="text-base-400 text-xs mt-0.5">{funStats.paysLastStreak.count} times running</p>
              </Card>
            )}
          </div>
        </section>
      )}

      <section className="px-5 mt-6 mb-4">
        <SectionTitle
          action={
            <Link to={`/blend/${group.id}/history`} className="text-xs font-semibold text-base-400 underline decoration-base-600">
              Full history
            </Link>
          }
        >
          Recent activity
        </SectionTitle>
        <div className="space-y-3">
          {recent.map((entry) => {
            if (entry.type === 'expense') {
              const payer = memberById(group.members, entry.paidBy)
              const method = paymentMethodMeta(entry.paymentMethod)
              return (
                <Card key={entry.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={payer?.name} color={payer?.avatarColor} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{entry.description}</p>
                      <p className="text-xs text-base-400">
                        {payer?.name} paid · {formatDate(entry.date)} · split {Object.keys(entry.shares).length} ways · {method.emoji} {method.label}
                      </p>
                    </div>
                    <p className="font-numeral font-bold text-sm">{formatINR(entry.amount)}</p>
                  </div>
                </Card>
              )
            }
            const from = memberById(group.members, entry.from)
            const to = memberById(group.members, entry.to)
            return (
              <Card key={entry.id} className="bg-base-900">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {from?.name} settled up with {to?.name}
                    </p>
                    <p className="text-xs text-base-400">{formatDate(entry.date)}{entry.note ? ` · ${entry.note}` : ''}</p>
                  </div>
                  <p className="font-numeral font-bold text-sm text-cat-groceries">{formatINR(entry.amount)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
