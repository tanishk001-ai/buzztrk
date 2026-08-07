import { useMemo } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, ProgressBar, formatINR } from '../components/ui'
import { categoryMeta } from '../lib/categorize'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function Budgets() {
  const { transactions, budgets, today } = useAppState()

  const spendByCategory = useMemo(() => {
    const start = startOfMonth(today)
    const map = {}
    for (const t of transactions) {
      if (t.type !== 'debit' || t.date < start || t.date > today) continue
      map[t.category] = (map[t.category] || 0) + t.amount
    }
    return map
  }, [transactions, today])

  return (
    <div>
      <Header title="Budgets" subtitle="Set a limit per category, no shame if you slip" />

      <section className="px-5 mt-4 space-y-3">
        {budgets.map((b) => {
          const meta = categoryMeta(b.category)
          const spent = spendByCategory[b.category] || 0
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
            </Card>
          )
        })}
      </section>
    </div>
  )
}
