import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Card, EmptyState, SectionTitle, formatINR, formatDate } from '../components/ui'
import { BarChart } from '../components/charts'
import { Icon, IconBadge } from '../components/icons'
import { categoryMeta } from '../lib/categorize'

function weekOfMonth(date) {
  return Math.ceil(date.getDate() / 7)
}

export default function CategoryDetail() {
  const { categoryId } = useParams()
  const { transactions, today } = useAppState()
  const meta = categoryMeta(categoryId)

  const start = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])

  const items = useMemo(
    () =>
      transactions
        .filter((t) => t.category === categoryId && t.type === 'debit' && t.date >= start && t.date <= today)
        .sort((a, b) => b.date - a.date),
    [transactions, categoryId, start, today],
  )

  const total = items.reduce((s, t) => s + t.amount, 0)

  const byWeek = useMemo(() => {
    const map = {}
    for (const t of items) {
      const w = weekOfMonth(t.date)
      map[w] = (map[w] || 0) + t.amount
    }
    return Object.entries(map)
      .sort((a, b) => a[0] - b[0])
      .map(([w, v]) => ({ label: `Wk ${w}`, value: v, color: meta.color }))
  }, [items, meta.color])

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback="/" className="mt-0.5" />
        <h1 className="font-display text-2xl flex items-center gap-2">
          <Icon name={meta.emoji} size={22} color={meta.color} />
          {meta.label}
        </h1>
      </div>
      <p className="text-base-400 text-sm mb-6">
        {today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {items.length} payment{items.length === 1 ? '' : 's'}
      </p>

      <Card className="mb-6">
        <p className="text-base-400 text-sm">Total spent</p>
        <p className="font-display text-4xl font-numeral mt-1" style={{ color: meta.color }}>
          {formatINR(total)}
        </p>
      </Card>

      {byWeek.length > 1 && (
        <section className="mb-6">
          <SectionTitle>By week</SectionTitle>
          <Card>
            <BarChart data={byWeek} formatValue={(v) => formatINR(v)} />
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>All payments</SectionTitle>
        {items.length === 0 ? (
          <EmptyState icon="search" title="Nothing here" sub="No payments in this category yet this month." />
        ) : (
          <Card className="p-0 overflow-hidden">
            {items.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${i !== items.length - 1 ? 'border-b border-base-700' : ''}`}
              >
                <IconBadge name={meta.emoji} color={meta.color} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-base-400">
                    {formatDate(t.date)} · {t.source === 'auto' ? 'Auto-collected' : t.source === 'cash' ? 'Cash entry' : 'Statement'}
                  </p>
                </div>
                <p className="font-numeral text-sm font-bold">{formatINR(t.amount)}</p>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}
