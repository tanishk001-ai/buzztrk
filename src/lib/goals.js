// Savings goal math — personal goals are a flat contribution ledger;
// group goals are the same ledger shape with a memberId on each entry, so
// progress can be shown both combined and per-contributor. Mirrors the
// same honest, manual-entry pattern used for cash expenses and Blend
// settlements elsewhere in the app — nothing here moves real money.

export function goalTotal(goal) {
  return goal.contributions.reduce((s, c) => s + c.amount, 0)
}

export function goalProgress(goal) {
  const total = goalTotal(goal)
  const pct = goal.target > 0 ? Math.min(100, Math.round((total / goal.target) * 100)) : 0
  return { total, pct, remaining: Math.max(0, goal.target - total), reached: total >= goal.target }
}

// Per-member breakdown for a group goal, sorted by contribution size.
export function goalBreakdownByMember(goal, members) {
  const totals = {}
  for (const c of goal.contributions) {
    totals[c.memberId] = (totals[c.memberId] || 0) + c.amount
  }
  return members
    .map((m) => ({ memberId: m.id, name: m.name, avatarColor: m.avatarColor, amount: totals[m.id] || 0 }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}
