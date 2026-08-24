import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, SectionTitle, formatINR } from '../components/ui'
import { BarChart, PieChart } from '../components/charts'
import { Icon } from '../components/icons'
import { computeMonthlySeries, topCategoriesAcross } from '../lib/trends'
import { categoryMeta } from '../lib/categorize'

export default function Trends() {
  const { monthlyHistory, monthSpendByCategory, today } = useAppState()

  const series = useMemo(
    () => computeMonthlySeries(monthlyHistory, monthSpendByCategory, today),
    [monthlyHistory, monthSpendByCategory, today],
  )

  const totalByMonth = useMemo(
    () => series.map((m) => ({ label: m.label, value: m.total, color: m.isCurrent ? 'var(--color-cat-groceries)' : 'var(--color-base-600)' })),
    [series],
  )

  const latest = series[series.length - 1]
  const latestPie = useMemo(
    () =>
      Object.entries(latest?.byCategory || {})
        .sort((a, b) => b[1] - a[1])
        .map(([cat, value]) => ({ label: categoryMeta(cat).label, value, color: categoryMeta(cat).color })),
    [latest],
  )

  const topCategories = useMemo(() => topCategoriesAcross(series), [series])
  const [selectedCategory, setSelectedCategory] = useState(topCategories[0])
  const activeCategory = topCategories.includes(selectedCategory) ? selectedCategory : topCategories[0]

  const categorySeries = useMemo(
    () =>
      series.map((m) => ({
        label: m.label,
        value: m.byCategory[activeCategory] || 0,
        color: categoryMeta(activeCategory).color,
      })),
    [series, activeCategory],
  )

  return (
    <div>
      <Header title="Trends" subtitle="Spending patterns across the last few months" />

      <section className="px-5 mt-4">
        <SectionTitle>Total spend by month</SectionTitle>
        <Card>
          <BarChart data={totalByMonth} formatValue={(v) => formatINR(v)} />
        </Card>
      </section>

      {latest && latestPie.length > 0 && (
        <section className="px-5 mt-6">
          <SectionTitle>{latest.isCurrent ? 'This month' : latest.label} breakdown</SectionTitle>
          <Card>
            <PieChart data={latestPie} />
          </Card>
        </section>
      )}

      {topCategories.length > 0 && (
        <section className="px-5 mt-6 mb-4">
          <SectionTitle>By category over time</SectionTitle>
          <div className="flex flex-wrap gap-2 mb-3">
            {topCategories.map((cat) => {
              const meta = categoryMeta(cat)
              const selected = activeCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border transition-colors"
                  style={{
                    borderColor: selected ? meta.color : 'var(--color-base-700)',
                    backgroundColor: selected ? `color-mix(in srgb, ${meta.color} 20%, transparent)` : 'transparent',
                    color: selected ? meta.color : 'var(--color-base-200)',
                  }}
                >
                  <Icon name={meta.emoji} size={15} />
                  {meta.label}
                </button>
              )
            })}
          </div>
          <Card>
            <BarChart data={categorySeries} formatValue={(v) => formatINR(v)} />
          </Card>
        </section>
      )}
    </div>
  )
}
