import { useMemo } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, Button, EmptyState, formatINR, formatDate } from '../components/ui'
import { IconBadge } from '../components/icons'

const KIND_META = {
  emi: { label: 'EMI', emoji: 'card', color: 'var(--color-cat-emi)' },
  bnpl: { label: 'BNPL', emoji: 'repeat', color: 'var(--color-warn)' },
  owed: { label: 'You owe', emoji: 'handshake', color: 'var(--color-cat-transfers)' },
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
          <EmptyState icon="check-circle" title="Nothing pending" sub="You're all caught up." />
        ) : (
          sorted.map((d) => {
            const meta = KIND_META[d.kind]
            const days = daysUntil(d.dueDate)
            const overdue = days < 0
            const dueToday = days === 0
            const urgent = days >= 1 && days <= 3
            const dateColor = overdue || dueToday || urgent ? 'var(--color-over)' : 'var(--color-base-400)'
            const timingLabel = overdue
              ? `Overdue by ${Math.abs(days)}d`
              : dueToday
                ? 'Due today'
                : `${days}d left`
            return (
              <Card key={d.id}>
                <div className="flex items-center gap-3">
                  <IconBadge name={meta.emoji} color={meta.color} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{d.title}</p>
                      {overdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: 'var(--color-over)', backgroundColor: 'color-mix(in srgb, var(--color-over) 20%, transparent)' }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: dateColor }}>
                      Due {formatDate(d.dueDate)} · {timingLabel}
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
