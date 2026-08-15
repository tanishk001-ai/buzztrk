import { useNavigate } from 'react-router-dom'

export function BackButton({ fallback = '/', className = '' }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      className={`w-9 h-9 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-base-50 shrink-0 active:scale-95 transition-transform ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function Card({ children, className = '', style, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-base-800 rounded-[1.75rem] p-5 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function Pill({ children, className = '', style }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

export function Button({ children, onClick, variant = 'primary', className = '', type = 'button', disabled, style }) {
  const base = 'rounded-full font-semibold px-5 py-3 transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100'
  const variants = {
    primary: 'bg-cat-groceries text-base-950',
    secondary: 'bg-base-700 text-base-50',
    ghost: 'bg-transparent text-base-200 border border-base-600',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Avatar({ name, color = 'var(--color-cat-transport)', size = 40 }) {
  const initial = name?.[0]?.toUpperCase() || '?'
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-base-950 shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  )
}

export function ProgressBar({ pct, color, trackClassName = 'bg-base-700' }) {
  const clamped = Math.min(pct, 100)
  const overshoot = pct > 100
  return (
    <div className={`h-2.5 w-full rounded-full overflow-hidden ${trackClassName}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          backgroundColor: overshoot ? 'var(--color-over)' : color,
        }}
      />
    </div>
  )
}

export function Coin({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="var(--color-coin)" />
      <circle cx="12" cy="12" r="10" stroke="#8a6b00" strokeOpacity="0.25" strokeWidth="1" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#5c4600">
        B
      </text>
    </svg>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base-200 font-semibold text-sm tracking-wide uppercase">{children}</h2>
      {action}
    </div>
  )
}

export function EmptyState({ emoji = '🌱', title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="text-4xl mb-3 animate-float-slow">{emoji}</div>
      <p className="font-semibold text-base-50">{title}</p>
      {sub && <p className="text-base-400 text-sm mt-1">{sub}</p>}
    </div>
  )
}

export function formatINR(n) {
  const sign = n < 0 ? '-' : ''
  return `${sign}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`
}

export function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
