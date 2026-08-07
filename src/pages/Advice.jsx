import { useState } from 'react'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, Button, EmptyState } from '../components/ui'
import { generateAdvice } from '../data/mockData'

const TONE_COLOR = {
  over: 'var(--color-over)',
  warn: 'var(--color-warn)',
  neutral: 'var(--color-cat-transfers)',
}

export default function Advice() {
  const { transactions, budgets } = useAppState()
  const [insights, setInsights] = useState(null)

  return (
    <div>
      <Header title="Advice" subtitle="Only when you ask — we never nag" />

      <section className="px-5 mt-4">
        {insights === null ? (
          <Card className="flex flex-col items-center text-center py-10">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold mb-1">See your patterns, clearly</p>
            <p className="text-base-400 text-sm mb-5 max-w-xs">
              Factual, non-judgmental. Just what's actually happening with your money this month.
            </p>
            <Button onClick={() => setInsights(generateAdvice({ transactions, budgets }))}>Show me</Button>
          </Card>
        ) : insights.length === 0 ? (
          <EmptyState emoji="✅" title="Nothing to flag" sub="Your spending looks steady this month." />
        ) : (
          <div className="space-y-3">
            {insights.map((i) => (
              <Card key={i.id} className="border-l-4" style={{ borderLeftColor: TONE_COLOR[i.tone] }}>
                <p className="text-sm">{i.text}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
