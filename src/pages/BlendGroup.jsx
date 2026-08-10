import { useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Card, Avatar, SectionTitle, EmptyState, ProgressBar, formatINR, formatDate } from '../components/ui'
import { computePairNet, computeBalancesFor, computeOverallNet, paymentMethodMeta } from '../lib/blendLedger'
import { computeBlendFunStats } from '../lib/blendStats'
import { computeBlendVibes } from '../lib/blendVibes'
import { goalProgress } from '../lib/goals'
import ShareButton from '../components/ShareButton'

function memberById(members, id) {
  return members.find((m) => m.id === id)
}

// "You" is grammatically second-person plural ("You are"), everyone else
// is third-person singular ("Arjun is") — avoids "You is The Sponsor".
function subjectIs(memberId, name) {
  return memberId === 'me' ? 'You are' : `${name} is`
}

export default function BlendGroup() {
  const { groupId } = useParams()
  const { blendGroups, groupGoals } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)
  const groupGoal = groupGoals.find((g) => g.groupId === groupId)
  const vibeCardRef = useRef(null)
  const sponsorCardRef = useRef(null)

  const pairNet = useMemo(() => (group ? computePairNet(group.ledger) : []), [group])
  const myBalances = useMemo(() => computeBalancesFor('me', pairNet), [pairNet])
  const myNet = useMemo(() => computeOverallNet('me', pairNet), [pairNet])
  const otherPairs = useMemo(() => pairNet.filter(({ a, b }) => a !== 'me' && b !== 'me'), [pairNet])
  const funStats = useMemo(() => (group ? computeBlendFunStats(group.ledger, group.members) : null), [group])
  const vibes = useMemo(() => (group ? computeBlendVibes(group.ledger, group.members) : null), [group])
  const recent = useMemo(() => (group ? [...group.ledger].sort((a, b) => b.date - a.date).slice(0, 5) : []), [group])

  const badges = useMemo(() => {
    if (!group) return []
    const list = []
    if (funStats?.paysFirstStreak) {
      list.push({
        emoji: '⚡',
        title: `${memberById(group.members, funStats.paysFirstStreak.member)?.name} pays first`,
        sub: `${funStats.paysFirstStreak.count} times running`,
      })
    }
    if (funStats?.paysLastStreak) {
      list.push({
        emoji: '🐢',
        title: `${memberById(group.members, funStats.paysLastStreak.member)?.name} pays last`,
        sub: `${funStats.paysLastStreak.count} times running`,
      })
    }
    if (vibes?.fastestSettler) {
      list.push({
        emoji: '🏃',
        title: `${vibes.fastestSettler.name} — Fastest Settler`,
        sub: vibes.fastestSettler.avgDays === 0 ? 'Settles up the same day' : `Settles up in ~${vibes.fastestSettler.avgDays}d on average`,
      })
    }
    if (vibes?.duo) {
      list.push({
        emoji: '👯',
        title: `${vibes.duo.nameA} & ${vibes.duo.nameB}`,
        sub: `Duo of the Month — together in ${vibes.duo.count} expenses`,
      })
    }
    if (vibes?.comeback) {
      list.push({
        emoji: '🎉',
        title: `${subjectIs(vibes.comeback.member, vibes.comeback.name)} back on track!`,
        sub: `Settled up on "${vibes.comeback.description}" — The Comeback`,
      })
    }
    return list
  }, [group, funStats, vibes])

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState emoji="🤷" title="Group not found" sub="It may have been removed." />
      </div>
    )
  }

  return (
    <div>
      <header className="flex items-start justify-between px-5 pt-6 pb-2 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <BackButton fallback="/blend" className="mt-0.5" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl truncate">{group.name}</h1>
            <p className="text-base-400 text-sm mt-0.5">{group.members.length} members</p>
          </div>
        </div>
        <div className="flex -space-x-2 shrink-0 mt-1">
          {group.members.map((m) => (
            <Avatar key={m.id} name={m.name} color={m.avatarColor} size={32} />
          ))}
        </div>
      </header>

      {vibes?.groupVibe && (
        <section className="px-5 mt-3">
          <div
            ref={vibeCardRef}
            className="rounded-[1.75rem] p-4 flex items-center gap-3 relative"
            style={{ backgroundColor: `color-mix(in srgb, ${vibes.groupVibe.color} 16%, var(--color-base-800))`, border: `1px solid color-mix(in srgb, ${vibes.groupVibe.color} 35%, transparent)` }}
          >
            <span className="text-3xl">{vibes.groupVibe.emoji}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-base-400">Group Vibe</p>
              <p className="font-display text-lg" style={{ color: vibes.groupVibe.color }}>
                {vibes.groupVibe.label}
              </p>
            </div>
            <div className="absolute top-3 right-3">
              <ShareButton
                targetRef={vibeCardRef}
                filename={`${group.name}-vibe.png`}
                shareTitle={`${group.name} on BuzzTrk`}
                shareText={`We're a ${vibes.groupVibe.label} ${vibes.groupVibe.emoji}`}
              />
            </div>
          </div>
        </section>
      )}

      {vibes?.sponsor && (
        <section className="px-5 mt-3">
          <div ref={sponsorCardRef} className="bg-base-800 rounded-[1.75rem] p-5 flex items-center gap-3 relative">
            <span className="text-3xl">👑</span>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-base-400">The Sponsor</p>
              <p className="font-semibold text-sm">{subjectIs(vibes.sponsor.member, vibes.sponsor.name)} The Sponsor</p>
              <p className="text-base-400 text-xs mt-0.5">Fronted {formatINR(vibes.sponsor.amount)} for the group so far</p>
            </div>
            <div className="absolute top-3 right-3">
              <ShareButton
                targetRef={sponsorCardRef}
                filename={`${group.name}-sponsor.png`}
                shareTitle={`${group.name} on BuzzTrk`}
                shareText={`${vibes.sponsor.name} is The Sponsor of ${group.name} 👑`}
              />
            </div>
          </div>
        </section>
      )}

      <section className="px-5 mt-4">
        <Link to={`/blend/${group.id}/goal`}>
          {groupGoal ? (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                  {groupGoal.emoji} {groupGoal.title}
                </span>
                <span className="text-xs text-base-400">{goalProgress(groupGoal).pct}%</span>
              </div>
              <ProgressBar pct={goalProgress(groupGoal).pct} color="var(--color-income)" />
              <p className="font-numeral text-sm font-bold mt-2" style={{ color: 'var(--color-income)' }}>
                {formatINR(goalProgress(groupGoal).total)}{' '}
                <span className="text-base-400 text-xs font-body font-normal">/ {formatINR(groupGoal.target)}</span>
              </p>
            </Card>
          ) : (
            <div className="border-2 border-dashed border-base-700 rounded-[1.75rem] py-3 text-center text-sm font-semibold text-base-400 active:scale-[0.98] transition-transform">
              🐷 Set a group savings goal
            </div>
          )}
        </Link>
      </section>

      <section className="px-5 mt-4">
        <p className="text-base-400 text-sm">{myNet === 0 ? 'Your balance' : myNet > 0 ? 'You are owed' : 'You owe overall'}</p>
        <p
          className="font-display text-4xl font-numeral mt-1"
          style={{ color: myNet === 0 ? 'var(--color-base-50)' : myNet > 0 ? 'var(--color-good)' : 'var(--color-over)' }}
        >
          {myNet === 0 ? 'All settled up' : formatINR(Math.abs(myNet))}
        </p>
        <p className="text-base-400 text-xs mt-1">
          Settle up outside the app, then record it here — BuzzTrk never moves money.
        </p>

        <div className="flex gap-2 mt-4">
          <Link to={`/blend/${group.id}/add-expense`} className="flex-1">
            <div className="bg-cat-groceries text-base-950 rounded-2xl py-3 text-center text-sm font-bold active:scale-[0.97] transition-transform">
              ＋ Add expense
            </div>
          </Link>
          <Link to={`/blend/${group.id}/settle-up`} className="flex-1">
            <div className="bg-base-800 border border-base-700 rounded-2xl py-3 text-center text-sm font-semibold active:scale-[0.97] transition-transform">
              Settle up
            </div>
          </Link>
        </div>
      </section>

      <section className="px-5 mt-6">
        <SectionTitle>Who owes what</SectionTitle>
        {Object.keys(myBalances).length === 0 ? (
          <Card>
            <p className="text-base-400 text-sm">No balances yet — add your first expense.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {group.members
              .filter((m) => m.id !== 'me' && m.id in myBalances)
              .map((m, i, arr) => {
                const amt = myBalances[m.id]
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}>
                    <Avatar name={m.name} color={m.avatarColor} />
                    <p className="flex-1 text-sm font-medium">{m.name}</p>
                    <p
                      className="font-numeral text-sm font-bold"
                      style={{ color: amt > 0 ? 'var(--color-good)' : 'var(--color-over)' }}
                    >
                      {amt > 0 ? `Owes you ${formatINR(amt)}` : `You owe ${formatINR(-amt)}`}
                    </p>
                  </div>
                )
              })}
          </Card>
        )}
      </section>

      {otherPairs.length > 0 && (
        <section className="px-5 mt-6">
          <SectionTitle>Other balances in the group</SectionTitle>
          <Card className="p-0 overflow-hidden">
            {otherPairs.map(({ a, b, amount }, i) => {
              const debtor = memberById(group.members, amount > 0 ? a : b)
              const creditor = memberById(group.members, amount > 0 ? b : a)
              return (
                <div key={`${a}-${b}`} className={`flex items-center justify-between px-5 py-3 ${i !== otherPairs.length - 1 ? 'border-b border-base-700' : ''}`}>
                  <p className="text-sm text-base-200">
                    {debtor?.name} owes {creditor?.name}
                  </p>
                  <p className="font-numeral text-sm font-bold">{formatINR(Math.abs(amount))}</p>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {badges.length > 0 && (
        <section className="px-5 mt-6">
          <SectionTitle>Squad stats</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b, i) => (
              <Card key={i} className="text-center py-5">
                <p className="text-2xl mb-1">{b.emoji}</p>
                <p className="font-bold text-sm">{b.title}</p>
                <p className="text-base-400 text-xs mt-0.5">{b.sub}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {vibes?.signatureOrder && (
        <section className="px-5 mt-6">
          <SectionTitle>Group's Signature Order</SectionTitle>
          <Card className="flex items-center gap-3">
            <span className="text-3xl">{vibes.signatureOrder.emoji}</span>
            <p className="text-sm font-semibold">
              This group runs on <span className="font-bold">{vibes.signatureOrder.label}</span>
            </p>
          </Card>
        </section>
      )}

      {vibes?.splitStyles?.length > 0 && (
        <section className="px-5 mt-6">
          <SectionTitle>Split style</SectionTitle>
          <Card className="p-0 overflow-hidden">
            {vibes.splitStyles.map((s, i, arr) => {
              const member = memberById(group.members, s.member)
              return (
                <div key={s.member} className={`flex items-center gap-3 px-5 py-3.5 ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}>
                  <Avatar name={member?.name} color={member?.avatarColor} size={32} />
                  <p className="flex-1 text-sm font-medium">{s.name}</p>
                  <p className="text-sm font-semibold">
                    {s.emoji} {s.tag}
                  </p>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      <section className="px-5 mt-6 mb-4">
        <SectionTitle
          action={
            <Link to={`/blend/${group.id}/history`} className="text-xs font-semibold text-base-400 underline decoration-base-600">
              Full history
            </Link>
          }
        >
          Recent activity
        </SectionTitle>
        <div className="space-y-3">
          {recent.map((entry) => {
            if (entry.type === 'expense') {
              const payer = memberById(group.members, entry.paidBy)
              const method = paymentMethodMeta(entry.paymentMethod)
              return (
                <Card key={entry.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={payer?.name} color={payer?.avatarColor} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{entry.description}</p>
                      <p className="text-xs text-base-400">
                        {payer?.name} paid · {formatDate(entry.date)} · split {Object.keys(entry.shares).length} ways · {method.emoji} {method.label}
                      </p>
                    </div>
                    <p className="font-numeral font-bold text-sm">{formatINR(entry.amount)}</p>
                  </div>
                </Card>
              )
            }
            const from = memberById(group.members, entry.from)
            const to = memberById(group.members, entry.to)
            return (
              <Card key={entry.id} className="bg-base-900">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {from?.name} settled up with {to?.name}
                    </p>
                    <p className="text-xs text-base-400">{formatDate(entry.date)}{entry.note ? ` · ${entry.note}` : ''}</p>
                  </div>
                  <p className="font-numeral font-bold text-sm text-cat-groceries">{formatINR(entry.amount)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
