import { useMemo } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, Button, EmptyState, formatINR, formatDate } from '../components/ui'

const KIND_META = {
  emi: { label: 'EMI', emoji: '💳', color: 'var(--color-cat-emi)' },
  bnpl: { label: 'BNPL', emoji: '🔁', color: 'var(--color-warn)' },
  owed: { label: 'You owe', emoji: '🤝', color: 'var(--color-cat-transfers)' },
}

export default function Dues() {
  const { dues, markDuePaid, today } = useAppState()

  const sorted = useMemo(() => [...dues].sort((a, b) => a.dueDate - b.dueDate), [dues])
  const total = useMemo(() => dues.reduce((s, d) => s + d.amount, 0), [dues])

  const daysUntil = (d) => Math.ceil((d - today) / (1000 * 60 * 60 * 24))

  return (
    <div>
      <Header title="Dues & EMIs" subtitle="Everything upcoming, in one place" />

      <section className="px-5 mt-2">
        <p className="text-base-400 text-sm">Total upcoming</p>
        <p className="font-display text-4xl font-numeral mt-1">{formatINR(total)}</p>
      </section>

      <section className="px-5 mt-6 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState emoji="🎉" title="Nothing pending" sub="You're all caught up." />
        ) : (
          sorted.map((d) => {
            const meta = KIND_META[d.kind]
            const days = daysUntil(d.dueDate)
            const urgent = days <= 3
            return (
              <Card key={d.id}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 22%, transparent)` }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{d.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: urgent ? 'var(--color-over)' : 'var(--color-base-400)' }}>
                      Due {formatDate(d.dueDate)} · {days <= 0 ? 'today' : `${days}d left`}
                    </p>
                  </div>
                  <p className="font-numeral font-bold text-base shrink-0">{formatINR(d.amount)}</p>
                </div>
                <Button variant="ghost" className="w-full mt-3 !py-2 text-sm" onClick={() => markDuePaid(d.id)}>
                  Mark as paid
                </Button>
              </Card>
            )
          })
        )}
      </section>
    </div>
  )
}
