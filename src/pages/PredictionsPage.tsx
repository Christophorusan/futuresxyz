import { useState } from 'react'

const CATEGORIES = ['Trending', 'Crypto', 'Macro', 'Politics', 'Sports', 'Tech', 'Culture'] as const
type Category = typeof CATEGORIES[number]

interface Market {
  id: number
  title: string
  yesPrice: number
  volume: string
  endDate: string
  category: Category
  hot: boolean
  outcomes?: { label: string; price: number; volume: string; change?: string }[]
}

const EVENTS: Market[] = [
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', endDate: 'Apr 30', category: 'Crypto', hot: true,
    outcomes: [
      { label: '$80k', price: 0.18, volume: '$420K', change: '+5%' },
      { label: '$75k', price: 0.38, volume: '$680K', change: '+12%' },
      { label: '$70k', price: 0.62, volume: '$1.2M', change: '+8%' },
      { label: '$65k', price: 0.85, volume: '$340K', change: '-3%' },
    ]},
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', endDate: 'Jun 30', category: 'Crypto', hot: false },
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', endDate: 'May 7', category: 'Macro', hot: true,
    outcomes: [
      { label: '50bp cut', price: 0.12, volume: '$180K' },
      { label: '25bp cut', price: 0.59, volume: '$1.8M', change: '+4%' },
      { label: 'No change', price: 0.24, volume: '$920K', change: '-2%' },
      { label: 'Rate hike', price: 0.05, volume: '$90K' },
    ]},
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', endDate: 'Jun 30', category: 'Crypto', hot: true },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', endDate: 'Dec 31', category: 'Macro', hot: true },
  { id: 7, title: 'Bitcoin ETF inflows exceed $50B?', yesPrice: 0.58, volume: '$1.8M', endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 8, title: 'Hyperliquid top 3 DEX by volume?', yesPrice: 0.76, volume: '$680K', endDate: 'Dec 31', category: 'Crypto', hot: true },
  { id: 9, title: 'EU passes stablecoin ban?', yesPrice: 0.09, volume: '$420K', endDate: 'Dec 31', category: 'Macro', hot: false },
  { id: 10, title: 'Trump wins 2028 primary?', yesPrice: 0.41, volume: '$4.5M', endDate: 'Dec 31', category: 'Politics', hot: true },
  { id: 11, title: 'Apple launches AR glasses in 2026?', yesPrice: 0.33, volume: '$1.1M', endDate: 'Dec 31', category: 'Tech', hot: false },
  { id: 12, title: 'Lakers make NBA playoffs?', yesPrice: 0.55, volume: '$2.8M', endDate: 'Apr 30', category: 'Sports', hot: false },
]

const HOT_TOPICS = [
  { title: 'Fed Rate Decision', volume: '$8.2M' },
  { title: 'BTC Price Targets', volume: '$5.4M' },
  { title: 'Trump Tariffs', volume: '$4.1M' },
  { title: 'Hyperliquid TGE', volume: '$3.2M' },
  { title: 'ETH vs SOL', volume: '$2.9M' },
]

// ── Detail View (Polymarket-style) ──
function MarketDetail({ market, onBack }: { market: Market; onBack: () => void }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const outcomes = market.outcomes || [
    { label: 'Yes', price: market.yesPrice, volume: market.volume },
    { label: 'No', price: 1 - market.yesPrice, volume: market.volume },
  ]

  return (
    <div className="pred-detail">
      <div className="pred-detail-main">
        {/* Header */}
        <div className="pred-detail-header">
          <button className="pred-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <div className="pred-detail-meta">
            <span className="pred-card-badge">{market.category}</span>
            {market.hot && <span className="pred-card-hot">Hot</span>}
            <span className="pred-detail-vol">{market.volume} Vol.</span>
            <span className="pred-detail-end">Ends {market.endDate}</span>
          </div>
        </div>
        <h2 className="pred-detail-title">{market.title}</h2>

        {/* Outcome rows */}
        <div className="pred-outcomes">
          {outcomes.map((o, i) => {
            const pct = Math.round(o.price * 100)
            const noPct = 100 - pct
            return (
              <div key={i} className="pred-outcome-row">
                <div className="pred-outcome-label">
                  <span className="pred-outcome-name">{o.label}</span>
                  <span className="pred-outcome-vol">{o.volume} Vol.</span>
                </div>
                <div className="pred-outcome-pct">
                  <span>{pct}%</span>
                  {o.change && <span className={o.change.startsWith('+') ? 'green' : 'red'}>{o.change}</span>}
                </div>
                <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn yes">Buy Yes {pct}c</a>
                <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn no">Buy No {noPct}c</a>
              </div>
            )
          })}
        </div>

        {/* Rules */}
        <div className="pred-rules">
          <div className="pred-rules-title">Rules</div>
          <p>This market resolves to "Yes" if the condition is met by the end date. Otherwise, it resolves to "No". Settlement is based on official data sources.</p>
        </div>
      </div>

      {/* Right: Trade panel */}
      <div className="pred-detail-side">
        <div className="pred-trade-card">
          <div className="pred-trade-title">{market.title}</div>
          <div className="trade-type-toggle">
            <button className={`trade-type-btn ${side === 'buy' ? 'active' : ''}`} onClick={() => setSide('buy')}>Buy</button>
            <button className={`trade-type-btn ${side === 'sell' ? 'active' : ''}`} onClick={() => setSide('sell')}>Sell</button>
          </div>
          <div className="trade-side-toggle">
            <button className="trade-side-btn active buy">Yes {Math.round(market.yesPrice * 100)}c</button>
            <button className="trade-side-btn">No {Math.round((1 - market.yesPrice) * 100)}c</button>
          </div>
          <div className="pred-amount-section">
            <div className="pred-amount-label">Amount</div>
            <div className="trade-input-wrapper">
              <span className="trade-input-unit" style={{ marginRight: 4 }}>$</span>
              <input type="number" className="trade-input" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
            </div>
            <div className="pred-quick-amounts">
              {[1, 5, 10, 100].map(v => (
                <button key={v} className="pred-quick-btn" onClick={() => setAmount(String(v))}>+${v}</button>
              ))}
              <button className="pred-quick-btn" onClick={() => setAmount('1000')}>Max</button>
            </div>
          </div>
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="trade-submit buy" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Trade
          </a>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>Powered by Outcome</div>
        </div>

        {/* Related markets */}
        <div className="pred-hot-card">
          <div className="pred-hot-title">Related</div>
          {EVENTS.filter(e => e.category === market.category && e.id !== market.id).slice(0, 3).map(e => (
            <div key={e.id} className="pred-hot-row">
              <span className="pred-hot-name" style={{ fontSize: 12 }}>{e.title.slice(0, 35)}{e.title.length > 35 ? '...' : ''}</span>
              <span className={e.yesPrice >= 0.5 ? 'green' : 'red'} style={{ fontWeight: 600 }}>{Math.round(e.yesPrice * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──
export function PredictionsPage() {
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [amount, setAmount] = useState('')
  const [side, setSide] = useState<'yes' | 'no'>('yes')

  const filtered = category === 'All' || category === 'Trending'
    ? (category === 'Trending' ? EVENTS.filter(e => e.hot) : EVENTS)
    : EVENTS.filter(e => e.category === category)

  const openMarket = (m: Market) => { setSelectedMarket(m); setSide('yes'); setAmount('') }

  // Detail view
  if (selectedMarket) {
    return (
      <div className="pred-page">
        <div className="pred-topbar">
          <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => { setCategory('All'); setSelectedMarket(null) }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setSelectedMarket(null) }}>
              {c}
            </button>
          ))}
        </div>
        <MarketDetail market={selectedMarket} onBack={() => setSelectedMarket(null)} />
      </div>
    )
  }

  // List view
  return (
    <div className="pred-page">
      <div className="pred-topbar">
        <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => setCategory('All')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="pred-layout">
        <div className="pred-main">
          <div className="pred-grid">
            {filtered.map(e => (
              <button key={e.id} className="pred-card" onClick={() => openMarket(e)}>
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

        <div className="pred-sidebar">
          {/* What's happening */}
          <div className="pred-hot-card">
            <div className="pred-hot-title">What's Happening</div>
            <div className="pred-happening-item">
              <div className="pred-happening-label">Crypto</div>
              <div className="pred-happening-text">BTC breaks $69k as ETF inflows surge. Markets watch Fed meeting next week.</div>
              <div className="pred-happening-time">2h ago</div>
            </div>
            <div className="pred-happening-item">
              <div className="pred-happening-label">Macro</div>
              <div className="pred-happening-text">US jobs report beats expectations. Rate cut odds shift to 71%.</div>
              <div className="pred-happening-time">5h ago</div>
            </div>
            <div className="pred-happening-item">
              <div className="pred-happening-label">DeFi</div>
              <div className="pred-happening-text">Hyperliquid TVL hits $2B. HYPE token up 15% this week.</div>
              <div className="pred-happening-time">8h ago</div>
            </div>
          </div>

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

          <div className="pred-hot-card">
            <div className="pred-hot-title">Top Movers</div>
            {EVENTS.filter(e => e.hot).slice(0, 5).map(e => (
              <button key={e.id} className="pred-mover-row" onClick={() => openMarket(e)}>
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
