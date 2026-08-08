// Derives "pays first / pays last" from a group's actual expense ledger
// instead of hardcoded flavor text, so it recalculates as expenses are
// added. "Pays first" = current run of consecutive most-recent expenses
// fronted by the same member. "Pays last" = member with the longest run
// of recent expenses they were part of without being the one who fronted
// the money — playful ("still catching up"), not a shame metric.
export function computeBlendFunStats(ledger, members) {
  const expenses = ledger.filter((e) => e.type === 'expense')
  if (expenses.length === 0) return null
  const sorted = [...expenses].sort((a, b) => b.date - a.date)

  const topPayer = sorted[0].paidBy
  let payFirstCount = 0
  for (const e of sorted) {
    if (e.paidBy === topPayer) payFirstCount++
    else break
  }

  let bestLastMember = null
  let bestLastCount = -1
  for (const m of members) {
    if (m.id === topPayer && payFirstCount === sorted.length) continue
    let count = 0
    for (const e of sorted) {
      if (!Object.keys(e.shares).includes(m.id)) continue
      if (e.paidBy === m.id) break
      count++
    }
    if (count > bestLastCount) {
      bestLastCount = count
      bestLastMember = m.id
    }
  }

  return {
    paysFirstStreak: { member: topPayer, count: payFirstCount },
    paysLastStreak: bestLastMember && bestLastCount > 0 ? { member: bestLastMember, count: bestLastCount } : null,
  }
}
