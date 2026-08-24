import { useAppState } from '../state/AppState'
import { BackButton, Card, EmptyState, formatINR, formatDate } from '../components/ui'
import { IconBadge } from '../components/icons'
import { categoryMeta } from '../lib/categorize'

export default function TransactionHistory() {
  const { transactions } = useAppState()

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback="/" className="mt-0.5" />
        <h1 className="font-display text-2xl">Payment history</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">Every transaction, in order — auto-collected, cash, and statement uploads.</p>

      {transactions.length === 0 ? (
        <EmptyState icon="search" title="Nothing yet" sub="Log a cash expense or upload a statement to get started." />
      ) : (
        <Card className="p-0 overflow-hidden">
          {transactions.map((t, i) => {
            const meta = categoryMeta(t.category)
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${i !== transactions.length - 1 ? 'border-b border-base-700' : ''}`}
              >
                <IconBadge name={meta.emoji} color={meta.color} size={36} />
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
      )}
    </div>
  )
}
