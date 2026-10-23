import { useWalletPortfolio } from '../contexts/WalletPortfolioContext'
import { visibleHoldings } from '../lib/visibleHoldings'
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { networks } from '../hooks/useUnifiedPortfolio'
import './WalletPage.css'
import { TokenNetworkIcon } from '../components/TokenNetworkIcon'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '../components/shared/ConnectButton'

const PaymentForm = lazy(() => import('../components/PaymentForm').then(m => ({ default: m.PaymentForm })))

export function WalletPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const action = new URLSearchParams(location.search).get('action')
  const paymentMode = location.hash.includes('chain=') ? 'send' : action === 'send' || action === 'receive' ? action : null
  useEffect(() => {
    if (paymentMode && !dialogRef.current?.open) dialogRef.current?.showModal()
    else if (!paymentMode && dialogRef.current?.open) dialogRef.current.close()
  }, [paymentMode])
  const closePayment = () => navigate('/wallet', { replace: true })
  const { isConnected } = useAccount()

  const [network, setNetwork] = useState('all')
  const [assetSearch, setAssetSearch] = useState('')
  const { accounts, data, isLoading, isError, assets, incomplete, unpriced, total, refetch, isFetching } = useWalletPortfolio()
  const holdings=visibleHoldings(assets)
  const filteredHoldings = holdings.filter(asset => (network === 'all' || asset.network === network) && `${asset.name} ${asset.symbol}`.toLowerCase().includes(assetSearch.toLowerCase().trim()))
  const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <main className="lending-page payments-page mobile-wallet-page oslo-wallet-home wallet-portfolio-home wallet-simple">
    <header className="payment-hero"><div><h1>Wallet</h1><p>One wallet. Your holdings across supported networks.</p></div></header>
    <div className="wallet-workspace"><div className="wallet-main-column">
    <section className="lending-card wallet-summary">
      <div className="wallet-overview-top"><div><span className="wallet-total-label">{incomplete && total !== null ? 'Partial balance' : unpriced ? 'Priced holdings value' : 'Total balance'}</span><strong className="wallet-total">{total === null ? '—' : money(total)} <small>USD</small></strong><p>{!accounts.length ? 'Connect your wallet to see your holdings.' : isLoading ? 'Loading your holdings…' : incomplete ? total !== null ? 'Showing available holdings. Some balances or token details are unavailable.' : 'Balances could not load. Please retry.' : `${holdings.length} assets in your wallet${unpriced ? ` · ${unpriced} unpriced tokens excluded` : ''}`}</p></div>
</div>
      <nav className="wallet-portfolio-actions" aria-label="Portfolio actions">
        <Link to="/wallet?action=send"><span aria-hidden="true">↗</span>Send</Link>
        <Link to="/wallet?action=receive"><span aria-hidden="true">↙</span>Receive</Link>
        <Link to="/swap"><span aria-hidden="true">⇄</span>Swap</Link>
      </nav>
      {!isConnected && <ConnectButton />}
      {incomplete && <button className="wallet-retry" disabled={isFetching} onClick={() => void refetch()}>{isFetching ? 'Refreshing…' : 'Retry balances'}</button>}
      {!!data?.tokenWarnings.length && <details className="wallet-details"><summary>{data.tokenWarnings.length} tokens need balance or metadata details</summary><p>These tokens are excluded from the value until their details can be loaded.</p>{data.tokenWarnings.map(warning=><p key={warning}>{warning}</p>)}</details>}
      {!!data?.errors.length&&<details className="wallet-details"><summary>Some networks could not be loaded</summary>{data.errors.map(error=><p key={error}>{error}</p>)}</details>}
    </section>
    <section className="wallet-content-card">
      <section className="lending-card wallet-holdings"><div className="wallet-assets-heading"><div><h2>Your tokens</h2><p>Holdings worth $0.01 or more.</p></div><span className="wallet-chain-label">{holdings.length} assets</span></div>
      <div className="wallet-holdings-filters"><input aria-label="Search tokens" type="search" placeholder="Search tokens" value={assetSearch} onChange={e => setAssetSearch(e.target.value)} /><select aria-label="Filter tokens by network" value={network} onChange={e => setNetwork(e.target.value)}><option value="all">All networks</option>{Object.entries({ ...networks, HyperCore: 'HyperCore' }).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
      <ul className="wallet-simple-tokens">{filteredHoldings.map(asset => <li key={asset.id}>
        <TokenNetworkIcon network={asset.network} symbol={asset.network === 'HyperCore' && asset.symbol === 'Equity' ? 'HYPE' : asset.symbol} logo={asset.logo}/>
        <div className="wallet-simple-token-name"><strong>{asset.name}</strong><small>{Number(asset.balance).toLocaleString(undefined,{maximumSignificantDigits:8})} {asset.symbol} · {networks[asset.network as keyof typeof networks]??asset.network}</small></div>
        <strong className="wallet-simple-token-value">{asset.value === null ? '—' : `$${money(asset.value)}`}</strong>
      </li>)}</ul>
      {!filteredHoldings.length && <div className="wallet-section-empty">{!accounts.length ? 'Connect your wallet to see your tokens.' : isLoading ? 'Loading holdings…' : isError ? 'Balances are unavailable. Please reload to retry.' : holdings.length ? 'No tokens match your filters.' : 'No holdings worth $0.01 or more were found.'}</div>}
      <details className="wallet-value-details"><summary>About this balance</summary><p>Shows priced holdings of $0.01 or more across supported networks, including Hyperliquid trading equity. Unpriced tokens, collectibles and lending positions are excluded. Hyperliquid values estimate 1 USDC as $1. Solana requires a Solana wallet connection, which is not supported here yet.</p></details>
    </section>
    </section>
    </div>
    </div>
    <dialog ref={dialogRef} className="wallet-dialog wallet-payment-dialog" aria-labelledby="wallet-payment-title" onCancel={closePayment} onClose={() => { if (paymentMode) closePayment() }}>
      <header><div><h2 id="wallet-payment-title">{paymentMode === 'receive' ? 'Receive' : 'Send'}</h2><small>HyperEVM</small></div><button className="wallet-close" aria-label="Close" onClick={closePayment}>×</button></header>
      {paymentMode && <Suspense fallback={<p role="status">Loading…</p>}><PaymentForm key={`${paymentMode}-${location.hash}`} hash={location.hash} receive={paymentMode === 'receive'} /></Suspense>}
    </dialog>
  </main>
}
