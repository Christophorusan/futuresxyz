import { SearchIcon } from './components/shared/SearchIcon'
import { InAppBrowser } from './components/shared/InAppBrowser'
import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { privyAppId } from './contexts/EmailWalletContext'
const EmailWalletProvider = lazy(() => import('./components/auth/EmailWalletProvider'))
import { HyperliquidProvider } from './contexts/HyperliquidContext'
import { MarketProvider } from './contexts/MarketContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { PageErrorBoundary } from './components/shared/PageErrorBoundary'
import { ConnectButton } from './components/shared/ConnectButton'
const ThousandXPerpsPage = lazy(() => import('./pages/ThousandXPerpsPage').then(m => ({ default: m.ThousandXPerpsPage })))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage').then(m => ({ default: m.DiscoverPage })))
const WalletPage = lazy(() => import('./pages/WalletPage').then(m => ({ default: m.WalletPage })))
const PerpsPage = lazy(() => import('./pages/PerpsPage').then(m => ({ default: m.PerpsPage })))
const BridgePage = lazy(() => import('./pages/BridgePage').then(m => ({ default: m.BridgePage })))
const SpotPage = lazy(() => import('./pages/SpotPage').then(m => ({ default: m.SpotPage })))
const DocsPage = lazy(() => import('./pages/DocsPage').then(m => ({ default: m.DocsPage })))
const PredictionsPage = lazy(() => import('./pages/PredictionsPage').then(m => ({ default: m.PredictionsPage })))
const LendingProviderPage = lazy(() => import('./pages/LendingProviderPage').then(m => ({ default: m.LendingProviderPage })))
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
          {[['/bridge', 'Swap'], ['/staking', 'Staking'], ['/predictions', 'Predictions'], ['/options', 'Options'], ['/1000x-perps', '1000x Perps']].map(([to, label]) => <NavLink key={to} to={to} className="nav-more-item" onClick={() => setOpen(false)}>{label}</NavLink>)}

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

const sidebarItems = [
  ['/wallet', 'Wallet', 'M3 7h18v14H3z M3 7V4h15v3 M16 12h5v5h-5z'],
  ['/lending', 'Lending', 'M4 20h16 M7 16v-5 M12 16V7 M17 16V3'],
  ['/perps', 'Trade', 'M3 17 8 12l4 3 9-11 M15 4h6v6'],
  ['/bridge', 'Swap', 'M4 7h16l-4-4 M20 17H4l4 4'],
  ['/predictions', 'Prediction markets', 'M4 20h16 M6 16V9 M12 16V4 M18 16v-5'],
]

function Sidebar() {
  return <aside className="oslo-sidebar">
    <NavLink to="/wallet" className="oslo-sidebar-brand" aria-label="Oslo wallet">oslo</NavLink>
    <nav className="oslo-sidebar-links" aria-label="Main navigation">
      {sidebarItems.map(([to, label, path]) => <NavLink key={to} to={to} className={({ isActive }) => `oslo-sidebar-link${isActive ? ' active' : ''}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
        <span>{label}</span>
      </NavLink>)}
      <div className="oslo-sidebar-more"><NavMore /></div>
    </nav>
    <span className="oslo-sidebar-foot">YOUR MONEY.<br />YOUR MOVE.</span>
  </aside>
}

function LegacyPaymentRedirect() {
  const location = useLocation()
  const action = new URLSearchParams(location.search).get('mode') === 'receive' && !location.hash ? 'receive' : 'send'
  return <Navigate to={`/wallet?action=${action}${location.hash}`} replace />
}

function AppContent() {
  useSoundNotifications()

  return (
      <div className="app oslo-workspace">
        <Sidebar />
        <InAppBrowser />
        <nav className="nav">
          <div className="nav-left">
            <NavLink to="/" className="logo">
              oslo
            </NavLink>
            <div className="nav-tabs">
              {[['/wallet', 'Wallet'], ['/lending', 'Lending'], ['/perps', 'Trade']].map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>{label}</NavLink>)}
              <NavMore />
            </div>
          </div>
          <div className="nav-right">
            <NavLink to="/discover" aria-label="Search apps" title="Search apps" className={({ isActive }) => `nav-deposit-btn nav-discover-btn${isActive ? ' active' : ''}`}><SearchIcon /><span>Discover</span></NavLink>
            <NavLink to="/bridge" className="nav-deposit-btn">Deposit</NavLink>
            <ThemeToggle />
            <ConnectButton />
          </div>
        </nav>

        <PageErrorBoundary><Suspense fallback={<main className="lending-page" role="status">Loading…</main>}>
        <Routes>
          <Route path="/perps" element={<PerpsPage />} />
          <Route path="/1000x-perps" element={<ThousandXPerpsPage />} />
          <Route path="/bridge" element={<BridgePage />} />
          <Route path="/spot" element={<SpotPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/payments" element={<LegacyPaymentRedirect />} />
          <Route path="/lending" element={<LendingPage />} />
          <Route path="/lending/:provider" element={<LendingProviderPage />} />
          <Route path="/options" element={<OptionsPage />} />
          <Route path="/staking" element={<StakingPage />} />
          <Route path="/portfolio" element={<Navigate to="/wallet" replace />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/wallet" replace />} />
        </Routes>
        </Suspense></PageErrorBoundary>
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {[['/wallet', 'Wallet', '◈'], ['/perps', 'Trade', '≋'], ['/lending', 'Lend', '＋']].map(([to, label, icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}
        </nav>
      </div>
  )
}

function App() {
  const content = <HyperliquidProvider><MarketProvider><ThemeProvider><ToastProvider><AppContent /></ToastProvider></ThemeProvider></MarketProvider></HyperliquidProvider>
  if (privyAppId) return <Suspense fallback={<div className="oslo-loading" role="status">Loading wallet sign-in…</div>}><EmailWalletProvider queryClient={queryClient}>{content}</EmailWalletProvider></Suspense>
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}>{content}</QueryClientProvider></WagmiProvider>
}

export default App
