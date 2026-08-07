import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  AUTO_TRANSACTIONS,
  CASH_TRANSACTIONS,
  BUDGETS,
  DUES,
  BLEND_GROUP,
  BLEND_EXPENSES,
  BLEND_STATS,
  STREAK,
  POINT_EVENTS,
  REWARDS_CATALOG,
  TODAY,
} from '../data/mockData'

const AppStateContext = createContext(null)

let _cashId = 1
let _uploadId = 1

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

export function AppStateProvider({ children }) {
  const [autoTxns] = useState(normalizeAuto)
  const [cashTxns, setCashTxns] = useState(normalizeCash)
  const [uploadedTxns, setUploadedTxns] = useState([])
  const [budgets] = useState(BUDGETS)
  const [dues, setDues] = useState(DUES)
  const [blendExpenses, setBlendExpenses] = useState(BLEND_EXPENSES)
  const [points, setPoints] = useState(STREAK.points)
  const [pointEvents, setPointEvents] = useState(POINT_EVENTS)
  const [redeemed, setRedeemed] = useState([])

  const addCashExpense = useCallback((expense) => {
    const id = `cash-new-${_cashId++}`
    setCashTxns((prev) => [
      { id, source: 'cash', date: expense.date, description: expense.description, amount: expense.amount, category: expense.category, type: 'debit' },
      ...prev,
    ])
  }, [])

  const addUploadedTransactions = useCallback((txns) => {
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
  }, [])

  const settleBlendExpense = useCallback((id) => {
    setBlendExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, settled: true } : e)))
  }, [])

  const markDuePaid = useCallback((id) => {
    setDues((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const redeemReward = useCallback((reward) => {
    if (points < reward.cost) return false
    setPoints((p) => p - reward.cost)
    setRedeemed((prev) => [...prev, reward.id])
    return true
  }, [points])

  const earnPoints = useCallback((amount, label) => {
    setPoints((p) => p + amount)
    setPointEvents((prev) => [{ id: `pt-${Date.now()}`, label, points: amount, date: TODAY }, ...prev])
  }, [])

  const transactions = useMemo(
    () => [...autoTxns, ...cashTxns, ...uploadedTxns].sort((a, b) => b.date - a.date),
    [autoTxns, cashTxns, uploadedTxns],
  )

  const value = useMemo(
    () => ({
      today: TODAY,
      transactions,
      budgets,
      dues,
      blendGroup: BLEND_GROUP,
      blendExpenses,
      blendStats: BLEND_STATS,
      points,
      pointEvents,
      streak: STREAK,
      rewardsCatalog: REWARDS_CATALOG,
      redeemed,
      addCashExpense,
      addUploadedTransactions,
      settleBlendExpense,
      markDuePaid,
      redeemReward,
      earnPoints,
    }),
    [transactions, budgets, dues, blendExpenses, points, pointEvents, redeemed, addCashExpense, addUploadedTransactions, settleBlendExpense, markDuePaid, redeemReward, earnPoints],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
