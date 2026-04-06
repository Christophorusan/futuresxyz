import { useState, useRef } from 'react'

const CATEGORIES = ['Trending', 'Crypto', 'Macro', 'Politics', 'Sports', 'Tech'] as const
type Category = typeof CATEGORIES[number]

interface Market {
  id: number
  title: string
  yesPrice: number
  volume: string
  volNum: number
  endDate: string
  category: Category
  hot: boolean
  outcomes?: { label: string; price: number; volume: string; change?: string }[]
}

const EVENTS: Market[] = [
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', volNum: 1200000, endDate: 'Apr 30', category: 'Crypto', hot: true,
    outcomes: [
      { label: '$80k', price: 0.18, volume: '$420K', change: '+5%' },
      { label: '$75k', price: 0.38, volume: '$680K', change: '+12%' },
      { label: '$70k', price: 0.62, volume: '$1.2M', change: '+8%' },
      { label: '$65k', price: 0.85, volume: '$340K', change: '-3%' },
    ]},
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', volNum: 890000, endDate: 'Jun 30', category: 'Crypto', hot: false },
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', volNum: 2400000, endDate: 'May 7', category: 'Macro', hot: true,
    outcomes: [
      { label: '50bp cut', price: 0.12, volume: '$180K' },
      { label: '25bp cut', price: 0.59, volume: '$1.8M', change: '+4%' },
      { label: 'No change', price: 0.24, volume: '$920K', change: '-2%' },
      { label: 'Rate hike', price: 0.05, volume: '$90K' },
    ]},
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', volNum: 520000, endDate: 'Jun 30', category: 'Crypto', hot: true },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', volNum: 340000, endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', volNum: 3100000, endDate: 'Dec 31', category: 'Macro', hot: true },
  { id: 7, title: 'Bitcoin ETF inflows exceed $50B?', yesPrice: 0.58, volume: '$1.8M', volNum: 1800000, endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 8, title: 'Hyperliquid top 3 DEX by volume?', yesPrice: 0.76, volume: '$680K', volNum: 680000, endDate: 'Dec 31', category: 'Crypto', hot: true },
  { id: 9, title: 'EU passes stablecoin ban?', yesPrice: 0.09, volume: '$420K', volNum: 420000, endDate: 'Dec 31', category: 'Macro', hot: false },
  { id: 10, title: 'Trump wins 2028 primary?', yesPrice: 0.41, volume: '$4.5M', volNum: 4500000, endDate: 'Dec 31', category: 'Politics', hot: true },
  { id: 11, title: 'Apple launches AR glasses in 2026?', yesPrice: 0.33, volume: '$1.1M', volNum: 1100000, endDate: 'Dec 31', category: 'Tech', hot: false },
  { id: 12, title: 'Lakers make NBA playoffs?', yesPrice: 0.55, volume: '$2.8M', volNum: 2800000, endDate: 'Apr 30', category: 'Sports', hot: false },
]

const HOT_TOPICS = [
  { title: 'Fed Rate Decision', volume: '$8.2M', marketId: 3 },
  { title: 'BTC Price Targets', volume: '$5.4M', marketId: 1 },
  { title: 'Trump Tariffs', volume: '$4.1M', marketId: 10 },
  { title: 'Hyperliquid TGE', volume: '$3.2M', marketId: 8 },
  { title: 'ETH vs SOL', volume: '$2.9M', marketId: 5 },
]

// ── Featured Market (big card with YES/NO book) ──
function FeaturedMarket({ market, onTrade }: { market: Market; onTrade: () => void }) {
  const yesPct = Math.round(market.yesPrice * 100)
  const noPct = 100 - yesPct
  // Simulate order book levels
  const yesLevels = Array.from({ length: 5 }, (_, i) => ({
    price: yesPct - i * 2,
    size: Math.round(Math.random() * 500 + 100),
  }))
  const noLevels = Array.from({ length: 5 }, (_, i) => ({
    price: noPct - i * 2,
    size: Math.round(Math.random() * 500 + 100),
  }))

  return (
    <div className="featured-market">
      <div className="featured-left">
        <div className="featured-header">
          <span className="pred-card-badge">{market.category}</span>
          {market.hot && <span className="pred-card-hot">Hot</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{market.volume} Vol.</span>
        </div>
        <h2 className="featured-title">{market.title}</h2>
        <div className="featured-bar-wrapper">
          <div className="featured-bar">
            <div className="featured-bar-yes" style={{ width: `${yesPct}%` }}>Yes {yesPct}%</div>
            <div className="featured-bar-no" style={{ width: `${noPct}%` }}>No {noPct}%</div>
          </div>
        </div>
        <div className="featured-actions">
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn yes" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>Buy Yes {yesPct}c</a>
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn no" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>Buy No {noPct}c</a>
        </div>
      </div>
      <div className="featured-book">
        <div className="featured-book-side">
          <div className="featured-book-label green">YES</div>
          {yesLevels.map((l, i) => (
            <div key={i} className="featured-book-row">
              <span className="green">{l.price}c</span>
              <span>${l.size}</span>
              <div className="featured-book-depth" style={{ width: `${(l.size / 600) * 100}%`, background: 'var(--green-bg)' }} />
            </div>
          ))}
        </div>
        <div className="featured-book-side">
          <div className="featured-book-label red">NO</div>
          {noLevels.map((l, i) => (
            <div key={i} className="featured-book-row">
              <span className="red">{l.price}c</span>
              <span>${l.size}</span>
              <div className="featured-book-depth" style={{ width: `${(l.size / 600) * 100}%`, background: 'var(--red-bg)' }} />
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
  const [featuredId, setFeaturedId] = useState(EVENTS[0].id)

  const featured = EVENTS.find(e => e.id === featuredId) || EVENTS[0]

  const filtered = category === 'All' || category === 'Trending'
    ? (category === 'Trending' ? EVENTS.filter(e => e.hot) : EVENTS)
    : EVENTS.filter(e => e.category === category)

  const rest = filtered.filter(e => e.id !== featured.id)

  const openMarket = (id: number) => {
    setFeaturedId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pred-page">
      {/* Category bar */}
      <div className="pred-topbar">
        <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => setCategory('All')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="pred-layout">
        <div className="pred-main" style={{ padding: 4 }}>
          {/* Featured */}
          <FeaturedMarket market={featured} onTrade={() => {}} />

          {/* Card grid */}
          <div style={{ marginTop: 8 }}>
            <div className="pred-grid">
              {rest.map(e => (
                <button key={e.id} className="pred-card" onClick={() => openMarket(e.id)}>
                  <div className="pred-card-top">
                    <span className="pred-card-badge">{e.category}</span>
                    {e.hot && <span className="pred-card-hot">Hot</span>}
                  </div>
                  <div className="pred-card-title">{e.title}</div>
                  <div className="pred-card-bar">
                    <div className="pred-card-bar-fill" style={{ width: `${e.yesPrice * 100}%` }} />
                  </div>
                  <div className="pred-card-prices">
                    <span className="pred-card-yes">Yes {Math.round(e.yesPrice * 100)}c</span>
                    <span className="pred-card-no">No {Math.round((1 - e.yesPrice) * 100)}c</span>
                  </div>
                  <div className="pred-card-meta">
                    <span>{e.volume} vol</span>
                    <span>Ends {e.endDate}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="pred-sidebar">
          <div className="pred-hot-card">
            <div className="pred-hot-title">What's Happening</div>
            <div className="pred-happening-item">
              <div className="pred-happening-label">Crypto</div>
              <div className="pred-happening-text">BTC breaks $69k as ETF inflows surge</div>
              <div className="pred-happening-time">2h ago</div>
            </div>
            <div className="pred-happening-item">
              <div className="pred-happening-label">Macro</div>
              <div className="pred-happening-text">US jobs report beats expectations</div>
              <div className="pred-happening-time">5h ago</div>
            </div>
            <div className="pred-happening-item">
              <div className="pred-happening-label">DeFi</div>
              <div className="pred-happening-text">Hyperliquid TVL hits $2B</div>
              <div className="pred-happening-time">8h ago</div>
            </div>
          </div>

          <div className="pred-hot-card">
            <div className="pred-hot-title">Hot Topics</div>
            {HOT_TOPICS.map((t, i) => (
              <button key={i} className="pred-hot-row" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font)' }} onClick={() => openMarket(t.marketId)}>
                <span className="pred-hot-rank">{i + 1}</span>
                <span className="pred-hot-name">{t.title}</span>
                <span className="pred-hot-vol">{t.volume}</span>
              </button>
            ))}
          </div>

          <div className="pred-hot-card">
            <div className="pred-hot-title">Top by Volume</div>
            {[...EVENTS].sort((a, b) => b.volNum - a.volNum).slice(0, 5).map(e => (
              <button key={e.id} className="pred-mover-row" onClick={() => openMarket(e.id)}>
                <span className="pred-mover-name">{e.title.slice(0, 28)}{e.title.length > 28 ? '...' : ''}</span>
                <span className={e.yesPrice >= 0.5 ? 'green' : 'red'}>{Math.round(e.yesPrice * 100)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
