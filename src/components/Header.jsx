import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Coin } from './ui'

export default function Header({ title, subtitle, showBack = true }) {
  const { points, streak } = useAppState()
  return (
    <header className="flex items-start justify-between px-5 pt-6 pb-2 gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {showBack && <BackButton className="mt-0.5" />}
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-base-50">{title}</h1>
          {subtitle && <p className="text-base-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/profile" className="text-lg" title="Profile">
          👤
        </Link>
        <Link to="/wrapped" className="text-lg" title="Wrapped recap">
          ✨
        </Link>
        <Link
          to="/rewards"
          className="flex items-center gap-1.5 bg-base-800 border border-base-700 rounded-full pl-1.5 pr-3 py-1"
        >
          <Coin size={20} />
          <span className="font-numeral text-sm font-bold">{points}</span>
        </Link>
      </div>
    </header>
  )
}
