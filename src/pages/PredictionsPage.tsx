import { useState } from 'react'

const CATEGORIES = ['Trending', 'Crypto', 'Macro', 'Politics', 'Sports', 'Tech', 'Culture'] as const
type Category = typeof CATEGORIES[number]

const EVENTS = [
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', endDate: 'Apr 30', category: 'Crypto' as Category, hot: true },
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', endDate: 'Jun 30', category: 'Crypto' as Category, hot: false },
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', endDate: 'May 7', category: 'Macro' as Category, hot: true },
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', endDate: 'Jun 30', category: 'Crypto' as Category, hot: true },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', endDate: 'Dec 31', category: 'Crypto' as Category, hot: false },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', endDate: 'Dec 31', category: 'Macro' as Category, hot: true },
  { id: 7, title: 'Bitcoin ETF inflows exceed $50B?', yesPrice: 0.58, volume: '$1.8M', endDate: 'Dec 31', category: 'Crypto' as Category, hot: false },
  { id: 8, title: 'Hyperliquid top 3 DEX by volume?', yesPrice: 0.76, volume: '$680K', endDate: 'Dec 31', category: 'Crypto' as Category, hot: true },
  { id: 9, title: 'EU passes stablecoin ban?', yesPrice: 0.09, volume: '$420K', endDate: 'Dec 31', category: 'Macro' as Category, hot: false },
  { id: 10, title: 'Trump wins 2028 primary?', yesPrice: 0.41, volume: '$4.5M', endDate: 'Dec 31', category: 'Politics' as Category, hot: true },
  { id: 11, title: 'Apple launches AR glasses in 2026?', yesPrice: 0.33, volume: '$1.1M', endDate: 'Dec 31', category: 'Tech' as Category, hot: false },
  { id: 12, title: 'Lakers make NBA playoffs?', yesPrice: 0.55, volume: '$2.8M', endDate: 'Apr 30', category: 'Sports' as Category, hot: false },
]

const HOT_TOPICS = [
  { title: 'Fed Rate Decision', volume: '$8.2M' },
  { title: 'BTC Price Targets', volume: '$5.4M' },
  { title: 'Trump Tariffs', volume: '$4.1M' },
  { title: 'Hyperliquid TGE', volume: '$3.2M' },
  { title: 'ETH vs SOL', volume: '$2.9M' },
]

export function PredictionsPage() {
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null)
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')

  const filtered = category === 'All' || category === 'Trending'
    ? (category === 'Trending' ? EVENTS.filter(e => e.hot) : EVENTS)
    : EVENTS.filter(e => e.category === category)

  return (
    <div className="pred-page">
      {/* Category bar */}
      <div className="pred-topbar">
        <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => setCategory('All')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="pred-layout">
        {/* Main: card grid */}
        <div className="pred-main">
          <div className="pred-grid">
            {filtered.map(e => (
              <button
                key={e.id}
                className={`pred-card ${selectedEvent?.id === e.id ? 'active' : ''}`}
                onClick={() => { setSelectedEvent(e); setSide('yes') }}
              >
                <div className="pred-card-top">
                  <span className="pred-card-badge">{e.category}</span>
                  {e.hot && <span className="pred-card-hot">Hot</span>}
                </div>
                <div className="pred-card-title">{e.title}</div>
                <div className="pred-card-bar">
                  <div className="pred-card-bar-fill" style={{ width: `${e.yesPrice * 100}%` }} />
                </div>
                <div className="pred-card-prices">
                  <span className="pred-card-yes">Yes {(e.yesPrice * 100).toFixed(0)}c</span>
                  <span className="pred-card-no">No {((1 - e.yesPrice) * 100).toFixed(0)}c</span>
                </div>
                <div className="pred-card-meta">
                  <span>{e.volume} vol</span>
                  <span>Ends {e.endDate}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="pred-sidebar">
          {/* Trade panel when selected */}
          {selectedEvent && (
            <div className="pred-trade-card">
              <div className="pred-trade-title">{selectedEvent.title}</div>
              <div className="protocol-panel-sub">Powered by Outcome</div>

              <div className="trade-side-toggle">
                <button className={`trade-side-btn ${side === 'yes' ? 'active buy' : ''}`} onClick={() => setSide('yes')}>YES {(selectedEvent.yesPrice * 100).toFixed(0)}c</button>
                <button className={`trade-side-btn ${side === 'no' ? 'active sell' : ''}`} onClick={() => setSide('no')}>NO {((1 - selectedEvent.yesPrice) * 100).toFixed(0)}c</button>
              </div>

              <div className="trade-input-group">
                <div className="tp-info-row" style={{ marginBottom: 4 }}>
                  <span>Amount</span>
                  <span>Balance: 0.00 USDC</span>
                </div>
                <div className="trade-input-wrapper">
                  <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
                  <span className="trade-input-unit">USDC</span>
                </div>
              </div>

              <div className="tp-summary">
                <div className="tp-summary-row">
                  <span>Potential payout</span>
                  <span className="green">{amount ? `$${(parseFloat(amount) / (side === 'yes' ? selectedEvent.yesPrice : 1 - selectedEvent.yesPrice)).toFixed(2)}` : '$0.00'}</span>
                </div>
              </div>

              <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className={`trade-submit ${side === 'yes' ? 'buy' : 'sell'}`} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                Buy {side.toUpperCase()} on Outcome
              </a>
            </div>
          )}

          {/* Hot topics */}
          <div className="pred-hot-card">
            <div className="pred-hot-title">Hot Topics</div>
            {HOT_TOPICS.map((t, i) => (
              <div key={i} className="pred-hot-row">
                <span className="pred-hot-rank">{i + 1}</span>
                <span className="pred-hot-name">{t.title}</span>
                <span className="pred-hot-vol">{t.volume}</span>
              </div>
            ))}
          </div>

          {/* Trending markets */}
          <div className="pred-hot-card">
            <div className="pred-hot-title">Top Movers</div>
            {EVENTS.filter(e => e.hot).slice(0, 4).map(e => (
              <button key={e.id} className="pred-mover-row" onClick={() => { setSelectedEvent(e); setSide('yes') }}>
                <span className="pred-mover-name">{e.title.slice(0, 30)}{e.title.length > 30 ? '...' : ''}</span>
                <span className={e.yesPrice >= 0.5 ? 'green' : 'red'}>{(e.yesPrice * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
