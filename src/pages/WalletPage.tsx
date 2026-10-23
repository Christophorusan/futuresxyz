import { WalletTrading } from '../components/WalletTrading'
import { visibleHoldings } from '../lib/visibleHoldings'
import { MarketWatchlist } from '../components/MarketWatchlist'
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useUnifiedPortfolio, validAccount, normalizeAccount, networks } from '../hooks/useUnifiedPortfolio'
import { WalletHistory } from '../components/WalletHistory'
import './WalletPage.css'
import { TokenIcon } from '../components/TokenIcon'
import { AlchemyConnection } from '../components/shared/AlchemyConnection'
import { AlchemyHistory } from '../components/shared/AlchemyHistory'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '../components/shared/ConnectButton'
import { EvmActivity } from '../components/shared/EvmActivity'

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
  const { address, isConnected } = useAccount()
  const [tracked,setTracked]=useState<string[]>(()=>{try {const saved=JSON.parse(localStorage.getItem('oslo-tracked-accounts')??'[]');return Array.isArray(saved)?saved.filter((a):a is string=>typeof a==='string'&&validAccount(a)):[]}catch{return []}})
  const [section, setSection] = useState<'Tokens' | 'Trading' | 'Activity' | 'Watchlist'>('Tokens')
  const [network, setNetwork] = useState('all')
  const [assetSearch, setAssetSearch] = useState('')
  const walletsRef = useRef<HTMLDetailsElement>(null)
  const [accountInput,setAccountInput]=useState('')
  const [accountError,setAccountError]=useState('')
  const accounts=[...new Set([...(address?[normalizeAccount(address)]:[]),...tracked.map(normalizeAccount)])].sort()
  const {data,isLoading,isError}=useUnifiedPortfolio(accounts)
  const assets=data?.assets??[]
  const holdings=visibleHoldings(assets)
  const filteredHoldings = holdings.filter(asset => (network === 'all' || asset.network === network) && `${asset.name} ${asset.symbol}`.toLowerCase().includes(assetSearch.toLowerCase().trim()))
  const incomplete=isError||!!data?.errors.length
  const unpriced=assets.filter(a=>a.value===null).length
  const total=accounts.length&&!isLoading&&data&&!incomplete?assets.reduce((sum,a)=>sum+(a.value??0),0):null
  const saveAccounts=(next:string[])=>{setTracked(next);try{localStorage.setItem('oslo-tracked-accounts',JSON.stringify(next))}catch{setAccountError('Saved for this session only.')}}
  const addAccount=()=>{const value=accountInput.trim();if(!validAccount(value)){setAccountError('Enter a valid Ethereum or Solana wallet address.');return}saveAccounts([...new Set([...tracked,normalizeAccount(value)])]);setAccountInput('');setAccountError('')}
  const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <main className="lending-page payments-page mobile-wallet-page oslo-wallet-home wallet-portfolio-home">
    <header className="payment-hero"><div><h1>Wallet</h1><p>All your wallets. One clear view.</p></div></header>
    <div className="wallet-workspace"><div className="wallet-main-column">
    <section className="lending-card wallet-summary">
      <div className="wallet-summary-heading"><h2>All wallets <span>{accounts.length}</span></h2><button onClick={() => { if (walletsRef.current) { walletsRef.current.open = true; walletsRef.current.querySelector('input')?.focus() } }}>＋ Add wallet</button></div>
      <div className="wallet-overview-top"><div><span className="wallet-total-label">{unpriced ? 'Priced holdings value' : 'Estimated portfolio value'}</span><strong className="wallet-total">{total === null ? '—' : money(total)} <small>USD</small></strong><p>{!accounts.length ? 'Connect a wallet or add a public address.' : isLoading ? 'Loading your holdings…' : incomplete ? 'Some balances or prices are unavailable.' : `${holdings.length} assets in your wallet${unpriced ? ` · ${unpriced} unpriced tokens excluded` : ''}`}</p></div>
</div>
      <nav className="wallet-portfolio-actions" aria-label="Portfolio actions">
        <Link to="/wallet?action=send"><span aria-hidden="true">↗</span>Send</Link>
        <Link to="/wallet?action=receive"><span aria-hidden="true">↙</span>Receive</Link>
        <Link to="/bridge"><span aria-hidden="true">⇄</span>Swap</Link>
      </nav>
      {!isConnected && <ConnectButton />}
      <WalletHistory address={accounts.length?`multi-priced-usd-v2:${accounts.join('|')}`:undefined} value={total} status={isLoading ? 'Loading your balances…' : incomplete ? 'Some networks could not load. Chart recording resumes when they recover.' : undefined} />
      <details ref={walletsRef} className="wallet-details"><summary>Wallets and networks · {accounts.length} accounts</summary><p>Track Ethereum, Base, Arbitrum, Optimism, Polygon, HyperEVM, HyperCore and Solana together.</p><form onSubmit={e=>{e.preventDefault();addAccount()}} className="wallet-account-form"><input aria-label="Public wallet address" placeholder="Paste your wallet address" value={accountInput} onChange={e=>setAccountInput(e.target.value)} /><button type="submit">Add wallet</button></form>{accountError&&<p role="alert">{accountError}</p>}{tracked.map(a=><p key={a}><code>{a}</code> <button onClick={()=>saveAccounts(tracked.filter(v=>v!==a))}>Remove</button></p>)}<small>You can view added wallets here. To send or receive, use your connected wallet on the HyperEVM network.</small></details>
      {!!data?.errors.length&&<details className="wallet-details"><summary>Some networks could not be loaded · Retry by refreshing</summary>{data.errors.map(error=><p key={error}>{error}</p>)}</details>}
    </section>
    <section className="wallet-content-card">
      <nav className="wallet-section-tabs" aria-label="Wallet sections">{(['Tokens', 'Trading', 'Activity', 'Watchlist'] as const).map(tab => <button key={tab} aria-pressed={section === tab} onClick={() => setSection(tab)}>{tab}{tab === 'Tokens' && <span>{holdings.length}</span>}</button>)}</nav>
    {section === 'Tokens' && <section className="lending-card wallet-holdings"><div className="wallet-assets-heading"><div><h2>Your tokens</h2><p>Holdings worth $0.01 or more.</p></div><span className="wallet-chain-label">{holdings.length} assets</span></div>
      <div className="wallet-holdings-filters"><input aria-label="Search tokens" type="search" placeholder="Search tokens" value={assetSearch} onChange={e => setAssetSearch(e.target.value)} /><select aria-label="Filter tokens by network" value={network} onChange={e => setNetwork(e.target.value)}><option value="all">All networks</option>{Object.entries({ ...networks, HyperCore: 'HyperCore' }).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
      <div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Asset</th><th>Balance</th><th>Price · USD</th><th>Value · USD</th><th>Allocation</th></tr></thead><tbody>{filteredHoldings.map(asset => <tr key={asset.id}><td><div className="wallet-coin-cell"><TokenIcon symbol={asset.network === 'HyperCore' && asset.symbol === 'Equity' ? 'HYPE' : asset.symbol} logo={asset.logo} preferLogo fallback="icon" size={36}/><div><strong>{asset.name}</strong><small>{asset.symbol} · {networks[asset.network as keyof typeof networks]??asset.network} · {asset.account.slice(0,6)}…</small></div></div></td><td title={asset.balance}>{Number(asset.balance).toLocaleString(undefined,{maximumSignificantDigits:8})}</td><td>{asset.price !== null ? money(asset.price) : '—'}</td><td>{asset.value === null ? '—' : money(asset.value)}</td><td>{total && asset.value !== null ? `${(asset.value/total*100).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>
      {!filteredHoldings.length && <div className="wallet-section-empty">{!accounts.length ? 'Connect or add a wallet to see your assets across networks.' : isLoading ? 'Loading holdings…' : isError ? 'Balances are unavailable. Please reload to retry.' : holdings.length ? 'No tokens match your filters.' : 'No holdings worth $0.01 or more were found.'}</div>}
      <p className="wallet-assets-note">Zero-value tokens, holdings below $0.01, and tokens without an available price are hidden. See your coins across supported networks and your Hyperliquid trading balance together. Trading values estimate 1 USDC as $1. Collectibles, lending balances and other networks are not included yet. Tokens without prices are excluded from this value and chart. If a network fails to load, chart recording pauses until it recovers.</p>
    </section>}
    {section === 'Trading' && <WalletTrading />}
    {section === 'Watchlist' && <MarketWatchlist />}
    {section === 'Activity' && <div className="wallet-activity-panel"><h2>Activity</h2><p>Transfers and transactions for your connected wallet.</p><AlchemyConnection /><EvmActivity /><AlchemyHistory address={address} /></div>}
    </section>
    </div>
    </div>
    <dialog ref={dialogRef} className="wallet-dialog wallet-payment-dialog" aria-labelledby="wallet-payment-title" onCancel={closePayment} onClose={() => { if (paymentMode) closePayment() }}>
      <header><div><h2 id="wallet-payment-title">{paymentMode === 'receive' ? 'Receive' : 'Send'}</h2><small>HyperEVM</small></div><button className="wallet-close" aria-label="Close" onClick={closePayment}>×</button></header>
      {paymentMode && <Suspense fallback={<p role="status">Loading…</p>}><PaymentForm key={`${paymentMode}-${location.hash}`} hash={location.hash} receive={paymentMode === 'receive'} /></Suspense>}
    </dialog>
  </main>
}
