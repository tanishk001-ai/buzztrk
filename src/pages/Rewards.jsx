import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, Button, ProgressBar, SectionTitle, Coin, formatINR, formatDate } from '../components/ui'
import { goalTotal, goalProgress } from '../lib/goals'

export default function Rewards() {
  const { streak, points, pointEvents, rewardsCatalog, redeemed, redeemReward, personalGoals } = useAppState()
  const [justRedeemed, setJustRedeemed] = useState(null)
  const primaryGoal = personalGoals[0]

  const handleRedeem = (reward) => {
    const ok = redeemReward(reward)
    if (ok) {
      setJustRedeemed(reward.id)
      setTimeout(() => setJustRedeemed(null), 1200)
    }
  }

  return (
    <div>
      <Header title="Streaks & Rewards" subtitle="Earned by tracking, not by spending" />

      <section className="px-5 mt-2">
        <Card className="flex items-center justify-between bg-base-800">
          <div>
            <p className="text-base-400 text-sm">Current streak</p>
            <p className="font-display text-4xl font-numeral mt-1">
              {streak.currentStreak}
              <span className="text-lg font-body font-semibold text-base-400"> days</span>
            </p>
            <p className="text-base-400 text-xs mt-1">Longest: {streak.longestStreak} days</p>
          </div>
          <div className="animate-float-slow">
            <Coin size={56} />
          </div>
        </Card>

        <div className="flex gap-1.5 mt-3">
          {streak.history.map((tracked, i) => (
            <div
              key={i}
              className="flex-1 h-8 rounded-lg"
              style={{ backgroundColor: tracked ? 'var(--color-good)' : 'var(--color-base-700)' }}
            />
          ))}
        </div>
        {!streak.todayTracked && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-warn)' }}>
            Log a cash expense or import a statement today to keep your streak going.
          </p>
        )}
      </section>

      <section className="px-5 mt-6">
        <Card className="flex items-center gap-3 bg-base-800">
          <Coin size={32} />
          <div className="flex-1">
            <p className="text-base-400 text-xs">Your balance</p>
            <p className="font-numeral text-2xl font-bold">{points} pts</p>
          </div>
        </Card>
      </section>

      <section className="px-5 mt-4">
        <Link to="/goals">
          <div className="bg-base-800 border border-base-700 rounded-2xl py-3 text-center text-sm font-semibold active:scale-[0.97] transition-transform">
            🐷 View savings goals
          </div>
        </Link>
      </section>

      {primaryGoal && goalTotal(primaryGoal) > 0 && (
        <section className="px-5 mt-4">
          <Link to={`/goals/${primaryGoal.id}`}>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                  {primaryGoal.emoji} {primaryGoal.title}
                </span>
                <span className="text-xs text-base-400">
                  {formatINR(goalProgress(primaryGoal).total)} / {formatINR(primaryGoal.target)}
                </span>
              </div>
              <ProgressBar pct={goalProgress(primaryGoal).pct} color="var(--color-income)" />
              <p className="text-base-400 text-xs mt-2">
                Symbolic — points redeemed toward this goal, not a real transfer. Tap to view your journey.
              </p>
            </Card>
          </Link>
        </section>
      )}

      <section className="px-5 mt-6">
        <SectionTitle>Redeem</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {rewardsCatalog.map((r) => {
            const owned = redeemed.includes(r.id)
            const canAfford = points >= r.cost
            return (
              <Card key={r.id} className={`text-center ${justRedeemed === r.id ? 'animate-coin-pop' : ''}`}>
                <p className="text-3xl mb-2">{r.emoji}</p>
                <p className="text-sm font-semibold leading-tight">{r.title}</p>
                <p className="text-base-400 text-xs mt-1 mb-3">{r.cost} pts</p>
                <Button
                  variant={owned ? 'ghost' : 'secondary'}
                  className="w-full !py-2 text-xs"
                  disabled={owned || !canAfford}
                  onClick={() => handleRedeem(r)}
                >
                  {owned ? 'Redeemed' : canAfford ? 'Redeem' : 'Not enough'}
                </Button>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="px-5 mt-6">
        <SectionTitle>Recent points</SectionTitle>
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
      </section>
    </div>
  )
}
