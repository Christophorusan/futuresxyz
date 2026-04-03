import { useState, useMemo } from 'react'
import { useSpotMarkets, type SpotMarket } from '../hooks/useSpotMarkets'
import { formatPrice } from '../lib/format'

function formatVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${Math.round(v / 1e6)}M`
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`
  if (v > 0) return `$${v.toFixed(0)}`
  return '$0'
}

function SpotMarketList({ markets, selected, onSelect, search, setSearch }: {
  markets: SpotMarket[]; selected: string; onSelect: (name: string) => void
  search: string; setSearch: (s: string) => void
}) {
  return (
    <div className="spot-sidebar">
      <div className="spot-search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input className="spot-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="spot-list-header">
        <span>Token</span>
        <span>Price</span>
        <span>24h</span>
      </div>
      <div className="spot-list-body">
        {markets.map(m => (
          <button
            key={m.name}
            className={`spot-list-row ${m.baseToken === selected ? 'active' : ''}`}
            onClick={() => onSelect(m.baseToken)}
          >
            <span className="spot-list-name">{m.baseToken}</span>
            <span className="spot-list-price">${formatPrice(m.markPx)}</span>
            <span className={m.change24h >= 0 ? 'green' : 'red'}>
              {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function SpotPage() {
  const { markets, loading } = useSpotMarkets()
  const [search, setSearch] = useState('')
  const [selectedToken, setSelectedToken] = useState('HYPE')

  const filtered = useMemo(() => {
    return markets
      .filter(m => {
        const q = search.toLowerCase()
        return m.baseToken.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
      })
      .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
  }, [markets, search])

  const selected = markets.find(m => m.baseToken === selectedToken) ?? filtered[0]

  if (loading) {
    return <div className="spot-page"><div className="spot-loading">Loading spot markets...</div></div>
  }

  return (
    <div className="spot-page">
      {/* Left sidebar: market list */}
      <SpotMarketList
        markets={filtered}
        selected={selectedToken}
        onSelect={setSelectedToken}
        search={search}
        setSearch={setSearch}
      />

      {/* Main content */}
      <div className="spot-main">
        {/* Market header */}
        {selected && (
          <div className="spot-market-header">
            <div className="spot-market-name-lg">
              <span className="spot-market-base">{selected.baseToken}</span>
              <span className="spot-market-quote">/{selected.quoteToken}</span>
            </div>
            <div className="spot-market-stats">
              <div className="spot-stat">
                <span className="spot-stat-label">Price</span>
                <span className="spot-stat-value">${formatPrice(selected.markPx)}</span>
              </div>
              <div className="spot-stat">
                <span className="spot-stat-label">24h Change</span>
                <span className={`spot-stat-value ${selected.change24h >= 0 ? 'green' : 'red'}`}>
                  {selected.change24h >= 0 ? '+' : ''}{selected.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="spot-stat">
                <span className="spot-stat-label">24h Volume</span>
                <span className="spot-stat-value">{formatVol(parseFloat(selected.volume24h))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Top movers */}
        <div className="spot-section">
          <h3 className="spot-section-title">Top Movers</h3>
          <div className="spot-movers">
            {markets
              .filter(m => parseFloat(m.volume24h) > 1000)
              .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
              .slice(0, 8)
              .map(m => (
                <button
                  key={m.name}
                  className="spot-mover-card"
                  onClick={() => setSelectedToken(m.baseToken)}
                >
                  <span className="spot-mover-name">{m.baseToken}</span>
                  <span className="spot-mover-price">${formatPrice(m.markPx)}</span>
                  <span className={`spot-mover-change ${m.change24h >= 0 ? 'green' : 'red'}`}>
                    {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(1)}%
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Volume leaders table */}
        <div className="spot-section">
          <h3 className="spot-section-title">Volume Leaders</h3>
          <div className="spot-table">
            <div className="spot-row spot-row-header">
              <span className="spot-col">Token</span>
              <span className="spot-col spot-col-right">Price</span>
              <span className="spot-col spot-col-right">24h Change</span>
              <span className="spot-col spot-col-right">24h Volume</span>
            </div>
            <div className="spot-table-body">
              {markets
                .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
                .slice(0, 30)
                .map(m => (
                  <button
                    key={m.name}
                    className={`spot-row spot-row-clickable ${m.baseToken === selectedToken ? 'spot-row-active' : ''}`}
                    onClick={() => setSelectedToken(m.baseToken)}
                  >
                    <span className="spot-token">
                      <span className="spot-token-name">{m.baseToken}</span>
                      <span className="spot-token-pair">/{m.quoteToken}</span>
                    </span>
                    <span className="spot-col-right spot-price">${formatPrice(m.markPx)}</span>
                    <span className={`spot-col-right ${m.change24h >= 0 ? 'green' : 'red'}`}>
                      {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                    </span>
                    <span className="spot-col-right spot-volume">{formatVol(parseFloat(m.volume24h))}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
