import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, EmptyState } from '../components/ui'

function Pill({ selected, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors"
      style={{
        borderColor: selected ? color : 'var(--color-base-700)',
        backgroundColor: selected ? `color-mix(in srgb, ${color} 20%, transparent)` : 'transparent',
        color: selected ? color : 'var(--color-base-200)',
      }}
    >
      {children}
    </button>
  )
}

export default function BlendSettleUp() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { blendGroups, addBlendSettlement } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)

  const [from, setFrom] = useState('me')
  const [to, setTo] = useState(() => group?.members.find((m) => m.id !== 'me')?.id || '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState emoji="🤷" title="Group not found" />
      </div>
    )
  }

  const amountNum = Number(amount) || 0
  const canSubmit = from !== to && amountNum > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    addBlendSettlement(group.id, { from, to, amount: amountNum, note: note.trim() })
    navigate(`/blend/${group.id}`)
  }

  const setFromSafe = (id) => {
    setFrom(id)
    if (id === to) setTo(group.members.find((m) => m.id !== id)?.id || '')
  }
  const setToSafe = (id) => {
    setTo(id)
    if (id === from) setFrom(group.members.find((m) => m.id !== id)?.id || '')
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback={`/blend/${group.id}`} className="mt-0.5" />
        <h1 className="font-display text-2xl">Settle up</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">
        Record a payment that already happened outside the app — {group.name}.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Who paid?</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.members.map((m) => (
              <Pill key={m.id} selected={from === m.id} color={m.avatarColor} onClick={() => setFromSafe(m.id)}>
                {m.name}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Who received it?</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.members.map((m) => (
              <Pill key={m.id} selected={to === m.id} color={m.avatarColor} onClick={() => setToSafe(m.id)}>
                {m.name}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Amount</label>
          <div className="flex items-center gap-2 mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
            <span className="text-base-400 font-numeral text-lg">₹</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0"
              className="w-full bg-transparent outline-none font-numeral text-lg"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid back in cash"
            className="w-full mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
          />
        </div>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          Record settlement
        </Button>
      </form>
    </div>
  )
}
