import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Coin } from './ui'
import { Icon } from './icons'

export default function Header({ title, subtitle, showBack = true }) {
  const { points, streak } = useAppState()
  return (
    <header className="flex items-start justify-between px-4 pt-6 pb-2 gap-2">
      <div className="flex items-start gap-2 min-w-0">
        {showBack && <BackButton className="mt-0.5" />}
        <div className="min-w-0">
          <h1 className="font-display text-xl text-base-50 truncate">{title}</h1>
          {subtitle && <p className="text-base-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          to="/recap"
          title="The Recap — your monthly summary"
          className="flex items-center gap-1 bg-base-800 border border-base-700 rounded-full pl-1.5 pr-2 py-1 text-xs font-semibold text-base-200 active:scale-95 transition-transform"
        >
          <Icon name="sparkles" size={13} />
          Recap
        </Link>
        <Link
          to="/rewards"
          className="flex items-center gap-1 bg-base-800 border border-base-700 rounded-full pl-1 pr-2 py-1"
        >
          <Coin size={18} />
          <span className="font-numeral text-sm font-bold">{points}</span>
        </Link>
        {/* Rightmost, beside the points balance — circled and a shade
            lighter than the other two chips so it reads as its own
            tappable affordance rather than decoration. */}
        <Link
          to="/profile"
          title="Profile"
          aria-label="Profile"
          className="w-8 h-8 rounded-full bg-base-700 border border-base-600 flex items-center justify-center text-base-50 active:scale-95 transition-transform shrink-0"
        >
          <Icon name="user" size={15} />
        </Link>
      </div>
    </header>
  )
}
