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
  const [accountInput,setAccountInput]=useState('')
  const [accountError,setAccountError]=useState('')
  const accounts=[...new Set([...(address?[normalizeAccount(address)]:[]),...tracked.map(normalizeAccount)])].sort()
  const {data,isLoading,isError}=useUnifiedPortfolio(accounts)
  const assets=data?.assets??[]
  const holdings=visibleHoldings(assets)
  const incomplete=isError||!!data?.errors.length||assets.some(a=>a.value===null)
  const total=accounts.length&&!isLoading&&data&&!incomplete?assets.reduce((sum,a)=>sum+(a.value??0),0):null
  const saveAccounts=(next:string[])=>{setTracked(next);try{localStorage.setItem('oslo-tracked-accounts',JSON.stringify(next))}catch{setAccountError('Saved for this session only.')}}
  const addAccount=()=>{const value=accountInput.trim();if(!validAccount(value)){setAccountError('Enter a valid Ethereum or Solana wallet address.');return}saveAccounts([...new Set([...tracked,normalizeAccount(value)])]);setAccountInput('');setAccountError('')}
  const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <main className="lending-page payments-page mobile-wallet-page oslo-wallet-home wallet-portfolio-home">
    <header className="payment-hero"><div><span className="payment-eyebrow">YOUR OSLO</span><h1>Portfolio</h1><p>One place for your digital assets.</p></div></header>
    <section className="lending-card wallet-summary">
      <div className="wallet-overview-top"><div><span className="wallet-total-label">Estimated portfolio value</span><strong className="wallet-total">{total === null ? '—' : money(total)} <small>USD</small></strong><p>{!accounts.length ? 'Connect a wallet or add a public address.' : isLoading ? 'Loading your holdings…' : incomplete ? 'Some balances or prices are unavailable.' : `${holdings.length} assets in your wallet`}</p></div>
      <div className="wallet-quick-actions"><Link to="/wallet?action=send"><span aria-hidden="true">↗</span>Send</Link><Link to="/wallet?action=receive"><span aria-hidden="true">↙</span>Receive</Link><Link to="/spot"><span aria-hidden="true">⇄</span>Swap</Link><Link to="/lending"><span aria-hidden="true">＋</span>Lend</Link></div></div>
      {!isConnected && <ConnectButton />}
      <WalletHistory address={accounts.length?`multi-usd-v1:${accounts.join('|')}`:undefined} value={total} />
      <details className="wallet-details"><summary>Wallets and networks · {accounts.length} accounts</summary><p>Track Ethereum, Base, Arbitrum, Optimism, Polygon, HyperEVM, HyperCore and Solana together.</p><form onSubmit={e=>{e.preventDefault();addAccount()}} className="wallet-account-form"><input aria-label="Public wallet address" placeholder="Paste your wallet address" value={accountInput} onChange={e=>setAccountInput(e.target.value)} /><button type="submit">Add wallet</button></form>{accountError&&<p role="alert">{accountError}</p>}{tracked.map(a=><p key={a}><code>{a}</code> <button onClick={()=>saveAccounts(tracked.filter(v=>v!==a))}>Remove</button></p>)}<small>You can view added wallets here. To send or receive, use your connected wallet on the HyperEVM network.</small></details>
      {!!data?.errors.length&&<details className="wallet-details"><summary>Some networks could not be loaded · Retry by refreshing</summary>{data.errors.map(error=><p key={error}>{error}</p>)}</details>}
    </section>
    <section className="lending-card wallet-holdings"><div className="wallet-assets-heading"><div><h2>Holdings</h2><p>Holdings worth $0.01 or more.</p></div><span className="wallet-chain-label">{holdings.length} assets</span></div>
      <div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Asset</th><th>Balance</th><th>Price · USD</th><th>Value · USD</th><th>Allocation</th></tr></thead><tbody>{holdings.map(asset => <tr key={asset.id}><td><div className="wallet-coin-cell"><TokenIcon symbol={asset.symbol} logo={asset.logo} size={36}/><div><strong>{asset.name}</strong><small>{asset.symbol} · {networks[asset.network as keyof typeof networks]??asset.network} · {asset.account.slice(0,6)}…</small></div></div></td><td title={asset.balance}>{Number(asset.balance).toLocaleString(undefined,{maximumSignificantDigits:8})}</td><td>{asset.price !== null ? money(asset.price) : '—'}</td><td>{asset.value === null ? '—' : money(asset.value)}</td><td>{total && asset.value !== null ? `${(asset.value/total*100).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>
      {!holdings.length && <div className="wallet-section-empty">{!accounts.length ? 'Connect or add a wallet to see your assets across networks.' : isLoading ? 'Loading holdings…' : isError ? 'Balances are unavailable. Please reload to retry.' : 'No holdings worth $0.01 or more were found.'}</div>}
      <p className="wallet-assets-note">Zero-value tokens, holdings below $0.01, and tokens without an available price are hidden. See your coins across supported networks and your Hyperliquid trading balance together. Trading values estimate 1 USDC as $1. Collectibles, lending balances and other networks are not included yet. If a balance or price is missing, your total and chart wait for it to return.</p>
    </section>
    <MarketWatchlist />
    <details className="wallet-details"><summary>Activity and connection</summary><AlchemyConnection /><EvmActivity /><AlchemyHistory address={address} /></details>
    <dialog ref={dialogRef} className="wallet-dialog wallet-payment-dialog" aria-labelledby="wallet-payment-title" onCancel={closePayment} onClose={() => { if (paymentMode) closePayment() }}>
      <header><div><h2 id="wallet-payment-title">{paymentMode === 'receive' ? 'Receive' : 'Send'}</h2><small>HyperEVM</small></div><button className="wallet-close" aria-label="Close" onClick={closePayment}>×</button></header>
      {paymentMode && <Suspense fallback={<p role="status">Loading…</p>}><PaymentForm key={`${paymentMode}-${location.hash}`} hash={location.hash} receive={paymentMode === 'receive'} /></Suspense>}
    </dialog>
  </main>
}
