import { useState } from 'react'
import { useFavorites } from '../hooks/useFavorites'
import { useMarketMeta } from '../hooks/useMarketMeta'
import { useWalletPrices } from '../hooks/useWalletPrices'
import { useMarket } from '../contexts/MarketContext'
import { WalletHistory } from '../components/WalletHistory'
import './WalletPage.css'
import { TokenIcon } from '../components/TokenIcon'
import { AlchemyConnection } from '../components/shared/AlchemyConnection'
import { AlchemyHistory } from '../components/shared/AlchemyHistory'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useEvmBalances } from '../hooks/useEvmBalances'
import { ConnectButton } from '../components/shared/ConnectButton'
import { EvmActivity } from '../components/shared/EvmActivity'

const walletAssets = [{symbol:'HYPE',name:'Hyperliquid',type:'Native asset'}, {symbol:'USDC',name:'USD Coin',type:'Stablecoin'}, {symbol:'USDT0',name:'USDT0',type:'Stablecoin'}, {symbol:'USDH',name:'USDH',type:'Stablecoin'}, {symbol:'WHYPE',name:'Wrapped HYPE',type:'Wrapped'}]

export function WalletPage() {
  const { address, isConnected } = useAccount()
  const { balances, isLoading, isError } = useEvmBalances()
  const { data: prices = {}, isError: priceError } = useWalletPrices()
  const { markets, loading: marketsLoading, error: marketsError } = useMarketMeta()
  const { favorites, toggleFav } = useFavorites()
  const { setSelectedMarket } = useMarket()
  const [search, setSearch] = useState('')
  const holdings = balances.map(asset => ({ ...asset, value: prices[asset.symbol] ? Number(asset.balance) * prices[asset.symbol] : null }))
  const incomplete = isError || priceError || holdings.some(asset => asset.value === null)
  const total = isConnected && !isLoading && !incomplete ? holdings.reduce((sum, asset) => sum + (asset.value ?? 0), 0) : null
  const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const watched = search.trim() ? markets.filter(m => m.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0,20) : markets.filter(m => favorites.has(m.name))
  return <main className="lending-page payments-page mobile-wallet-page oslo-wallet-home wallet-portfolio-home">
    <header className="payment-hero"><div><span className="payment-eyebrow">YOUR OSLO</span><h1>Portfolio</h1></div><span className="payment-network">HyperEVM wallet</span></header>
    <section className="lending-card wallet-summary">
      <div className="wallet-overview-top"><div><span className="wallet-total-label">Estimated portfolio value</span><strong className="wallet-total">{total === null ? '—' : money(total)} <small>USDC</small></strong><p>{!isConnected ? 'Connect your wallet to get started.' : isLoading ? 'Loading your holdings…' : incomplete ? 'Some balances or prices are unavailable.' : `${holdings.length} assets in your wallet`}</p></div>
      <div className="wallet-quick-actions"><Link to="/payments"><span aria-hidden="true">↗</span>Send</Link><Link to="/payments?mode=receive"><span aria-hidden="true">↙</span>Receive</Link><Link to="/spot"><span aria-hidden="true">⇄</span>Swap</Link><Link to="/lending"><span aria-hidden="true">＋</span>Lend</Link></div></div>
      {!isConnected && <ConnectButton />}
      <WalletHistory address={address} value={total} />
    </section>
    <section className="lending-card wallet-holdings"><div className="wallet-assets-heading"><div><h2>Holdings</h2><p>The assets you own, at a glance.</p></div><span className="wallet-chain-label">{holdings.length} assets</span></div>
      <div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Asset</th><th>Balance</th><th>Price · USDC</th><th>Value · USDC</th><th>Allocation</th></tr></thead><tbody>{holdings.map(asset => <tr key={asset.symbol}><td><div className="wallet-coin-cell"><TokenIcon symbol={asset.symbol} size={36}/><div><strong>{walletAssets.find(a=>a.symbol===asset.symbol)?.name ?? asset.symbol}</strong><small>{asset.symbol}</small></div></div></td><td title={asset.balance}>{Number(asset.balance).toLocaleString(undefined,{maximumSignificantDigits:8})}</td><td>{prices[asset.symbol] ? money(prices[asset.symbol]) : '—'}</td><td>{asset.value === null ? '—' : money(asset.value)}</td><td>{total && asset.value !== null ? `${(asset.value/total*100).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>
      {!holdings.length && <div className="wallet-section-empty">{!isConnected ? 'Connect your wallet to see the coins you hold.' : isLoading ? 'Loading holdings…' : isError ? 'Balances are unavailable. Please reload to retry.' : 'No supported assets in this wallet yet.'}</div>}
      <p className="wallet-assets-note">Supported HyperEVM tokens only. Prices use Hyperliquid spot quotes; WHYPE uses HYPE’s price. Lending and HyperCore balances are separate.</p>
    </section>
    <section className="lending-card wallet-watchlist"><div className="wallet-assets-heading"><div><h2>Watchlist <span className="wallet-star-accent">★</span></h2><p>Your starred coins. Keep your next move in view.</p></div><label className="wallet-watch-search"><input aria-label="Find a coin to follow" placeholder="Search coins to follow…" value={search} onChange={event=>setSearch(event.target.value)}/></label></div>
      <div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Coin</th><th>Price · USDC</th><th>24h change</th><th>Follow</th></tr></thead><tbody>{watched.map(m=><tr key={m.name}><td><Link className="wallet-coin-cell" to="/perps" onClick={()=>setSelectedMarket(m.name)}><TokenIcon symbol={m.name} size={32}/><strong>{m.name}</strong></Link></td><td>{Number(m.midPrice)>0 ? money(Number(m.midPrice)) : '—'}</td><td className={m.change24h>=0 ? 'wallet-price-up' : 'wallet-price-down'}>{m.change24h>=0?'+':''}{m.change24h.toFixed(2)}%</td><td><button className="wallet-star-button" aria-label={`${favorites.has(m.name)?'Unfollow':'Follow'} ${m.name}`} aria-pressed={favorites.has(m.name)} onClick={()=>toggleFav(m.name)}>{favorites.has(m.name)?'★':'☆'}</button></td></tr>)}</tbody></table></div>
      {!watched.length && <div className="wallet-section-empty">{marketsLoading ? 'Loading markets…' : marketsError ? 'Market prices are unavailable. Please try again shortly.' : search ? 'No matching coins.' : 'Star coins in the trading screen or search above to build your watchlist.'}</div>}
      <p className="wallet-assets-note">Hyperliquid perpetual market prices. Stars sync with your trading watchlist in this browser.</p>
    </section>
    <details className="wallet-details"><summary>Activity and connection details</summary><AlchemyConnection /><EvmActivity /><AlchemyHistory address={address} /></details>
  </main>
}
