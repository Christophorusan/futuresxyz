import { MarketWatchlist } from '../components/MarketWatchlist'
import { useEffect, useRef, lazy, Suspense } from 'react'
import { useWalletPrices } from '../hooks/useWalletPrices'
import { WalletHistory } from '../components/WalletHistory'
import './WalletPage.css'
import { TokenIcon } from '../components/TokenIcon'
import { AlchemyConnection } from '../components/shared/AlchemyConnection'
import { AlchemyHistory } from '../components/shared/AlchemyHistory'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useEvmBalances } from '../hooks/useEvmBalances'
import { ConnectButton } from '../components/shared/ConnectButton'
import { EvmActivity } from '../components/shared/EvmActivity'

const PaymentForm = lazy(() => import('../components/PaymentForm').then(m => ({ default: m.PaymentForm })))

const walletAssets = [{symbol:'HYPE',name:'Hyperliquid',type:'Native asset'}, {symbol:'USDC',name:'USD Coin',type:'Stablecoin'}, {symbol:'USDT0',name:'USDT0',type:'Stablecoin'}, {symbol:'USDH',name:'USDH',type:'Stablecoin'}, {symbol:'WHYPE',name:'Wrapped HYPE',type:'Wrapped'}]

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
  const { balances, isLoading, isError } = useEvmBalances()
  const { data: prices = {}, isError: priceError } = useWalletPrices()
  const holdings = balances.map(asset => ({ ...asset, value: prices[asset.symbol] ? Number(asset.balance) * prices[asset.symbol] : null }))
  const incomplete = isError || priceError || holdings.some(asset => asset.value === null)
  const total = isConnected && !isLoading && !incomplete ? holdings.reduce((sum, asset) => sum + (asset.value ?? 0), 0) : null
  const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <main className="lending-page payments-page mobile-wallet-page oslo-wallet-home wallet-portfolio-home">
    <header className="payment-hero"><div><span className="payment-eyebrow">YOUR OSLO</span><h1>Portfolio</h1></div><span className="payment-network">HyperEVM wallet</span></header>
    <section className="lending-card wallet-summary">
      <div className="wallet-overview-top"><div><span className="wallet-total-label">Estimated portfolio value</span><strong className="wallet-total">{total === null ? '—' : money(total)} <small>USDC</small></strong><p>{!isConnected ? 'Connect your wallet to get started.' : isLoading ? 'Loading your holdings…' : incomplete ? 'Some balances or prices are unavailable.' : `${holdings.length} assets in your wallet`}</p></div>
      <div className="wallet-quick-actions"><Link to="/wallet?action=send"><span aria-hidden="true">↗</span>Send</Link><Link to="/wallet?action=receive"><span aria-hidden="true">↙</span>Receive</Link><Link to="/spot"><span aria-hidden="true">⇄</span>Swap</Link><Link to="/lending"><span aria-hidden="true">＋</span>Lend</Link></div></div>
      {!isConnected && <ConnectButton />}
      <WalletHistory address={address} value={total} />
    </section>
    <section className="lending-card wallet-holdings"><div className="wallet-assets-heading"><div><h2>Holdings</h2><p>The assets you own, at a glance.</p></div><span className="wallet-chain-label">{holdings.length} assets</span></div>
      <div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Asset</th><th>Balance</th><th>Price · USDC</th><th>Value · USDC</th><th>Allocation</th></tr></thead><tbody>{holdings.map(asset => <tr key={asset.symbol}><td><div className="wallet-coin-cell"><TokenIcon symbol={asset.symbol} size={36}/><div><strong>{walletAssets.find(a=>a.symbol===asset.symbol)?.name ?? asset.symbol}</strong><small>{asset.symbol}</small></div></div></td><td title={asset.balance}>{Number(asset.balance).toLocaleString(undefined,{maximumSignificantDigits:8})}</td><td>{prices[asset.symbol] ? money(prices[asset.symbol]) : '—'}</td><td>{asset.value === null ? '—' : money(asset.value)}</td><td>{total && asset.value !== null ? `${(asset.value/total*100).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>
      {!holdings.length && <div className="wallet-section-empty">{!isConnected ? 'Connect your wallet to see the coins you hold.' : isLoading ? 'Loading holdings…' : isError ? 'Balances are unavailable. Please reload to retry.' : 'No supported assets in this wallet yet.'}</div>}
      <p className="wallet-assets-note">Supported HyperEVM tokens only. Prices use Hyperliquid spot quotes; WHYPE uses HYPE’s price. Lending and HyperCore balances are separate.</p>
    </section>
    <MarketWatchlist />
    <details className="wallet-details"><summary>Activity and connection details</summary><AlchemyConnection /><EvmActivity /><AlchemyHistory address={address} /></details>
    <dialog ref={dialogRef} className="wallet-dialog wallet-payment-dialog" aria-labelledby="wallet-payment-title" onCancel={closePayment} onClose={() => { if (paymentMode) closePayment() }}>
      <header><div><h2 id="wallet-payment-title">{paymentMode === 'receive' ? 'Receive' : 'Send'}</h2><small>HyperEVM</small></div><button className="wallet-close" aria-label="Close" onClick={closePayment}>×</button></header>
      {paymentMode && <Suspense fallback={<p role="status">Loading…</p>}><PaymentForm key={`${paymentMode}-${location.hash}`} hash={location.hash} receive={paymentMode === 'receive'} /></Suspense>}
    </dialog>
  </main>
}
