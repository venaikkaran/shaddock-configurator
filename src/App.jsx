import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import CategorySidebar from './components/CategorySidebar'
import BrowseView from './components/BrowseView'
import WizardView from './components/WizardView'
import CompareView from './components/CompareView'
import BudgetPanel from './components/BudgetPanel'
import SettingsModal from './components/SettingsModal'

function AppContent() {
  const { loading, viewMode, totalCost, categoryCounts, data } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-600 font-display text-xl">Loading options...</p>
        </div>
      </div>
    )
  }

  const totalSelected = Object.values(categoryCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen flex flex-col bg-warm-50">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
        {viewMode !== 'compare' && <CategorySidebar />}

        <main className="flex-1 overflow-y-auto">
          {viewMode === 'browse' && <BrowseView />}
          {viewMode === 'wizard' && <WizardView />}
          {viewMode === 'compare' && <CompareView />}
        </main>

        {viewMode !== 'compare' && <BudgetPanel />}
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
