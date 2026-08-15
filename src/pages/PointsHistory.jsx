import { useAppState } from '../state/AppState'
import { BackButton, Card, Coin, EmptyState, formatDate } from '../components/ui'

export default function PointsHistory() {
  const { pointEvents } = useAppState()

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback="/rewards" className="mt-0.5" />
        <h1 className="font-display text-2xl">Points history</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">Every point earned and spent, in order.</p>

      {pointEvents.length === 0 ? (
        <EmptyState emoji="🪙" title="Nothing yet" sub="Track expenses and stay on budget to start earning." />
      ) : (
        <Card className="p-0 overflow-hidden">
          {pointEvents.map((e, i) => (
            <div key={e.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== pointEvents.length - 1 ? 'border-b border-base-700' : ''}`}>
              <Coin size={22} />
              <div className="flex-1">
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-base-400">{formatDate(e.date)}</p>
              </div>
              <p
                className="font-numeral text-sm font-bold"
                style={{ color: e.points < 0 ? 'var(--color-over)' : 'var(--color-cat-groceries)' }}
              >
                {e.points > 0 ? '+' : ''}
                {e.points}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
