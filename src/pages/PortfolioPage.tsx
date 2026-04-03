import { useAccount } from 'wagmi'
import { useUserState } from '../hooks/useUserState'
import { useAccountData } from '../hooks/useAccountData'
import { useMarket } from '../contexts/MarketContext'
import { formatPrice, formatUsd, formatPct } from '../lib/format'

export function PortfolioPage() {
  const { isConnected } = useAccount()
  const { state } = useUserState()
  const { spotBalances, fills } = useAccountData()
  const { setSelectedMarket } = useMarket()

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="page-empty">Connect wallet to view portfolio</div>
      </div>
    )
  }

  const totalPnl = state?.positions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0) ?? 0

  return (
    <div className="page-container portfolio-page">
      <h2 className="page-title">Portfolio</h2>

      {/* Account Overview */}
      <div className="portfolio-cards">
        <div className="portfolio-card">
          <span className="portfolio-card-label">Total Balance</span>
          <span className="portfolio-card-value">{state ? formatUsd(state.totalBalance) : '$0.00'}</span>
        </div>
        <div className="portfolio-card">
          <span className="portfolio-card-label">Account Equity</span>
          <span className="portfolio-card-value">{state ? formatUsd(state.accountValue) : '$0.00'}</span>
        </div>
        <div className="portfolio-card">
          <span className="portfolio-card-label">Unrealized PnL</span>
          <span className={`portfolio-card-value ${totalPnl >= 0 ? 'green' : 'red'}`}>
            {formatUsd(totalPnl)}
          </span>
        </div>
        <div className="portfolio-card">
          <span className="portfolio-card-label">Margin Used</span>
          <span className="portfolio-card-value">{state ? formatUsd(state.totalMarginUsed) : '$0.00'}</span>
        </div>
      </div>

      {/* Open Positions */}
      <div className="portfolio-section">
        <h3 className="portfolio-section-title">Open Positions ({state?.positions.length ?? 0})</h3>
        {state?.positions.length ? (
          <div className="portfolio-table">
            <div className="portfolio-row portfolio-row-header">
              <span>Market</span>
              <span>Side</span>
              <span>Size</span>
              <span>Entry</span>
              <span>Mark</span>
              <span>PnL</span>
              <span>ROE%</span>
            </div>
            {state.positions.map(pos => {
              const pnl = parseFloat(pos.unrealizedPnl)
              const isLong = parseFloat(pos.szi) > 0
              return (
                <div
                  key={pos.coin}
                  className="portfolio-row portfolio-row-clickable"
                  onClick={() => setSelectedMarket(pos.coin)}
                >
                  <span className="pos-name">{pos.coin}-PERP</span>
                  <span className={isLong ? 'green' : 'red'}>{isLong ? 'Long' : 'Short'} {pos.leverage.value}x</span>
                  <span>{Math.abs(parseFloat(pos.szi)).toFixed(4)}</span>
                  <span>${formatPrice(pos.entryPx)}</span>
                  <span>{formatUsd(pos.positionValue)}</span>
                  <span className={pnl >= 0 ? 'green' : 'red'}>{formatUsd(pnl)}</span>
                  <span className={pnl >= 0 ? 'green' : 'red'}>{formatPct(parseFloat(pos.returnOnEquity) * 100)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="portfolio-empty">No open positions</div>
        )}
      </div>

      {/* Balances */}
      <div className="portfolio-section">
        <h3 className="portfolio-section-title">Balances ({spotBalances.length})</h3>
        {spotBalances.length ? (
          <div className="portfolio-table">
            <div className="portfolio-row portfolio-row-header">
              <span>Asset</span>
              <span>Balance</span>
              <span>Available</span>
              <span>Value</span>
            </div>
            {spotBalances.map(b => (
              <div key={b.coin} className="portfolio-row">
                <span className="pos-name">{b.coin}</span>
                <span>{parseFloat(b.total).toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
                <span>{parseFloat(b.available).toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
                <span>${parseFloat(b.usdValue).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="portfolio-empty">No balances</div>
        )}
      </div>

      {/* Recent Fills */}
      <div className="portfolio-section">
        <h3 className="portfolio-section-title">Recent Trades</h3>
        {fills.length ? (
          <div className="portfolio-table">
            <div className="portfolio-row portfolio-row-header">
              <span>Time</span>
              <span>Market</span>
              <span>Side</span>
              <span>Price</span>
              <span>Size</span>
              <span>Fee</span>
            </div>
            {fills.slice(0, 20).map((f, i) => {
              const isBuy = f.side === 'B' || f.side === 'Buy'
              return (
                <div key={`${f.oid}-${i}`} className="portfolio-row">
                  <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>{new Date(f.time).toLocaleString()}</span>
                  <span className="pos-name">{f.coin}</span>
                  <span className={isBuy ? 'green' : 'red'}>{isBuy ? 'Buy' : 'Sell'}</span>
                  <span>${formatPrice(f.px)}</span>
                  <span>{f.sz}</span>
                  <span style={{ color: 'var(--text-3)' }}>${parseFloat(f.fee).toFixed(4)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="portfolio-empty">No recent trades</div>
        )}
      </div>
    </div>
  )
}
