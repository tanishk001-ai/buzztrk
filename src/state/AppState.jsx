import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  AUTO_TRANSACTIONS,
  CASH_TRANSACTIONS,
  BUDGETS,
  DUES,
  BLEND_GROUPS,
  PERSONAL_GOALS,
  GROUP_GOALS,
  STREAK,
  POINT_EVENTS,
  REWARDS_CATALOG,
  TODAY,
} from '../data/mockData'
import { categoryMeta } from '../lib/categorize'
import { MAX_GROUP_MEMBERS, avatarColorForIndex } from '../lib/blendLedger'
import { seedTrackedDatesFromHistory, computeStreak, dateKey } from '../lib/streak'

const AppStateContext = createContext(null)

let _cashId = 1
let _uploadId = 1
let _blendEntryId = 1
let _blendGroupId = 1
let _blendMemberId = 1
let _goalId = 1
let _contribId = 1

const OVER_BUDGET_PENALTY = 15

function normalizeAuto() {
  return AUTO_TRANSACTIONS.map((t, i) => ({
    id: `auto-${i}`,
    source: 'auto',
    date: t.date,
    description: t.description,
    amount: t.amount,
    category: t.category,
    type: t.type,
  }))
}

function normalizeCash() {
  return CASH_TRANSACTIONS.map((t, i) => ({
    id: `cash-${i}`,
    source: 'cash',
    date: t.date,
    description: t.description,
    amount: t.amount,
    category: t.category,
    type: 'debit',
  }))
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function AppStateProvider({ children }) {
  const [autoTxns] = useState(normalizeAuto)
  const [cashTxns, setCashTxns] = useState(normalizeCash)
  const [uploadedTxns, setUploadedTxns] = useState([])
  const [budgets, setBudgets] = useState(BUDGETS)
  const [dues, setDues] = useState(DUES)
  const [blendGroups, setBlendGroups] = useState(BLEND_GROUPS)
  const [points, setPoints] = useState(STREAK.points)
  const [pointEvents, setPointEvents] = useState(POINT_EVENTS)
  const [redeemed, setRedeemed] = useState([])
  const [personalGoals, setPersonalGoals] = useState(PERSONAL_GOALS)
  const [groupGoals, setGroupGoals] = useState(GROUP_GOALS)
  const [trackedDates, setTrackedDates] = useState(() => seedTrackedDatesFromHistory(STREAK.history, TODAY))
  const [longestStreak, setLongestStreak] = useState(STREAK.longestStreak)
  const [celebration, setCelebration] = useState(null)

  const penalizedCategoriesRef = useRef(new Set())
  const firstSettleUpRef = useRef(false)
  const fullMonthShownRef = useRef(false)
  const allBudgetsOnTrackRef = useRef(false)

  const triggerCelebration = useCallback((type, message, emoji) => {
    setCelebration({ id: `${type}-${Date.now()}`, type, message, emoji })
  }, [])

  const clearCelebration = useCallback(() => setCelebration(null), [])

  const logActivity = useCallback(() => {
    setTrackedDates((prev) => {
      const key = dateKey(TODAY)
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const addCashExpense = useCallback(
    (expense) => {
      const id = `cash-new-${_cashId++}`
      setCashTxns((prev) => [
        { id, source: 'cash', date: expense.date, description: expense.description, amount: expense.amount, category: expense.category, type: 'debit' },
        ...prev,
      ])
      logActivity()
    },
    [logActivity],
  )

  const addUploadedTransactions = useCallback(
    (txns) => {
      const withIds = txns.map((t) => ({
        id: `upload-${_uploadId++}`,
        source: 'statement',
        date: t.date,
        description: t.description,
        amount: t.debit > 0 ? t.debit : t.credit,
        category: t.category,
        type: t.debit > 0 ? 'debit' : 'credit',
      }))
      setUploadedTxns((prev) => [...withIds, ...prev])
      logActivity()
    },
    [logActivity],
  )

  const createBlendGroup = useCallback((name, memberNames) => {
    const trimmedNames = memberNames.map((n) => n.trim()).filter(Boolean).slice(0, MAX_GROUP_MEMBERS - 1)
    const members = [
      { id: 'me', name: 'You', avatarColor: avatarColorForIndex(0) },
      ...trimmedNames.map((n, i) => ({ id: `m-${_blendMemberId++}`, name: n, avatarColor: avatarColorForIndex(i + 1) })),
    ]
    const id = `grp-new-${_blendGroupId++}`
    setBlendGroups((prev) => [{ id, name: name.trim(), createdAt: TODAY, members, ledger: [] }, ...prev])
    return id
  }, [])

  const addGroupMember = useCallback((groupId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBlendGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId || g.members.length >= MAX_GROUP_MEMBERS) return g
        const member = { id: `m-${_blendMemberId++}`, name: trimmed, avatarColor: avatarColorForIndex(g.members.length) }
        return { ...g, members: [...g.members, member] }
      }),
    )
  }, [])

  const addBlendExpense = useCallback((groupId, expense) => {
    const id = `bx-new-${_blendEntryId++}`
    setBlendGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, ledger: [{ id, type: 'expense', date: TODAY, ...expense }, ...g.ledger] } : g,
      ),
    )
  }, [])

  const addBlendSettlement = useCallback(
    (groupId, settlement) => {
      const id = `bs-new-${_blendEntryId++}`
      setBlendGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, ledger: [{ id, type: 'settlement', date: TODAY, ...settlement }, ...g.ledger] } : g,
        ),
      )
      if (!firstSettleUpRef.current) {
        firstSettleUpRef.current = true
        triggerCelebration('first-settle-up', 'First settle-up in Blend! 🎉', '🎉')
      }
    },
    [triggerCelebration],
  )

  const createPersonalGoal = useCallback((title, target, emoji) => {
    const id = `goal-new-${_goalId++}`
    setPersonalGoals((prev) => [{ id, title: title.trim(), target, emoji: emoji || '🎯', createdAt: TODAY, contributions: [] }, ...prev])
    return id
  }, [])

  const logPersonalContribution = useCallback(
    (goalId, amount, note = '', source = 'manual') => {
      const id = `contrib-new-${_contribId++}`
      setPersonalGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, contributions: [{ id, amount, date: TODAY, note, source }, ...g.contributions] } : g,
        ),
      )
      if (source === 'manual') logActivity()
    },
    [logActivity],
  )

  const createGroupGoal = useCallback((groupId, title, target, emoji) => {
    const id = `ggoal-new-${_goalId++}`
    setGroupGoals((prev) => [{ id, groupId, title: title.trim(), target, emoji: emoji || '🎯', createdAt: TODAY, contributions: [] }, ...prev])
    return id
  }, [])

  const logGroupContribution = useCallback((goalId, memberId, amount, note = '') => {
    const id = `contrib-new-${_contribId++}`
    setGroupGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, contributions: [{ id, memberId, amount, date: TODAY, note }, ...g.contributions] } : g,
      ),
    )
  }, [])

  const markDuePaid = useCallback((id) => {
    setDues((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const addBudget = useCallback((category, limit) => {
    setBudgets((prev) => (prev.some((b) => b.category === category) ? prev : [...prev, { category, limit }]))
  }, [])

  const redeemReward = useCallback(
    (reward) => {
      if (points < reward.cost) return false
      setPoints((p) => p - reward.cost)
      setRedeemed((prev) => [...prev, reward.id])
      if (reward.type === 'savings' && reward.savingsAmount) {
        // Feeds the user's first personal goal — the reward doesn't offer
        // a goal picker, so it targets whichever goal is primary/oldest.
        setPersonalGoals((prev) => {
          if (prev.length === 0) return prev
          const targetGoal = prev[0]
          const id = `contrib-new-${_contribId++}`
          return prev.map((g) =>
            g.id === targetGoal.id
              ? { ...g, contributions: [{ id, amount: reward.savingsAmount, date: TODAY, note: 'Reward redemption', source: 'reward' }, ...g.contributions] }
              : g,
          )
        })
      }
      return true
    },
    [points],
  )

  const earnPoints = useCallback((amount, label) => {
    setPoints((p) => p + amount)
    setPointEvents((prev) => [{ id: `pt-${Date.now()}`, label, points: amount, date: TODAY }, ...prev])
  }, [])

  const transactions = useMemo(
    () => [...autoTxns, ...cashTxns, ...uploadedTxns].sort((a, b) => b.date - a.date),
    [autoTxns, cashTxns, uploadedTxns],
  )

  const monthSpendByCategory = useMemo(() => {
    const start = startOfMonth(TODAY)
    const map = {}
    for (const t of transactions) {
      if (t.type !== 'debit' || t.date < start || t.date > TODAY) continue
      map[t.category] = (map[t.category] || 0) + t.amount
    }
    return map
  }, [transactions])

  // Real point-loss on going over budget — deducted once per category per
  // month (tracked in a ref, not state, since it's bookkeeping rather than
  // something the UI renders directly) rather than on every render.
  useEffect(() => {
    for (const b of budgets) {
      const spent = monthSpendByCategory[b.category] || 0
      if (spent > b.limit && !penalizedCategoriesRef.current.has(b.category)) {
        penalizedCategoriesRef.current.add(b.category)
        const label = categoryMeta(b.category).label
        setPoints((p) => p - OVER_BUDGET_PENALTY)
        setPointEvents((prev) => [
          { id: `pt-penalty-${b.category}`, label: `Went over ${label} budget`, points: -OVER_BUDGET_PENALTY, date: TODAY },
          ...prev,
        ])
      }
    }
  }, [monthSpendByCategory, budgets])

  const { history: streakHistory, currentStreak, todayTracked } = useMemo(
    () => computeStreak(trackedDates, TODAY),
    [trackedDates],
  )

  // New personal record and "first full month" (30-day streak) are real
  // milestones worth a celebration — checked against the *current* state
  // value (not a functional updater) to avoid triggering a side effect
  // from inside a setState callback.
  useEffect(() => {
    if (currentStreak > longestStreak) {
      triggerCelebration('streak-record', `New personal record — ${currentStreak}-day streak! 🔥`, '🔥')
      setLongestStreak(currentStreak)
    }
    if (currentStreak >= 30 && !fullMonthShownRef.current) {
      fullMonthShownRef.current = true
      triggerCelebration('full-month', 'First full month of tracking — incredible! 🌟', '🌟')
    }
  }, [currentStreak, longestStreak, triggerCelebration])

  // First time every budgeted category is on track in the same month.
  useEffect(() => {
    if (budgets.length === 0 || allBudgetsOnTrackRef.current) return
    const allOnTrack = budgets.every((b) => (monthSpendByCategory[b.category] || 0) <= b.limit)
    if (allOnTrack) {
      allBudgetsOnTrackRef.current = true
      triggerCelebration('all-budgets-on-track', 'Every category on track this month! 🌟', '🌟')
    }
  }, [budgets, monthSpendByCategory, triggerCelebration])

  const value = useMemo(
    () => ({
      today: TODAY,
      transactions,
      monthSpendByCategory,
      budgets,
      addBudget,
      dues,
      blendGroups,
      createBlendGroup,
      addGroupMember,
      addBlendExpense,
      addBlendSettlement,
      points,
      pointEvents,
      streak: { currentStreak, longestStreak, history: streakHistory, todayTracked },
      rewardsCatalog: REWARDS_CATALOG,
      redeemed,
      personalGoals,
      groupGoals,
      createPersonalGoal,
      logPersonalContribution,
      createGroupGoal,
      logGroupContribution,
      addCashExpense,
      addUploadedTransactions,
      markDuePaid,
      redeemReward,
      earnPoints,
      celebration,
      clearCelebration,
    }),
    [
      transactions,
      monthSpendByCategory,
      budgets,
      addBudget,
      dues,
      blendGroups,
      createBlendGroup,
      addGroupMember,
      addBlendExpense,
      addBlendSettlement,
      celebration,
      clearCelebration,
      points,
      pointEvents,
      currentStreak,
      longestStreak,
      streakHistory,
      todayTracked,
      redeemed,
      personalGoals,
      groupGoals,
      createPersonalGoal,
      logPersonalContribution,
      createGroupGoal,
      logGroupContribution,
      addCashExpense,
      addUploadedTransactions,
      markDuePaid,
      redeemReward,
      earnPoints,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
