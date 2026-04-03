import { useMarket } from '../../contexts/MarketContext'
import { useMarketStats } from '../../hooks/useMarketStats'
import { useFundingCountdown } from '../../hooks/useFundingCountdown'
import { MarketSelector } from './MarketSelector'
import { formatPrice, formatUsd } from '../../lib/format'

export function MarketHeader() {
  const { selectedMarket } = useMarket()
  const stats = useMarketStats(selectedMarket)
  const countdown = useFundingCountdown()

  const change = stats?.change24h ?? 0
  const changeClass = change >= 0 ? 'stat-green' : 'stat-red'
  const fundingRate = stats ? (parseFloat(stats.fundingRate) * 100).toFixed(4) : '—'
  const fundingClass = stats && parseFloat(stats.fundingRate) >= 0 ? 'stat-green' : 'stat-red'

  return (
    <div className="market-header">
      <MarketSelector />

      <div className="market-stats">
        <div className="market-stat">
          <span className="market-stat-label">Mark</span>
          <span className="market-stat-value">{stats ? `$${formatPrice(stats.markPx)}` : '—'}</span>
        </div>
        <div className="market-stat">
          <span className="market-stat-label">24h Change</span>
          <span className={`market-stat-value ${changeClass}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
        <div className="market-stat">
          <span className="market-stat-label">Funding / Countdown</span>
          <span className={`market-stat-value ${fundingClass}`}>
            {fundingRate}%{' '}
            <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '11px' }}>{countdown}</span>
          </span>
        </div>
        <div className="market-stat">
          <span className="market-stat-label">24h Volume</span>
          <span className="market-stat-value">{stats ? formatUsd(stats.volume24h) : '—'}</span>
        </div>
        <div className="market-stat">
          <span className="market-stat-label">Open Interest</span>
          <span className="market-stat-value">{stats ? formatUsd(stats.openInterest) : '—'}</span>
        </div>
      </div>
    </div>
  )
}
