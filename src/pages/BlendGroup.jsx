import { useMemo, useRef, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Card, Avatar, SectionTitle, EmptyState, ProgressBar, formatINR, formatDate } from '../components/ui'
import { Icon } from '../components/icons'
import { computePairNet, computeBalancesFor, computeOverallNet, paymentMethodMeta, visibleLedger } from '../lib/blendLedger'
import { computeBlendFunStats } from '../lib/blendStats'
import { computeBlendVibes } from '../lib/blendVibes'
import { goalProgress } from '../lib/goals'
import ShareButton from '../components/ShareButton'

const FEATURED_COUNT = 3

function memberById(members, id) {
  return members.find((m) => m.id === id)
}

// "You" is grammatically second-person plural ("You are"), everyone else
// is third-person singular ("Arjun is") — avoids "You is The Sponsor".
function subjectIs(memberId, name) {
  return memberId === 'me' ? 'You are' : `${name} is`
}

function summarizeSplitStyles(splitStyles) {
  const counts = {}
  for (const s of splitStyles) counts[s.tag] = (counts[s.tag] || 0) + 1
  return Object.entries(counts)
    .map(([tag, count]) => `${count} ${tag}${count > 1 ? 's' : ''}`)
    .join(', ')
}

// Deterministic "rotation" — which 2-3 of the (up to 9) available highlight
// cards are featured today, seeded by date + group so it varies day to day
// and group to group without needing any backend state.
function pickFeatured(cards, count, seed) {
  if (cards.length <= count) return cards
  const offset = seed % cards.length
  const picked = []
  for (let i = 0; i < count; i++) picked.push(cards[(offset + i) % cards.length])
  return picked
}

function hashString(s) {
  let h = 0
  for (const c of s) h += c.charCodeAt(0)
  return h
}

export default function BlendGroup() {
  const { groupId } = useParams()
  const { blendGroups, groupGoals, today } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)
  const groupGoal = groupGoals.find((g) => g.groupId === groupId)
  const [showAllHighlights, setShowAllHighlights] = useState(false)
  const cardRefsMap = useRef(new Map())

  // React Router reuses this component instance across param changes on
  // the same route (visiting a different group doesn't remount it), so
  // this local toggle would otherwise leak "expanded" from one group into
  // the next.
  useEffect(() => {
    setShowAllHighlights(false)
    cardRefsMap.current = new Map()
  }, [groupId])

  function getCardRef(id) {
    if (!cardRefsMap.current.has(id)) cardRefsMap.current.set(id, { current: null })
    return cardRefsMap.current.get(id)
  }

  const myLedger = useMemo(() => (group ? visibleLedger(group.ledger, 'me') : []), [group])
  const pairNet = useMemo(() => computePairNet(myLedger), [myLedger])
  const myBalances = useMemo(() => computeBalancesFor('me', pairNet), [pairNet])
  const myNet = useMemo(() => computeOverallNet('me', pairNet), [pairNet])
  const funStats = useMemo(() => (group ? computeBlendFunStats(myLedger, group.members) : null), [group, myLedger])
  const vibes = useMemo(() => (group ? computeBlendVibes(myLedger, group.members) : null), [group, myLedger])
  const recent = useMemo(() => [...myLedger].sort((a, b) => b.date - a.date).slice(0, 5), [myLedger])

  // One pool covering all of Blend's fun stats (Sponsor, Signature Order,
  // Fastest Settler, Duo, Split Style, Comeback, Group Vibe) plus the
  // older pays-first/pays-last streaks — same computations as before, just
  // no longer all shown at once.
  const highlightCards = useMemo(() => {
    if (!group || !vibes) return []
    const cards = []
    if (vibes.groupVibe) {
      cards.push({ id: 'vibe', emoji: vibes.groupVibe.emoji, title: 'Group Vibe', sub: vibes.groupVibe.label, color: vibes.groupVibe.color, shareable: true })
    }
    if (vibes.sponsor) {
      cards.push({
        id: 'sponsor',
        emoji: 'crown',
        title: `${subjectIs(vibes.sponsor.member, vibes.sponsor.name)} The Sponsor`,
        sub: `Fronted ${formatINR(vibes.sponsor.amount)} so far`,
        shareable: true,
      })
    }
    if (vibes.signatureOrder) {
      cards.push({ id: 'signature', emoji: vibes.signatureOrder.emoji, title: "Signature Order", sub: `Runs on ${vibes.signatureOrder.label}` })
    }
    if (vibes.fastestSettler) {
      cards.push({
        id: 'fastest',
        emoji: 'running',
        title: `${vibes.fastestSettler.name} — Fastest Settler`,
        sub: vibes.fastestSettler.avgDays === 0 ? 'Settles up the same day' : `Settles up in ~${vibes.fastestSettler.avgDays}d on average`,
      })
    }
    if (vibes.duo) {
      cards.push({ id: 'duo', emoji: 'users', title: `${vibes.duo.nameA} & ${vibes.duo.nameB}`, sub: `Duo of the Month — ${vibes.duo.count} expenses together` })
    }
    if (vibes.splitStyles?.length) {
      cards.push({ id: 'split', emoji: 'target', title: 'Split Styles', sub: summarizeSplitStyles(vibes.splitStyles) })
    }
    if (vibes.comeback) {
      cards.push({
        id: 'comeback',
        emoji: 'party',
        title: `${subjectIs(vibes.comeback.member, vibes.comeback.name)} back on track!`,
        sub: `The Comeback — "${vibes.comeback.description}"`,
      })
    }
    if (funStats?.paysFirstStreak) {
      cards.push({
        id: 'pays-first',
        emoji: 'zap',
        title: `${memberById(group.members, funStats.paysFirstStreak.member)?.name} pays first`,
        sub: `${funStats.paysFirstStreak.count} times running`,
      })
    }
    if (funStats?.paysLastStreak) {
      cards.push({
        id: 'pays-last',
        emoji: 'footprints',
        title: `${memberById(group.members, funStats.paysLastStreak.member)?.name} pays last`,
        sub: `${funStats.paysLastStreak.count} times running`,
      })
    }
    return cards
  }, [group, vibes, funStats])

  const seed = group ? today.getDate() + hashString(group.id) : 0
  const featuredHighlights = useMemo(() => pickFeatured(highlightCards, FEATURED_COUNT, seed), [highlightCards, seed])

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState icon="search" title="Group not found" sub="It may have been removed." />
      </div>
    )
  }

  const visibleHighlights = showAllHighlights ? highlightCards : featuredHighlights

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
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <div className="flex -space-x-2">
            {group.members.map((m) => (
              <Avatar key={m.id} name={m.name} color={m.avatarColor} size={32} />
            ))}
          </div>
          <Link
            to={`/blend/${group.id}/settings`}
            aria-label="Group settings"
            className="w-9 h-9 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-base-200 active:scale-95 transition-transform"
          >
            <Icon name="settings" size={17} />
          </Link>
        </div>
      </header>

      <section className="px-5 mt-4">
        <Link to={`/blend/${group.id}/goal`}>
          {groupGoal ? (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Icon name={groupGoal.emoji} size={16} />
                  {groupGoal.title}
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
            <div className="border-2 border-dashed border-base-700 rounded-[1.75rem] py-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-base-400 active:scale-[0.98] transition-transform">
              <Icon name="piggy" size={16} />
              Set a group savings goal
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
            <div className="bg-cat-groceries text-base-950 rounded-2xl py-3 flex items-center justify-center gap-1.5 text-sm font-bold active:scale-[0.97] transition-transform">
              <Icon name="plus" size={16} />
              Add expense
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
                  <Link
                    key={m.id}
                    to={`/blend/${group.id}/settle-up?with=${m.id}`}
                    className={`flex items-center gap-3 px-5 py-3.5 active:bg-base-700 transition-colors ${i !== arr.length - 1 ? 'border-b border-base-700' : ''}`}
                  >
                    <Avatar name={m.name} color={m.avatarColor} />
                    <p className="flex-1 text-sm font-medium">{m.name}</p>
                    <p
                      className="font-numeral text-sm font-bold"
                      style={{ color: amt > 0 ? 'var(--color-good)' : 'var(--color-over)' }}
                    >
                      {amt > 0 ? `Owes you ${formatINR(amt)}` : `You owe ${formatINR(-amt)}`}
                    </p>
                    <span className="text-base-400 text-xs">›</span>
                  </Link>
                )
              })}
          </Card>
        )}
        <p className="text-base-400 text-xs mt-2">
          You only see balances between you and each member — not the full group matrix.
        </p>
      </section>

      {highlightCards.length > 0 && (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base-200 font-semibold text-sm tracking-wide uppercase">Squad highlights</h2>
            {highlightCards.length > FEATURED_COUNT && (
              <button
                onClick={() => setShowAllHighlights((s) => !s)}
                className="text-xs font-semibold text-base-400 underline decoration-base-600"
              >
                {showAllHighlights ? 'Show less' : `View all (${highlightCards.length})`}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {visibleHighlights.map((card) =>
              card.id === 'vibe' ? (
                <div
                  key={card.id}
                  ref={getCardRef(card.id)}
                  className="rounded-[1.75rem] p-4 flex items-center gap-3 relative"
                  style={{ backgroundColor: `color-mix(in srgb, ${card.color} 16%, var(--color-base-800))`, border: `1px solid color-mix(in srgb, ${card.color} 35%, transparent)` }}
                >
                  <Icon name={card.emoji} size={26} color={card.color} />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-base-400">{card.title}</p>
                    <p className="font-display text-lg" style={{ color: card.color }}>
                      {card.sub}
                    </p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <ShareButton
                      targetRef={getCardRef(card.id)}
                      filename={`${group.name}-vibe.png`}
                      shareTitle={`${group.name} on BuzzTrk`}
                      shareText={`We're a ${card.sub}`}
                    />
                  </div>
                </div>
              ) : (
                <div key={card.id} ref={card.shareable ? getCardRef(card.id) : undefined} className="bg-base-800 rounded-[1.75rem] p-4 flex items-center gap-3 relative">
                  <Icon name={card.emoji} size={22} className="shrink-0" color="var(--color-cat-groceries)" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{card.title}</p>
                    <p className="text-base-400 text-xs mt-0.5">{card.sub}</p>
                  </div>
                  {card.shareable && (
                    <div className="absolute top-3 right-3">
                      <ShareButton
                        targetRef={getCardRef(card.id)}
                        filename={`${group.name}-${card.id}.png`}
                        shareTitle={`${group.name} on BuzzTrk`}
                        shareText={card.title}
                      />
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
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
              const hiddenFromNames = (entry.hiddenFrom || []).map((id) => memberById(group.members, id)?.name).filter(Boolean)
              return (
                <Card key={entry.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={payer?.name} color={payer?.avatarColor} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{entry.description}</p>
                      <p className="text-xs text-base-400 flex items-center gap-1 flex-wrap">
                        {payer?.name} paid · {formatDate(entry.date)} · split {Object.keys(entry.shares).length} ways ·
                        <Icon name={method.emoji} size={11} className="inline-block" />
                        {method.label}
                      </p>
                      {hiddenFromNames.length > 0 && (
                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-cat-emi)' }}>
                          <Icon name="eye-off" size={12} />
                          Hidden from {hiddenFromNames.join(', ')}
                        </p>
                      )}
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
                  <Icon name="check-circle" size={22} color="var(--color-good)" />
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
