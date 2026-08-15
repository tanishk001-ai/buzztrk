import { useState } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Button, Card, ProgressBar, formatINR } from '../components/ui'
import NewCategoryForm from '../components/NewCategoryForm'
import { CATEGORIES, categoryMeta } from '../lib/categorize'

const EXCLUDED_FROM_BUDGETS = ['income', 'cash_withdrawal', 'transfers', 'emi', 'other']

export default function Budgets() {
  const { monthSpendByCategory, budgets, addBudget, addCustomCategory } = useAppState()
  const [adding, setAdding] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const budgetedIds = new Set(budgets.map((b) => b.category))
  const availableCategories = CATEGORIES.filter((c) => !EXCLUDED_FROM_BUDGETS.includes(c.id) && !budgetedIds.has(c.id))

  const submitNewBudget = (e) => {
    e.preventDefault()
    if (!newCategory || !newLimit || Number(newLimit) <= 0) return
    addBudget(newCategory, Number(newLimit))
    setNewCategory('')
    setNewLimit('')
    setAdding(false)
  }

  return (
    <div>
      <Header title="Budgets" subtitle="Set a limit per category, no shame if you slip" />

      <section className="px-5 mt-4 space-y-3">
        {budgets.map((b) => {
          const meta = categoryMeta(b.category)
          const spent = monthSpendByCategory[b.category] || 0
          const pct = Math.round((spent / b.limit) * 100)
          const status = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'good'
          const statusLabel = status === 'over' ? 'Over budget' : status === 'warn' ? 'Almost there' : 'On track'
          const statusColor = status === 'over' ? 'var(--color-over)' : status === 'warn' ? 'var(--color-warn)' : 'var(--color-good)'

          return (
            <Card key={b.category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="font-semibold text-sm">{meta.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: statusColor, backgroundColor: `color-mix(in srgb, ${statusColor} 18%, transparent)` }}>
                  {statusLabel}
                </span>
              </div>
              <ProgressBar pct={pct} color={meta.color} />
              <div className="flex items-baseline justify-between mt-2">
                <p className="font-numeral text-lg font-bold">
                  {formatINR(spent)} <span className="text-base-400 text-sm font-body font-normal">/ {formatINR(b.limit)}</span>
                </p>
                <p className="text-xs text-base-400">{pct}%</p>
              </div>
              {status === 'over' && <p className="text-xs mt-2" style={{ color: 'var(--color-over)' }}>−15 pts applied for going over</p>}
            </Card>
          )
        })}

        {adding ? (
          <Card>
            {creatingCategory ? (
              <NewCategoryForm
                onCancel={() => setCreatingCategory(false)}
                onCreate={(label, emoji, color) => {
                  const id = addCustomCategory(label, emoji, color)
                  setNewCategory(id)
                  setCreatingCategory(false)
                }}
              />
            ) : (
            <form onSubmit={submitNewBudget} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Category</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableCategories.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setNewCategory(c.id)}
                      className="px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 border transition-colors"
                      style={{
                        borderColor: newCategory === c.id ? c.color : 'var(--color-base-700)',
                        backgroundColor: newCategory === c.id ? `color-mix(in srgb, ${c.color} 20%, transparent)` : 'transparent',
                        color: newCategory === c.id ? c.color : 'var(--color-base-200)',
                      }}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreatingCategory(true)}
                    className="px-3 py-2 rounded-full text-sm font-semibold border border-dashed border-base-600 text-base-400"
                  >
                    ＋ New category
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Monthly limit</label>
                <div className="flex items-center gap-2 mt-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 focus-within:border-cat-groceries">
                  <span className="text-base-400 font-numeral text-lg">₹</span>
                  <input
                    inputMode="numeric"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-numeral text-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!newCategory || !newLimit}>
                  Add budget
                </Button>
              </div>
            </form>
            )}
          </Card>
        ) : (
          availableCategories.length > 0 && (
            <button
              onClick={() => setAdding(true)}
              className="w-full border-2 border-dashed border-base-700 rounded-[1.75rem] py-4 text-sm font-semibold text-base-400 active:scale-[0.98] transition-transform"
            >
              ＋ Add a budget category
            </button>
          )
        )}
      </section>
    </div>
  )
}
