import { useState } from 'react'
import ConnectAccount from './components/ConnectAccount'
import Upload from './components/Upload'
import Dashboard from './components/Dashboard'
import MonthlyBreakdown from './components/MonthlyBreakdown'

type View = 'connect' | 'upload' | 'dashboard' | 'monthly'

function App() {
  const [currentView, setCurrentView] = useState<View>('connect')

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Transaction Categorizer</h1>
          <p>Manage and categorize your financial transactions</p>
        </header>

        <nav className="nav">
          <button
            className={currentView === 'connect' ? 'active' : ''}
            onClick={() => setCurrentView('connect')}
          >
            Connect Accounts
          </button>
          <button
            className={currentView === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={currentView === 'monthly' ? 'active' : ''}
            onClick={() => setCurrentView('monthly')}
          >
            Monthly Breakdown
          </button>
          <button
            className={currentView === 'upload' ? 'active' : ''}
            onClick={() => setCurrentView('upload')}
          >
            Upload CSV
          </button>
        </nav>

        {currentView === 'connect' && <ConnectAccount onSuccess={() => setCurrentView('dashboard')} />}
        {currentView === 'upload' && <Upload />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'monthly' && <MonthlyBreakdown />}
      </div>
    </div>
  )
}

export default App
