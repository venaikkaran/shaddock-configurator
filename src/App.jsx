import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import CategorySidebar from './components/CategorySidebar'
import BrowseView from './components/BrowseView'
import WizardView from './components/WizardView'
import CompareView from './components/CompareView'
import BudgetPanel from './components/BudgetPanel'
import SettingsModal from './components/SettingsModal'
import RoomView from './components/RoomView'
import RoomSidebar from './components/RoomSidebar'

function AppContent() {
  const { loading, viewMode, browseMode, totalCost, categoryCounts, data } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)

  // Close drawers when viewport crosses the xl breakpoint (1280px)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1280px)')
    function handleChange() {
      if (mql.matches) {
        setSidebarOpen(false)
        setBudgetOpen(false)
      }
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

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

  const showSidebar = viewMode !== 'compare'
  const SidebarComponent = viewMode === 'browse' && browseMode === 'room' ? RoomSidebar : CategorySidebar

  return (
    <div className="h-screen flex flex-col bg-warm-50 overflow-hidden">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {/* Toggle buttons for smaller screens (below xl / 1280px) */}
      {viewMode !== 'compare' && (
        <div className="xl:hidden flex items-center gap-2 px-4 py-2 bg-white border-b border-warm-200">
          <button
            type="button"
            onClick={() => { setSidebarOpen(!sidebarOpen); setBudgetOpen(false) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sidebarOpen
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'bg-warm-50 text-warm-600 border border-warm-200 hover:bg-warm-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            Categories
          </button>
          <button
            type="button"
            onClick={() => { setBudgetOpen(!budgetOpen); setSidebarOpen(false) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              budgetOpen
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'bg-warm-50 text-warm-600 border border-warm-200 hover:bg-warm-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Budget
          </button>
          {totalSelected > 0 && (
            <span className="ml-auto text-sm text-warm-600">
              {totalSelected} selected
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Sidebar: always visible at xl+, slide-over drawer below xl */}
        {showSidebar && (
          <>
            {/* Desktop sidebar */}
            <div className="hidden xl:block">
              <SidebarComponent />
            </div>
            {/* Mobile/tablet sidebar overlay */}
            {sidebarOpen && (
              <>
                <div
                  className="xl:hidden fixed inset-0 bg-black/30 z-30"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="xl:hidden absolute left-0 top-0 bottom-0 z-40 shadow-lg">
                  <SidebarComponent />
                </div>
              </>
            )}
          </>
        )}

        <main className={`flex-1 min-h-0 flex flex-col ${viewMode === 'wizard' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {viewMode === 'browse' && (
            browseMode === 'room' ? <RoomView /> : <BrowseView />
          )}
          {viewMode === 'wizard' && <WizardView />}
          {viewMode === 'compare' && <CompareView />}
        </main>

        {/* Budget panel: always visible at xl+, slide-over drawer below xl */}
        {viewMode !== 'compare' && (
          <>
            <div className="hidden xl:block">
              <BudgetPanel />
            </div>
            {budgetOpen && (
              <>
                <div
                  className="xl:hidden fixed inset-0 bg-black/30 z-30"
                  onClick={() => setBudgetOpen(false)}
                />
                <div className="xl:hidden absolute right-0 top-0 bottom-0 z-40 shadow-lg">
                  <BudgetPanel />
                </div>
              </>
            )}
          </>
        )}
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
