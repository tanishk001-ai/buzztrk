import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card, EmptyState } from '../components/ui'
import { Icon } from '../components/icons'
import { PAYMENT_METHODS, splitEqually, customSplitSum, isValidCustomSplit } from '../lib/blendLedger'

function Pill({ selected, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors inline-flex items-center gap-1.5"
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

export default function BlendAddExpense() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { blendGroups, addBlendExpense } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('me')
  const [splitAmong, setSplitAmong] = useState(group ? group.members.map((m) => m.id) : [])
  const [splitType, setSplitType] = useState('equal')
  const [customShares, setCustomShares] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [hiddenFrom, setHiddenFrom] = useState([])

  const amountNum = Number(amount) || 0

  const toggleSplit = (id) => {
    setSplitAmong((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleHidden = (id) => {
    setHiddenFrom((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const customSum = useMemo(
    () => customSplitSum(Object.fromEntries(splitAmong.map((id) => [id, customShares[id] || 0]))),
    [customShares, splitAmong],
  )

  const customValid = splitType !== 'custom' || (amountNum > 0 && isValidCustomSplit(amountNum, Object.fromEntries(splitAmong.map((id) => [id, customShares[id] || 0]))))

  const canSubmit = description.trim().length > 0 && amountNum > 0 && splitAmong.length > 0 && customValid

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState icon="search" title="Group not found" />
      </div>
    )
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const shares =
      splitType === 'equal'
        ? splitEqually(amountNum, splitAmong)
        : Object.fromEntries(splitAmong.map((id) => [id, Number(customShares[id] || 0)]))

    addBlendExpense(group.id, {
      description: description.trim(),
      amount: amountNum,
      paidBy,
      splitType,
      shares,
      paymentMethod,
      hiddenFrom,
    })
    navigate(`/blend/${group.id}`)
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback={`/blend/${group.id}`} className="mt-0.5" />
        <h1 className="font-display text-2xl">Add expense</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">{group.name}</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">What was it for?</label>
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner at Toit"
            className="w-full mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
          />
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
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Who paid?</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.members.map((m) => (
              <Pill key={m.id} selected={paidBy === m.id} color={m.avatarColor} onClick={() => setPaidBy(m.id)}>
                {m.name}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Split among</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.members.map((m) => (
              <Pill key={m.id} selected={splitAmong.includes(m.id)} color={m.avatarColor} onClick={() => toggleSplit(m.id)}>
                {m.name}
              </Pill>
            ))}
          </div>
          <p className="text-base-400 text-xs mt-1">Doesn't have to be everyone — tap to exclude someone.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Split type</label>
          <div className="flex gap-2 mt-2">
            <Pill selected={splitType === 'equal'} color="var(--color-cat-groceries)" onClick={() => setSplitType('equal')}>
              Equal
            </Pill>
            <Pill selected={splitType === 'custom'} color="var(--color-cat-groceries)" onClick={() => setSplitType('custom')}>
              Custom amounts
            </Pill>
          </div>
        </div>

        {splitType === 'custom' && (
          <Card>
            <div className="space-y-3">
              {splitAmong.length === 0 ? (
                <p className="text-base-400 text-sm">Pick who's splitting this first.</p>
              ) : (
                group.members
                  .filter((m) => splitAmong.includes(m.id))
                  .map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <p className="text-sm font-medium flex-1">{m.name}</p>
                      <div className="flex items-center gap-1.5 bg-base-900 border border-base-700 rounded-xl px-3 py-2">
                        <span className="text-base-400 text-sm">₹</span>
                        <input
                          inputMode="decimal"
                          value={customShares[m.id] ?? ''}
                          onChange={(e) =>
                            setCustomShares((prev) => ({ ...prev, [m.id]: e.target.value.replace(/[^\d.]/g, '') }))
                          }
                          placeholder="0"
                          className="w-20 bg-transparent outline-none font-numeral text-sm text-right"
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-700">
              <span className="text-xs text-base-400">Sum of shares</span>
              <span className="text-sm font-numeral font-bold" style={{ color: customValid ? 'var(--color-good)' : 'var(--color-over)' }}>
                ₹{customSum} / ₹{amountNum || 0}
              </span>
            </div>
            {!customValid && amountNum > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-over)' }}>
                Custom shares must add up to the total amount.
              </p>
            )}
          </Card>
        )}

        {group.members.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Hide from (optional)</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {group.members
                .filter((m) => m.id !== 'me')
                .map((m) => (
                  <Pill key={m.id} selected={hiddenFrom.includes(m.id)} color="var(--color-cat-emi)" onClick={() => toggleHidden(m.id)}>
                    <Icon name="eye-off" size={13} />
                    {m.name}
                  </Pill>
                ))}
            </div>
            <p className="text-base-400 text-xs mt-1">
              For surprise planning — tagged members won't see this expense anywhere until you reveal it.
            </p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Payment method</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PAYMENT_METHODS.map((pm) => (
              <Pill key={pm.id} selected={paymentMethod === pm.id} color="var(--color-cat-transport)" onClick={() => setPaymentMethod(pm.id)}>
                <Icon name={pm.emoji} size={13} />
                {pm.label}
              </Pill>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          Add expense
        </Button>
      </form>
    </div>
  )
}
