import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import Header from '../components/Header'
import { Card, Avatar, EmptyState, formatINR } from '../components/ui'
import { computePairNet, computeOverallNet } from '../lib/blendLedger'

function GroupRow({ group }) {
  const net = useMemo(() => computeOverallNet('me', computePairNet(group.ledger)), [group.ledger])
  return (
    <Link to={`/blend/${group.id}`}>
      <Card className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{group.name}</p>
            <p className="text-base-400 text-xs mt-0.5">{group.members.length} members</p>
          </div>
          <div className="flex -space-x-2 shrink-0">
            {group.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} name={m.name} color={m.avatarColor} size={28} />
            ))}
          </div>
        </div>
        <p
          className="font-numeral text-lg font-bold"
          style={{ color: net === 0 ? 'var(--color-base-400)' : net > 0 ? 'var(--color-good)' : 'var(--color-over)' }}
        >
          {net === 0 ? 'All settled up' : net > 0 ? `You are owed ${formatINR(net)}` : `You owe ${formatINR(-net)}`}
        </p>
      </Card>
    </Link>
  )
}

export default function Blend() {
  const { blendGroups } = useAppState()

  return (
    <div>
      <Header title="Blend" subtitle="Group expenses, tracked — never settled inside the app" />

      <section className="px-5 mt-4">
        <Link to="/blend/new">
          <div className="bg-cat-groceries text-base-950 rounded-2xl py-3 text-center text-sm font-bold active:scale-[0.97] transition-transform mb-4">
            ＋ Create group
          </div>
        </Link>

        {blendGroups.length === 0 ? (
          <EmptyState emoji="🤝" title="No groups yet" sub="Create one to start splitting expenses with friends." />
        ) : (
          blendGroups.map((g) => <GroupRow key={g.id} group={g} />)
        )}
      </section>
    </div>
  )
}
