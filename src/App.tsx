import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { HyperliquidProvider } from './contexts/HyperliquidContext'
import { MarketProvider } from './contexts/MarketContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { PageErrorBoundary } from './components/shared/PageErrorBoundary'
import { ConnectButton } from './components/shared/ConnectButton'
const ThousandXPerpsPage = lazy(() => import('./pages/ThousandXPerpsPage').then(m => ({ default: m.ThousandXPerpsPage })))
const PerpsPage = lazy(() => import('./pages/PerpsPage').then(m => ({ default: m.PerpsPage })))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })))
const SpotPage = lazy(() => import('./pages/SpotPage').then(m => ({ default: m.SpotPage })))
const DocsPage = lazy(() => import('./pages/DocsPage').then(m => ({ default: m.DocsPage })))
const PredictionsPage = lazy(() => import('./pages/PredictionsPage').then(m => ({ default: m.PredictionsPage })))
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const LendingPage = lazy(() => import('./pages/LendingPage').then(m => ({ default: m.LendingPage })))
const OptionsPage = lazy(() => import('./pages/OptionsPage').then(m => ({ default: m.OptionsPage })))
const StakingPage = lazy(() => import('./pages/StakingPage').then(m => ({ default: m.StakingPage })))
import { useSoundNotifications } from './hooks/useSoundNotifications'

const queryClient = new QueryClient()

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

function NavMore() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const closeOnEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', closeOnEscape) }
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className={`nav-tab`} aria-expanded={open} aria-label="More navigation" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        More
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="nav-more-dropdown">
          <NavLink to="/docs" className="nav-more-item" onClick={() => setOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M18 18h-8M18 10h-8"/></svg>
            Docs
          </NavLink>
          <a href="https://github.com/Christophorusan/futuresxyz" target="_blank" rel="noopener noreferrer" className="nav-more-item" onClick={() => setOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>
            GitHub
          </a>
        </div>
      )}
    </div>
  )
}

function AppContent() {
  useSoundNotifications()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app">
        <nav className="nav">
          <div className="nav-left">
            <NavLink to="/perps" className="logo">
              <svg className="logo-icon" width="24" height="24" viewBox="0 0 32 32" fill="none">
                <line x1="6" y1="2" x2="6" y2="30" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="2.5" y="7" width="7" height="15" rx="1" fill="currentColor"/>
                <rect x="12.5" y="9" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="22.5" y="5" width="7" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Futuresxyz
            </NavLink>
            <div className="nav-tabs">
              <NavLink to="/perps" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Perps
              </NavLink>
              <NavLink to="/1000x-perps" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>1000x Perps</NavLink>
              <NavLink to="/spot" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Swap
              </NavLink>
              <NavLink to="/predictions" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Predictions
              </NavLink>
              <NavLink to="/lending" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Lending
              </NavLink>
              <NavLink to="/options" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Options
              </NavLink>
              <NavLink to="/staking" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Staking
              </NavLink>
              <NavLink to="/payments" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>Payments</NavLink>
              <NavLink to="/portfolio" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Portfolio
              </NavLink>
              <NavMore />
            </div>
          </div>
          <div className="nav-right">
            <a href="https://app.hyperunit.xyz/deposit" target="_blank" rel="noopener noreferrer" className="nav-deposit-btn">Deposit</a>
            <ThemeToggle />
            <ConnectButton />
          </div>
        </nav>

        <PageErrorBoundary><Suspense fallback={<main className="lending-page" role="status">Loading…</main>}>
        <Routes>
          <Route path="/perps" element={<PerpsPage />} />
          <Route path="/1000x-perps" element={<ThousandXPerpsPage />} />
          <Route path="/spot" element={<SpotPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/lending" element={<LendingPage />} />
          <Route path="/options" element={<OptionsPage />} />
          <Route path="/staking" element={<StakingPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/perps" replace />} />
        </Routes>
        </Suspense></PageErrorBoundary>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <HyperliquidProvider>
          <MarketProvider>
            <ThemeProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </ThemeProvider>
          </MarketProvider>
        </HyperliquidProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
