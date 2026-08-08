// Real streak arithmetic over a set of tracked-day date keys, rather than a
// hardcoded "currentStreak: 12". A day counts as tracked when the user logs
// a cash expense or imports a statement. If a day is skipped, the streak
// genuinely breaks — this file has no knowledge of the UI, only dates.

export function dateKey(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()
}

// Seeds a tracked-day set from the mock {history:[0/1,...]} array ending
// "today", giving the demo a plausible-looking past while every day from
// here on is driven by real activity through logActivity().
export function seedTrackedDatesFromHistory(history, today) {
  const set = new Set()
  history.forEach((tracked, idx) => {
    if (!tracked) return
    const daysAgo = history.length - 1 - idx
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    set.add(dateKey(d))
  })
  return set
}

// Current streak counts backward from today through consecutive tracked
// days, breaking at the first gap. If today itself isn't tracked yet, this
// gives a grace period — like Duolingo, the streak from yesterday still
// stands until the day actually ends without activity, rather than
// zeroing out the instant the clock rolls over with nothing logged yet.
export function computeStreak(trackedDates, today, windowDays = 13) {
  const history = []
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    history.push(trackedDates.has(dateKey(d)) ? 1 : 0)
  }
  const todayTracked = history[history.length - 1] === 1
  const startIdx = todayTracked ? history.length - 1 : history.length - 2
  let currentStreak = 0
  for (let i = startIdx; i >= 0; i--) {
    if (history[i] === 1) currentStreak++
    else break
  }
  return { history, currentStreak, todayTracked }
}
