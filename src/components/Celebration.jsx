import { useEffect, useMemo } from 'react'
import { Coin } from './ui'

const AUTO_DISMISS_MS = 2600
const PARTICLE_COUNT = 8

// Non-blocking celebration toast for real milestones (first settle-up,
// streak records, etc.) — reuses the same coin-pop visual language already
// built for Rewards rather than introducing a new animation style.
export default function Celebration({ celebration, onDismiss }) {
  useEffect(() => {
    if (!celebration) return
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [celebration, onDismiss])

  // Frozen per celebration.id so re-renders during its lifetime don't
  // reshuffle the burst mid-animation.
  const particles = useMemo(() => {
    if (!celebration) return []
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 180,
      y: -Math.random() * 70 - 10,
      size: 14 + Math.random() * 12,
      delay: i * 45,
      rotate: (Math.random() - 0.5) * 40,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration?.id])

  if (!celebration) return null

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex flex-col items-center">
      <div className="relative w-0 h-0">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute animate-coin-pop"
            style={{
              transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg)`,
              animationDelay: `${p.delay}ms`,
            }}
          >
            <Coin size={p.size} />
          </div>
        ))}
      </div>
      <div className="mt-2 bg-base-800 border border-base-700 rounded-full pl-3 pr-4 py-2.5 shadow-2xl flex items-center gap-2 animate-card-in">
        <span className="text-xl">{celebration.emoji}</span>
        <span className="text-sm font-semibold text-base-50">{celebration.message}</span>
      </div>
    </div>
  )
}
