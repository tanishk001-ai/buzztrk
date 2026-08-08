import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  AUTO_TRANSACTIONS,
  CASH_TRANSACTIONS,
  BUDGETS,
  DUES,
  BLEND_GROUPS,
  STREAK,
  POINT_EVENTS,
  REWARDS_CATALOG,
  SAVINGS_GOAL,
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
  const [savingsProgress, setSavingsProgress] = useState(0)
  const [trackedDates, setTrackedDates] = useState(() => seedTrackedDatesFromHistory(STREAK.history, TODAY))
  const [longestStreak, setLongestStreak] = useState(STREAK.longestStreak)

  const penalizedCategoriesRef = useRef(new Set())

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

  const addBlendSettlement = useCallback((groupId, settlement) => {
    const id = `bs-new-${_blendEntryId++}`
    setBlendGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, ledger: [{ id, type: 'settlement', date: TODAY, ...settlement }, ...g.ledger] } : g,
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
        setSavingsProgress((s) => s + reward.savingsAmount)
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

  useEffect(() => {
    setLongestStreak((prev) => Math.max(prev, currentStreak))
  }, [currentStreak])

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
      savingsProgress,
      savingsGoal: SAVINGS_GOAL,
      addCashExpense,
      addUploadedTransactions,
      markDuePaid,
      redeemReward,
      earnPoints,
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
      points,
      pointEvents,
      currentStreak,
      longestStreak,
      streakHistory,
      todayTracked,
      redeemed,
      savingsProgress,
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
