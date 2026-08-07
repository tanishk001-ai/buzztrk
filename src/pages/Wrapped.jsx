import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WRAPPED_2025 } from '../data/mockData'
import { categoryMeta } from '../lib/categorize'

const GRADIENTS = [
  'linear-gradient(155deg, var(--color-wrap-1), var(--color-wrap-2))',
  'linear-gradient(155deg, var(--color-wrap-2), var(--color-wrap-3))',
  'linear-gradient(155deg, var(--color-wrap-3), var(--color-wrap-4))',
  'linear-gradient(155deg, var(--color-wrap-4), var(--color-wrap-1))',
]

export default function Wrapped() {
  const navigate = useNavigate()
  const { cards } = WRAPPED_2025
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)

  const go = (dir) => {
    setIndex((i) => {
      const next = i + dir
      if (next < 0) return 0
      if (next >= cards.length) {
        navigate('/')
        return i
      }
      return next
    })
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
        <p className="text-black/60 text-xs font-semibold uppercase tracking-widest">Your {WRAPPED_2025.year} Wrapped · tap or swipe</p>
      </div>
    </div>
  )
}
