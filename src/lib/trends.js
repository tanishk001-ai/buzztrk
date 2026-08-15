// Combines seeded prior-month history with the live current-month spend
// (computed from real transactions, never from seed data) into one
// chronological series for the Trends view.
const NON_SPEND = new Set(['income'])

export function computeMonthlySeries(monthlyHistory, currentMonthSpendByCategory, today) {
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const entries = [...monthlyHistory, { month: currentMonth, byCategory: currentMonthSpendByCategory }].sort(
    (a, b) => a.month - b.month,
  )
  return entries.map((entry) => {
    const spendEntries = Object.entries(entry.byCategory).filter(([cat]) => !NON_SPEND.has(cat))
    return {
      label: entry.month.toLocaleDateString('en-IN', { month: 'short' }),
      month: entry.month,
      byCategory: Object.fromEntries(spendEntries),
      total: spendEntries.reduce((s, [, v]) => s + v, 0),
      isCurrent: entry.month.getTime() === currentMonth.getTime(),
    }
  })
}

// Top N categories by total spend across the whole series — keeps the
// per-category trend picker focused on what actually matters instead of
// listing every category that's ever had a single rupee in it.
export function topCategoriesAcross(series, count = 6) {
  const totals = {}
  for (const m of series) {
    for (const [cat, amt] of Object.entries(m.byCategory)) {
      totals[cat] = (totals[cat] || 0) + amt
    }
  }
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([cat]) => cat)
}
