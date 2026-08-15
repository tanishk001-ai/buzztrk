import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { categoryMeta } from '../lib/categorize'
import { computeMonthlyRecap } from '../lib/monthlyRecap'
import ShareButton from '../components/ShareButton'

const GRADIENTS = [
  'linear-gradient(155deg, var(--color-wrap-1), var(--color-wrap-2))',
  'linear-gradient(155deg, var(--color-wrap-2), var(--color-wrap-3))',
  'linear-gradient(155deg, var(--color-wrap-3), var(--color-wrap-4))',
]

export default function Recap() {
  const navigate = useNavigate()
  const { monthSpendByCategory, budgets, today } = useAppState()
  const { month, cards } = useMemo(
    () => computeMonthlyRecap({ monthSpendByCategory, budgets, today }),
    [monthSpendByCategory, budgets, today],
  )
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)
  const cardRef = useRef(null)

  const go = (dir) => {
    const next = index + dir
    if (next < 0) return
    if (next >= cards.length) {
      navigate('/')
      return
    }
    setIndex(next)
  }

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const card = cards[index]
  const gradient = card.category ? null : GRADIENTS[index % GRADIENTS.length]
  const bg = card.category
    ? `linear-gradient(155deg, ${categoryMeta(card.category).color}, var(--color-wrap-2))`
    : gradient

  return (
    <div
      ref={cardRef}
      className="fixed inset-0 z-40 flex flex-col text-base-950"
      style={{ background: bg }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex gap-1.5 px-4 pt-4">
        {cards.map((c, i) => (
          <div key={c.id} className="flex-1 h-1 rounded-full bg-black/20 overflow-hidden">
            <div className="h-full bg-black/70" style={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <div className="absolute top-6 left-4 z-10">
        <ShareButton
          targetRef={cardRef}
          filename={`buzztrk-recap-${month}-${index + 1}.png`}
          shareTitle={`My BuzzTrk ${month} Recap`}
          shareText={card.headline.replace(/\n/g, ' ')}
          className="!bg-black/20 !border-black/20 !text-base-950"
        />
      </div>

      <button onClick={() => navigate('/')} className="absolute top-6 right-4 text-black/70 font-bold text-lg z-10">
        ✕
      </button>

      <div className="flex-1 flex" onClick={(e) => { const w = e.currentTarget.clientWidth; go(e.clientX < w / 2 ? -1 : 1) }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          {card.kind === 'top-category' && <div className="text-5xl mb-4">{categoryMeta(card.category).emoji}</div>}
          <p className="font-display whitespace-pre-line leading-[0.95] text-4xl">{card.headline}</p>
          <p className="mt-4 text-black/80 font-medium max-w-xs">{card.sub}</p>
        </div>
      </div>

      <div className="px-8 pb-10 text-center">
        <p className="text-black/60 text-xs font-semibold uppercase tracking-widest">Your {month} Recap · tap or swipe</p>
      </div>
    </div>
  )
}
