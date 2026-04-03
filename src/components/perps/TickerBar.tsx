import { useMarketMeta } from '../../hooks/useMarketMeta'
import { useMarket } from '../../contexts/MarketContext'
import { formatPrice } from '../../lib/format'

export function TickerBar() {
  const { markets } = useMarketMeta()
  const { setSelectedMarket } = useMarket()

  // Show top 20 markets by volume
  const top = [...markets]
    .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
    .slice(0, 20)

  if (top.length === 0) return null

  return (
    <div className="ticker-bar">
      {top.map(m => {
        const change = m.change24h
        const cls = change >= 0 ? 'ticker-green' : 'ticker-red'
        return (
          <button
            key={m.name}
            className="ticker-item"
            onClick={() => setSelectedMarket(m.name)}
          >
            <span className="ticker-coin">{m.name}</span>
            <span className="ticker-price">${formatPrice(m.midPrice)}</span>
            <span className={`ticker-change ${cls}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
