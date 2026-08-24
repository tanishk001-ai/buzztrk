import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Card, Avatar, EmptyState, formatINR, formatDate } from '../components/ui'
import { Icon } from '../components/icons'
import { entryInvolvesMember, entryInvolvesPair, paymentMethodMeta, visibleLedger } from '../lib/blendLedger'

function memberById(members, id) {
  return members.find((m) => m.id === id)
}

export default function BlendHistory() {
  const { groupId } = useParams()
  const { blendGroups, revealBlendExpense } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)
  const [personA, setPersonA] = useState('anyone')
  const [personB, setPersonB] = useState('anyone')

  const myLedger = useMemo(() => (group ? visibleLedger(group.ledger, 'me') : []), [group])

  const filtered = useMemo(() => {
    if (!group) return []
    const sorted = [...myLedger].sort((a, b) => b.date - a.date)
    if (personA === 'anyone' && personB === 'anyone') return sorted
    if (personA !== 'anyone' && personB !== 'anyone' && personA !== personB) {
      return sorted.filter((e) => entryInvolvesPair(e, personA, personB))
    }
    const single = personA !== 'anyone' ? personA : personB
    if (single === 'anyone') return sorted
    return sorted.filter((e) => entryInvolvesMember(e, single))
  }, [group, myLedger, personA, personB])

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState icon="search" title="Group not found" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback={`/blend/${group.id}`} className="mt-0.5" />
        <h1 className="font-display text-2xl">History</h1>
      </div>
      <p className="text-base-400 text-sm mb-4">{group.name} · every expense and settlement, in order</p>

      <div className="flex items-center gap-2 mb-5">
        <select
          value={personA}
          onChange={(e) => setPersonA(e.target.value)}
          className="flex-1 bg-base-800 border border-base-700 rounded-2xl px-3 py-2.5 text-sm text-base-50 outline-none focus:border-cat-groceries"
        >
          <option value="anyone">Anyone</option>
          {group.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="text-base-400 text-xs">and</span>
        <select
          value={personB}
          onChange={(e) => setPersonB(e.target.value)}
          className="flex-1 bg-base-800 border border-base-700 rounded-2xl px-3 py-2.5 text-sm text-base-50 outline-none focus:border-cat-groceries"
        >
          <option value="anyone">Anyone</option>
          {group.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="Nothing here" sub="No activity matches that filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            if (entry.type === 'expense') {
              const payer = memberById(group.members, entry.paidBy)
              const method = paymentMethodMeta(entry.paymentMethod)
              const shareEntries = Object.entries(entry.shares)
              const hiddenFromNames = (entry.hiddenFrom || []).map((id) => memberById(group.members, id)?.name).filter(Boolean)
              return (
                <Card key={entry.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={payer?.name} color={payer?.avatarColor} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{entry.description}</p>
                      <p className="text-xs text-base-400 flex items-center gap-1 flex-wrap">
                        {payer?.name} paid · {formatDate(entry.date)} ·
                        <Icon name={method.emoji} size={11} className="inline-block" />
                        {method.label} · {entry.splitType === 'custom' ? 'custom split' : 'equal split'}
                      </p>
                    </div>
                    <p className="font-numeral font-bold text-sm">{formatINR(entry.amount)}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-base-700 flex flex-wrap gap-2">
                    {shareEntries.map(([memberId, share]) => {
                      const m = memberById(group.members, memberId)
                      return (
                        <span key={memberId} className="text-xs bg-base-900 rounded-full px-2.5 py-1 text-base-400">
                          {m?.name}: {formatINR(share)}
                        </span>
                      )
                    })}
                  </div>
                  {hiddenFromNames.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-base-700 flex items-center justify-between gap-2">
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-cat-emi)' }}>
                        <Icon name="eye-off" size={12} />
                        Hidden from {hiddenFromNames.join(', ')}
                      </p>
                      <button
                        type="button"
                        onClick={() => revealBlendExpense(group.id, entry.id)}
                        className="text-xs font-semibold text-base-400 underline decoration-base-600 shrink-0"
                      >
                        Reveal
                      </button>
                    </div>
                  )}
                </Card>
              )
            }
            const from = memberById(group.members, entry.from)
            const to = memberById(group.members, entry.to)
            return (
              <Card key={entry.id} className="bg-base-900">
                <div className="flex items-center gap-3">
                  <Icon name="check-circle" size={22} color="var(--color-good)" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {from?.name} settled up with {to?.name}
                    </p>
                    <p className="text-xs text-base-400">
                      {formatDate(entry.date)}
                      {entry.note ? ` · ${entry.note}` : ''}
                    </p>
                  </div>
                  <p className="font-numeral font-bold text-sm text-cat-groceries">{formatINR(entry.amount)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
