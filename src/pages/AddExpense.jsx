import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card } from '../components/ui'
import { CATEGORIES } from '../lib/categorize'

export default function AddExpense() {
  const { addCashExpense, earnPoints, today } = useAppState()
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [saved, setSaved] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!description.trim() || !amount || Number(amount) <= 0) return
    addCashExpense({ date: today, description: description.trim(), amount: Number(amount), category })
    earnPoints(10, 'Logged a cash expense')
    setSaved(true)
    setTimeout(() => navigate('/'), 900)
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-start gap-3 mb-1">
        <BackButton className="mt-0.5" />
        <h1 className="font-display text-2xl">Add cash expense</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">For spending that never shows up in a bank feed.</p>

      {saved ? (
        <Card className="flex flex-col items-center py-10 animate-coin-pop">
          <div className="text-4xl mb-2">🪙</div>
          <p className="font-bold">+10 points</p>
          <p className="text-base-400 text-sm">Nice — logged it.</p>
        </Card>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">What was it?</label>
            <input
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Auto fare, street food"
              className="w-full mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Amount</label>
            <div className="flex items-center gap-2 mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
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
            <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Category</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.filter((c) => c.id !== 'transfers' && c.id !== 'emi' && c.id !== 'other').map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className="px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 border transition-colors"
                  style={{
                    borderColor: category === c.id ? c.color : 'var(--color-base-700)',
                    backgroundColor: category === c.id ? `color-mix(in srgb, ${c.color} 20%, transparent)` : 'transparent',
                    color: category === c.id ? c.color : 'var(--color-base-200)',
                  }}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full mt-2">
            Save expense
          </Button>
        </form>
      )}
    </div>
  )
}
