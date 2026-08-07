import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Budgets from './pages/Budgets'
import Dues from './pages/Dues'
import Blend from './pages/Blend'
import Rewards from './pages/Rewards'
import AddExpense from './pages/AddExpense'
import UploadStatement from './pages/UploadStatement'
import Wrapped from './pages/Wrapped'
import Advice from './pages/Advice'

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <div className="min-h-svh max-w-md mx-auto relative pb-28">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/dues" element={<Dues />} />
            <Route path="/blend" element={<Blend />} />
            <Route path="/rewards" element={<Rewards />} />
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
