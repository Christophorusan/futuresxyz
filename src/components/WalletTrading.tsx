import { AssetLabel } from './AssetLabel'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { useMarket } from '../contexts/MarketContext'
import { formatPrice, formatUsd, formatPct } from '../lib/format'

export function WalletTrading() {
  const { info, address, isConnected } = useHyperliquid()
  const { setSelectedMarket } = useMarket()
  const positions = useQuery({ queryKey: ['wallet-trading', address], enabled: !!address && isConnected, queryFn: () => info.clearinghouseState({ user: address! }), refetchInterval: 15000 })
  const trades = useQuery({ queryKey: ['wallet-trades', address], enabled: !!address && isConnected, queryFn: () => info.userFills({ user: address! }), refetchInterval: 30000 })
  const state = positions.data
  const open = state?.assetPositions.map(item => item.position).filter(p => Number(p.szi) !== 0) ?? []
  const equity = Number(state?.marginSummary.accountValue)
  const leverage = equity > 0 ? Number(state?.marginSummary.totalNtlPos) / equity : null
  return <section className="lending-card wallet-trading">
    <div className="wallet-assets-heading"><div><h2>Trading overview</h2><p>Hyperliquid positions and recent trades · Connected wallet only</p></div><Link to="/perps">Open trading →</Link></div>
    {!isConnected ? <p className="wallet-section-empty">Connect your wallet to see positions, trading equity, and recent trades here.</p> : <>
      <p className="wallet-assets-note">These trading details are separate views of your account, not extra amounts to add to the wallet total above.</p>
      {positions.isError && <p role="alert">Trading positions could not be refreshed. {state ? 'Previously loaded data may be out of date.' : ''} <button onClick={() => positions.refetch()}>Retry</button></p>}
      {positions.isPending && <p role="status">Loading trading positions…</p>}
      {state && <><div className="wallet-trading-stats"><div><span>Trading equity</span><strong>{formatUsd(state.marginSummary.accountValue)}</strong></div><div><span>Unrealized PnL</span><strong>{formatUsd(open.reduce((sum,p) => sum + Number(p.unrealizedPnl),0))}</strong></div><div><span>Margin used</span><strong>{formatUsd(state.marginSummary.totalMarginUsed)}</strong></div><div><span>Account leverage</span><strong>{leverage === null || !Number.isFinite(leverage) ? '—' : `${leverage.toFixed(2)}×`}</strong></div></div>
      <h3>Open positions · {open.length}</h3><div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Market</th><th>Side</th><th>Size</th><th>Entry</th><th>Unrealized PnL</th><th>Return on equity</th></tr></thead><tbody>{open.map(p => <tr key={p.coin}><td><Link to="/perps" onClick={() => setSelectedMarket(p.coin)}><AssetLabel symbol={p.coin} /></Link></td><td>{Number(p.szi)>0 ? 'Long' : 'Short'} · {p.leverage.value}×</td><td>{Math.abs(Number(p.szi)).toLocaleString(undefined,{maximumFractionDigits:6})}</td><td>{p.entryPx ? `$${formatPrice(p.entryPx)}` : '—'}</td><td className={Number(p.unrealizedPnl)>=0?'green':'red'}>{formatUsd(p.unrealizedPnl)}</td><td>{formatPct(Number(p.returnOnEquity)*100)}</td></tr>)}</tbody></table></div>{!open.length && <p className="wallet-section-empty">No open positions.</p>}</>}
      <details className="wallet-details"><summary>Recent trades{trades.data ? ` · ${Math.min(trades.data.length,15)}` : ''}</summary>
      {trades.isPending && <p role="status">Loading recent trades…</p>}{trades.isError && <p role="alert">Recent trades could not be refreshed. <button onClick={() => trades.refetch()}>Retry</button></p>}
      {trades.data && <div className="wallet-table-scroll"><table className="wallet-portfolio-table"><thead><tr><th>Time</th><th>Market</th><th>Side</th><th>Price</th><th>Size</th><th>Fee</th></tr></thead><tbody>{trades.data.slice(0,15).map((f,i) => <tr key={`${f.oid}-${i}`}><td>{new Date(f.time).toLocaleString()}</td><td><AssetLabel symbol={f.coin} /></td><td>{f.side==='B'?'Buy':'Sell'}</td><td>${formatPrice(f.px)}</td><td>{f.sz}</td><td>{f.fee} {f.feeToken}</td></tr>)}</tbody></table>{!trades.data.length && <p>No recent trades.</p>}</div>}
      </details>
    </>}
  </section>
}
