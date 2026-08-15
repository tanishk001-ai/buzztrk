import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, SectionTitle, formatINR, formatDate } from '../components/ui'
import { categoryMeta } from '../lib/categorize'

export default function Dashboard() {
  const { transactions, monthSpendByCategory, today } = useAppState()

  const totalSpend = useMemo(
    () => Object.values(monthSpendByCategory).reduce((s, v) => s + v, 0),
    [monthSpendByCategory],
  )

  const byCategory = useMemo(
    () =>
      Object.entries(monthSpendByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    [monthSpendByCategory],
  )

  const recent = transactions.slice(0, 8)

  return (
    <div>
      <Header
        title="BuzzTrk"
        subtitle={today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        showBack={false}
      />

      <section className="px-5 mt-2">
        <p className="text-base-400 text-sm">Spent this month</p>
        <p className="font-display text-5xl font-numeral text-base-50 mt-1">{formatINR(totalSpend)}</p>
        <div className="flex gap-2 mt-4">
          <Link to="/add-expense" className="flex-1">
            <div className="bg-base-800 border border-base-700 rounded-2xl py-3 text-center text-sm font-semibold active:scale-[0.97] transition-transform">
              ＋ Add cash expense
            </div>
          </Link>
          <Link to="/upload" className="flex-1">
            <div className="bg-cat-groceries text-base-950 rounded-2xl py-3 text-center text-sm font-bold active:scale-[0.97] transition-transform">
              ⇪ Upload statement
            </div>
          </Link>
        </div>
        <Link to="/personality">
          <div className="mt-2 bg-base-800 border border-base-700 rounded-2xl py-3 text-center text-sm font-semibold active:scale-[0.97] transition-transform">
            ✨ What's your spending personality?
          </div>
        </Link>
      </section>

      <section className="px-5 mt-8">
        <SectionTitle
          action={
            <div className="flex items-center gap-3">
              <Link to="/trends" className="text-xs font-semibold text-base-400 underline decoration-base-600">
                Trends
              </Link>
              <Link to="/advice" className="text-xs font-semibold text-base-400 underline decoration-base-600">
                Ask for advice
              </Link>
            </div>
          }
        >
          Where it went
        </SectionTitle>
        {byCategory.length === 0 ? (
          <Card>
            <p className="text-base-400 text-sm">No spend tracked yet this month.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {byCategory.map(({ category, amount }, i) => {
              const meta = categoryMeta(category)
              const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0
              return (
                <Link key={category} to={`/category/${category}`}>
                  <Card className="animate-card-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className="text-xs font-bold text-base-400">{pct}%</span>
                    </div>
                    <p className="font-numeral text-xl font-extrabold mt-2" style={{ color: meta.color }}>
                      {formatINR(amount)}
                    </p>
                    <p className="text-base-400 text-xs mt-0.5">{meta.label}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="px-5 mt-8">
        <SectionTitle>Recent activity</SectionTitle>
        <Card className="p-0 overflow-hidden">
          {recent.map((t, i) => {
            const meta = categoryMeta(t.category)
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${i !== recent.length - 1 ? 'border-b border-base-700' : ''}`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 25%, transparent)` }}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-base-400">
                    {formatDate(t.date)} · {t.source === 'auto' ? 'Auto-collected' : t.source === 'cash' ? 'Cash entry' : 'Statement'}
                  </p>
                </div>
                <p
                  className="font-numeral text-sm font-bold shrink-0"
                  style={{ color: t.type === 'credit' ? 'var(--color-income)' : 'var(--color-base-50)' }}
                >
                  {t.type === 'credit' ? '+' : '-'}
                  {formatINR(t.amount)}
                </p>
              </div>
            )
          })}
        </Card>
      </section>
    </div>
  )
}
