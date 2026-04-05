import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { HyperliquidProvider } from './contexts/HyperliquidContext'
import { MarketProvider } from './contexts/MarketContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConnectButton } from './components/shared/ConnectButton'
import { PerpsPage } from './pages/PerpsPage'
import { ProtocolsPage } from './pages/ProtocolsPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { SpotPage } from './pages/SpotPage'
import { DocsPage } from './pages/DocsPage'
import { EmbedPage, ProtocolPage } from './pages/EmbedPage'
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
              <NavLink to="/spot" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Swap
              </NavLink>
              <NavLink to="/predictions" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Predictions
              </NavLink>
              <NavLink to="/lending" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Lending
              </NavLink>
              <NavLink to="/cdp" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                CDP
              </NavLink>
              <NavLink to="/staking" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Staking
              </NavLink>
              <NavLink to="/portfolio" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Portfolio
              </NavLink>
              <NavLink to="/docs" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                Docs
              </NavLink>
            </div>
          </div>
          <div className="nav-right">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </nav>

        <Routes>
          <Route path="/perps" element={<PerpsPage />} />
          <Route path="/spot" element={<SpotPage />} />
          <Route path="/predictions" element={<EmbedPage title="Predictions" url="https://testnet.outcome.xyz/events" description="Powered by Outcome" />} />
          <Route path="/lending" element={<ProtocolPage title="HyperLend" url="https://app.hyperlend.finance/dashboard" description="Lend and borrow on Hyperliquid's native lending protocol." features={['Supply assets to earn yield', 'Borrow against your collateral', 'Manage lending positions']} />} />
          <Route path="/cdp" element={<EmbedPage title="Felix CDP" url="https://www.usefelix.xyz/portfolio" description="Powered by Felix" />} />
          <Route path="/staking" element={<ProtocolPage title="HyperBeat" url="https://app.hyperbeat.org/staking" description="Stake HYPE and earn liquid staking rewards." features={['Stake HYPE for stHYPE', 'Earn staking rewards', 'Liquid staking derivatives']} />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/protocols" element={<ProtocolsPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/perps" replace />} />
        </Routes>
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
