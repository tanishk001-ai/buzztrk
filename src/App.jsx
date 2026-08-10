import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppStateProvider, useAppState } from './state/AppState'
import BottomNav from './components/BottomNav'
import Celebration from './components/Celebration'
import Dashboard from './pages/Dashboard'
import Budgets from './pages/Budgets'
import Dues from './pages/Dues'
import Blend from './pages/Blend'
import BlendCreateGroup from './pages/BlendCreateGroup'
import BlendGroup from './pages/BlendGroup'
import BlendAddExpense from './pages/BlendAddExpense'
import BlendSettleUp from './pages/BlendSettleUp'
import BlendHistory from './pages/BlendHistory'
import BlendGroupGoal from './pages/BlendGroupGoal'
import Rewards from './pages/Rewards'
import Goals from './pages/Goals'
import GoalDetail from './pages/GoalDetail'
import Personality from './pages/Personality'
import AddExpense from './pages/AddExpense'
import UploadStatement from './pages/UploadStatement'
import Wrapped from './pages/Wrapped'
import Advice from './pages/Advice'

function CelebrationHost() {
  const { celebration, clearCelebration } = useAppState()
  return <Celebration celebration={celebration} onDismiss={clearCelebration} />
}

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <div className="min-h-svh max-w-md mx-auto relative pb-28">
          <CelebrationHost />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/dues" element={<Dues />} />
            <Route path="/blend" element={<Blend />} />
            <Route path="/blend/new" element={<BlendCreateGroup />} />
            <Route path="/blend/:groupId" element={<BlendGroup />} />
            <Route path="/blend/:groupId/add-expense" element={<BlendAddExpense />} />
            <Route path="/blend/:groupId/settle-up" element={<BlendSettleUp />} />
            <Route path="/blend/:groupId/history" element={<BlendHistory />} />
            <Route path="/blend/:groupId/goal" element={<BlendGroupGoal />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/:goalId" element={<GoalDetail />} />
            <Route path="/personality" element={<Personality />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/upload" element={<UploadStatement />} />
            <Route path="/wrapped" element={<Wrapped />} />
            <Route path="/advice" element={<Advice />} />
          </Routes>
          <BottomNav />
        </div>
      </HashRouter>
    </AppStateProvider>
  )
}
