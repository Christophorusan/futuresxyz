import { PageErrorBoundary } from './components/shared/PageErrorBoundary'
import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { entryDestination, hasEntered, rememberEntry } from './lib/entryGate'

const FinanceApp = lazy(() => import('./FinanceApp'))

function Entry() {
  const location = useLocation()
  const navigate = useNavigate()
  const [entered, setEntered] = useState(hasEntered)
  const landing = !entered || location.pathname === '/'
  function enter() {
    rememberEntry()
    setEntered(true)
    navigate(entryDestination(location), { replace: true })
    window.scrollTo(0, 0)
  }
  return landing ? <LandingPage onEnter={enter} /> :
    <PageErrorBoundary><Suspense fallback={<div className="oslo-loading" role="status">Opening Oslo…</div>}><FinanceApp /></Suspense></PageErrorBoundary>
}

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><Entry /></BrowserRouter>
}
