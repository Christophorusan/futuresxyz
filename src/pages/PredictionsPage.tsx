import { useState } from 'react'

const CATEGORIES = ['Trending', 'Crypto', 'TradFi', 'Macro', 'Politics', 'Sports', 'Tech'] as const
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
}

interface Comment {
  user: string
  text: string
  time: string
  likes: number
}

const EVENTS: Market[] = [
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', volNum: 1200000, endDate: 'Apr 30', category: 'Crypto', hot: true },
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', volNum: 890000, endDate: 'Jun 30', category: 'Crypto', hot: false },
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', volNum: 2400000, endDate: 'May 7', category: 'Macro', hot: true },
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', volNum: 520000, endDate: 'Jun 30', category: 'Crypto', hot: true },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', volNum: 340000, endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', volNum: 3100000, endDate: 'Dec 31', category: 'Macro', hot: true },
  { id: 7, title: 'Bitcoin ETF inflows exceed $50B?', yesPrice: 0.58, volume: '$1.8M', volNum: 1800000, endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 8, title: 'Hyperliquid top 3 DEX by volume?', yesPrice: 0.76, volume: '$680K', volNum: 680000, endDate: 'Dec 31', category: 'Crypto', hot: true },
  { id: 9, title: 'EU passes stablecoin ban?', yesPrice: 0.09, volume: '$420K', volNum: 420000, endDate: 'Dec 31', category: 'Macro', hot: false },
  { id: 10, title: 'Trump wins 2028 primary?', yesPrice: 0.41, volume: '$4.5M', volNum: 4500000, endDate: 'Dec 31', category: 'Politics', hot: true },
  { id: 11, title: 'Apple launches AR glasses in 2026?', yesPrice: 0.33, volume: '$1.1M', volNum: 1100000, endDate: 'Dec 31', category: 'Tech', hot: false },
  { id: 12, title: 'Lakers make NBA playoffs?', yesPrice: 0.55, volume: '$2.8M', volNum: 2800000, endDate: 'Apr 30', category: 'Sports', hot: false },
  { id: 13, title: 'S&P 500 above 5,500 by June?', yesPrice: 0.48, volume: '$3.8M', volNum: 3800000, endDate: 'Jun 30', category: 'TradFi', hot: true },
  { id: 14, title: 'Gold above $3,000 by Q3?', yesPrice: 0.72, volume: '$2.1M', volNum: 2100000, endDate: 'Sep 30', category: 'TradFi', hot: true },
  { id: 15, title: 'Tesla stock above $300 by EOY?', yesPrice: 0.31, volume: '$4.2M', volNum: 4200000, endDate: 'Dec 31', category: 'TradFi', hot: false },
  { id: 16, title: 'WTI Crude Oil above $80 in April?', yesPrice: 0.19, volume: '$1.5M', volNum: 1500000, endDate: 'Apr 30', category: 'TradFi', hot: false },
  { id: 17, title: 'NVIDIA above $150 by May?', yesPrice: 0.64, volume: '$5.1M', volNum: 5100000, endDate: 'May 30', category: 'TradFi', hot: true },
]

const HOT_TOPICS = [
  { title: 'Fed Rate Decision', volume: '$8.2M', marketId: 3 },
  { title: 'BTC Price Targets', volume: '$5.4M', marketId: 1 },
  { title: 'Trump Tariffs', volume: '$4.1M', marketId: 10 },
  { title: 'Hyperliquid TGE', volume: '$3.2M', marketId: 8 },
  { title: 'ETH vs SOL', volume: '$2.9M', marketId: 5 },
]

const MOCK_COMMENTS: Record<number, Comment[]> = {
  1: [
    { user: 'degen_trader', text: 'ETF flows looking insane rn, this is hitting $72k easy', time: '5m ago', likes: 12 },
    { user: 'whale_watcher', text: 'Shorts getting liquidated left and right', time: '18m ago', likes: 8 },
    { user: 'macro_mike', text: 'Fed meeting next week could change everything tho', time: '1h ago', likes: 23 },
    { user: 'anon420', text: 'been holding YES since 40c lets gooo', time: '2h ago', likes: 5 },
  ],
  3: [
    { user: 'fed_watcher', text: 'Powell basically confirmed it in the last presser', time: '12m ago', likes: 31 },
    { user: 'bond_king', text: 'CME futures pricing 25bp at 68% probability', time: '45m ago', likes: 19 },
  ],
  6: [
    { user: 'bear_case', text: 'Yield curve still inverted. Recession incoming.', time: '3h ago', likes: 7 },
    { user: 'bull_case', text: 'GDP growth is fine, labor market strong. No way.', time: '5h ago', likes: 14 },
  ],
  10: [
    { user: 'politics101', text: 'DeSantis dropping out changed everything', time: '1h ago', likes: 22 },
  ],
}

// ── Market Detail View ──
function MarketView({ market, onBack, onOpenMarket }: { market: Market; onBack: () => void; onOpenMarket: (id: number) => void }) {
  const [amount, setAmount] = useState('')
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS[market.id] || [])
  const [commentTab, setCommentTab] = useState<'comments' | 'positions' | 'activity'>('comments')

  const yesPct = Math.round(market.yesPrice * 100)
  const noPct = 100 - yesPct

  const addComment = () => {
    if (!commentText.trim()) return
    setComments(prev => [{ user: 'you', text: commentText, time: 'just now', likes: 0 }, ...prev])
    setCommentText('')
  }

  return (
    <div className="pred-detail">
      {/* Main content */}
      <div className="pred-detail-main">
        <button className="pred-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>

        {/* Market header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="pred-card-badge">{market.category}</span>
          {market.hot && <span className="pred-card-hot">Hot</span>}
        </div>
        <h2 className="pred-detail-title">{market.title}</h2>

        {/* Price + countdown */}
        <div className="market-detail-stats">
          <div><span className="market-detail-label">YES Price</span><span className="green" style={{ fontSize: 20, fontWeight: 700 }}>{yesPct}c</span></div>
          <div><span className="market-detail-label">NO Price</span><span className="red" style={{ fontSize: 20, fontWeight: 700 }}>{noPct}c</span></div>
          <div><span className="market-detail-label">Volume</span><span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-0)' }}>{market.volume}</span></div>
          <div><span className="market-detail-label">Ends</span><span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-0)' }}>{market.endDate}</span></div>
        </div>

        {/* YES/NO bar */}
        <div className="featured-bar" style={{ marginBottom: 16 }}>
          <div className="featured-bar-yes" style={{ width: `${yesPct}%` }}>Yes {yesPct}%</div>
          <div className="featured-bar-no" style={{ width: `${noPct}%` }}>No {noPct}%</div>
        </div>

        {/* Rules */}
        <div className="pred-rules" style={{ marginTop: 0 }}>
          <div className="pred-rules-title">Rules</div>
          <p>This market resolves to "Yes" if the condition is met by {market.endDate}. Settlement based on official data sources.</p>
        </div>

        {/* Comments section */}
        <div className="comments-section">
          <div className="comments-tabs">
            <button className={`comments-tab ${commentTab === 'comments' ? 'active' : ''}`} onClick={() => setCommentTab('comments')}>Comments ({comments.length})</button>
            <button className={`comments-tab ${commentTab === 'positions' ? 'active' : ''}`} onClick={() => setCommentTab('positions')}>Top Holders</button>
            <button className={`comments-tab ${commentTab === 'activity' ? 'active' : ''}`} onClick={() => setCommentTab('activity')}>Activity</button>
          </div>

          {commentTab === 'comments' && (
            <>
              {/* Comment input */}
              <div className="comment-input-row">
                <input className="comment-input" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
                <button className="comment-post-btn" onClick={addComment}>Post</button>
              </div>

              {/* Comments list */}
              <div className="comments-list">
                {comments.map((c, i) => (
                  <div key={i} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-user">{c.user}</span>
                      <span className="comment-time">{c.time}</span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                    <div className="comment-actions">
                      <button className="comment-like-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {c.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {commentTab === 'positions' && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Connect wallet to see top holders</div>
          )}
          {commentTab === 'activity' && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Recent trades will appear here</div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="pred-detail-side">
        {/* Trade card */}
        <div className="pred-trade-card">
          <div className="trade-type-toggle">
            <button className={`trade-type-btn active`}>Buy</button>
            <button className="trade-type-btn">Sell</button>
          </div>
          <div className="trade-side-toggle">
            <button className={`trade-side-btn ${side === 'yes' ? 'active buy' : ''}`} onClick={() => setSide('yes')}>Yes {yesPct}c</button>
            <button className={`trade-side-btn ${side === 'no' ? 'active sell' : ''}`} onClick={() => setSide('no')}>No {noPct}c</button>
          </div>
          <div className="pred-amount-section">
            <div className="pred-amount-label">Amount</div>
            <div className="trade-input-wrapper">
              <span className="trade-input-unit" style={{ marginRight: 4 }}>$</span>
              <input type="number" className="trade-input" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="pred-quick-amounts">
              {[1, 5, 10, 100].map(v => (
                <button key={v} className="pred-quick-btn" onClick={() => setAmount(String(v))}>+${v}</button>
              ))}
              <button className="pred-quick-btn" onClick={() => setAmount('1000')}>Max</button>
            </div>
          </div>
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className={`trade-submit ${side === 'yes' ? 'buy' : 'sell'}`} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>Trade</a>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>Powered by Outcome</div>
        </div>

        {/* Related markets */}
        <div className="pred-hot-card">
          <div className="pred-hot-title">Related</div>
          {EVENTS.filter(e => e.category === market.category && e.id !== market.id).slice(0, 4).map(e => (
            <button key={e.id} className="pred-mover-row" onClick={() => onOpenMarket(e.id)}>
              <span className="pred-mover-name">{e.title.slice(0, 28)}{e.title.length > 28 ? '...' : ''}</span>
              <span className={e.yesPrice >= 0.5 ? 'green' : 'red'}>{Math.round(e.yesPrice * 100)}%</span>
            </button>
          ))}
        </div>

        {/* Hot topics */}
        <div className="pred-hot-card">
          <div className="pred-hot-title">Hot Topics</div>
          {HOT_TOPICS.map((t, i) => (
            <button key={i} className="pred-hot-row" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font)' }} onClick={() => onOpenMarket(t.marketId)}>
              <span className="pred-hot-rank">{i + 1}</span>
              <span className="pred-hot-name">{t.title}</span>
              <span className="pred-hot-vol">{t.volume}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Featured Market ──
function FeaturedMarket({ market }: { market: Market }) {
  const yesPct = Math.round(market.yesPrice * 100)
  const noPct = 100 - yesPct
  return (
    <div className="featured-market">
      <div className="featured-left">
        <div className="featured-header">
          <span className="pred-card-badge">{market.category}</span>
          {market.hot && <span className="pred-card-hot">Hot</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{market.volume} Vol.</span>
        </div>
        <h2 className="featured-title">{market.title}</h2>
        <div className="featured-bar">
          <div className="featured-bar-yes" style={{ width: `${yesPct}%` }}>Yes {yesPct}%</div>
          <div className="featured-bar-no" style={{ width: `${noPct}%` }}>No {noPct}%</div>
        </div>
        <div className="featured-actions">
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn yes" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>Buy Yes {yesPct}c</a>
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn no" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>Buy No {noPct}c</a>
        </div>
      </div>
      <div className="featured-book">
        <div className="featured-book-side">
          <div className="featured-book-label green">YES</div>
          {[0, 1, 2, 3, 4].map(i => {
            const p = yesPct - i * 2
            const s = Math.round(Math.random() * 400 + 100)
            return (
              <div key={i} className="featured-book-row">
                <span className="green">{p}c</span><span>${s}</span>
                <div className="featured-book-depth" style={{ width: `${(s / 500) * 100}%`, background: 'var(--green-bg)' }} />
              </div>
            )
          })}
        </div>
        <div className="featured-book-side">
          <div className="featured-book-label red">NO</div>
          {[0, 1, 2, 3, 4].map(i => {
            const p = noPct - i * 2
            const s = Math.round(Math.random() * 400 + 100)
            return (
              <div key={i} className="featured-book-row">
                <span className="red">{p}c</span><span>${s}</span>
                <div className="featured-book-depth" style={{ width: `${(s / 500) * 100}%`, background: 'var(--red-bg)' }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──
export function PredictionsPage() {
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [openMarketId, setOpenMarketId] = useState<number | null>(null)

  const featured = EVENTS[0]
  const openMarket = EVENTS.find(e => e.id === openMarketId)

  const filtered = category === 'All' || category === 'Trending'
    ? (category === 'Trending' ? EVENTS.filter(e => e.hot) : EVENTS)
    : EVENTS.filter(e => e.category === category)
  const rest = filtered.filter(e => e.id !== featured.id)

  const handleOpen = (id: number) => { setOpenMarketId(id) }

  // Detail view
  if (openMarket) {
    return (
      <div className="pred-page">
        <div className="pred-topbar">
          <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => { setCategory('All'); setOpenMarketId(null) }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setOpenMarketId(null) }}>{c}</button>
          ))}
        </div>
        <MarketView market={openMarket} onBack={() => setOpenMarketId(null)} onOpenMarket={handleOpen} />
      </div>
    )
  }

  // List view
  return (
    <div className="pred-page">
      <div className="pred-topbar">
        <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => setCategory('All')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="pred-layout">
        <div className="pred-main" style={{ padding: 4 }}>
          <FeaturedMarket market={featured} />

          {/* Trending markets bar */}
          <div className="pred-markets-bar">
            <div className="pred-markets-bar-left">
              <span className="pred-markets-title">Trending markets</span>
            </div>
            <div className="pred-markets-pills">
              {EVENTS.filter(e => e.hot).slice(0, 6).map(e => (
                <button key={e.id} className="pred-market-pill" onClick={() => handleOpen(e.id)}>
                  {e.title.length > 25 ? e.title.slice(0, 25) + '...' : e.title}
                </button>
              ))}
            </div>
          </div>

          <div className="pred-grid">
            {rest.map(e => (
              <button key={e.id} className="pred-card" onClick={() => handleOpen(e.id)}>
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

        <div className="pred-sidebar">
          <div className="pred-hot-card">
            <div className="pred-hot-title">What's Happening</div>
            <div className="pred-happening-item"><div className="pred-happening-label">Crypto</div><div className="pred-happening-text">BTC breaks $69k as ETF inflows surge</div><div className="pred-happening-time">2h ago</div></div>
            <div className="pred-happening-item"><div className="pred-happening-label">Macro</div><div className="pred-happening-text">US jobs report beats expectations</div><div className="pred-happening-time">5h ago</div></div>
            <div className="pred-happening-item"><div className="pred-happening-label">DeFi</div><div className="pred-happening-text">Hyperliquid TVL hits $2B</div><div className="pred-happening-time">8h ago</div></div>
          </div>
          <div className="pred-hot-card">
            <div className="pred-hot-title">Hot Topics</div>
            {HOT_TOPICS.map((t, i) => (
              <button key={i} className="pred-hot-row" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font)' }} onClick={() => handleOpen(t.marketId)}>
                <span className="pred-hot-rank">{i + 1}</span>
                <span className="pred-hot-name">{t.title}</span>
                <span className="pred-hot-vol">{t.volume}</span>
              </button>
            ))}
          </div>
          <div className="pred-hot-card">
            <div className="pred-hot-title">Top by Volume</div>
            {[...EVENTS].sort((a, b) => b.volNum - a.volNum).slice(0, 5).map(e => (
              <button key={e.id} className="pred-mover-row" onClick={() => handleOpen(e.id)}>
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
