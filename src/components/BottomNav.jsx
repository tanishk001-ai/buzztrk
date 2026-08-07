import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/budgets', label: 'Budgets', icon: '🎯' },
  { to: '/dues', label: 'Dues', icon: '🧾' },
  { to: '/blend', label: 'Blend', icon: '🤝' },
  { to: '/rewards', label: 'Rewards', icon: '🪙' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 px-3">
      <div className="flex items-center gap-1 bg-base-800/95 backdrop-blur border border-base-700 rounded-full px-2 py-2 shadow-2xl max-w-md w-full justify-between">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 min-w-[3.5rem] transition-colors ${
                isActive ? 'bg-base-700 text-base-50' : 'text-base-400'
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
