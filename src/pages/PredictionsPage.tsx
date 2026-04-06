import { useState, useRef, useEffect, useMemo } from 'react'

const CATEGORIES = ['Trending', 'Breaking', 'New', 'Politics', 'Sports', 'Crypto', 'Esports', 'Finance', 'Geopolitics', 'Tech', 'Culture', 'Economy', 'Weather', 'Elections'] as const
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
  traders?: number
}

// Mini sparkline SVG for market cards
function Sparkline({ points, color, width = 60, height = 20 }: { points: number[]; color: string; width?: number; height?: number }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const path = points.map((p, i) => {
    const x = i * step
    const y = height - ((p - min) / range) * (height - 4) - 2
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ flexShrink: 0 }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Generate deterministic sparkline data from market id + price
function genSparkline(id: number, price: number): number[] {
  const pts: number[] = []
  let v = price - 0.1
  for (let i = 0; i < 12; i++) {
    v += (Math.sin(id * 7 + i * 1.3) * 0.04) + (Math.cos(id * 3 + i * 0.7) * 0.02)
    v = Math.max(0.02, Math.min(0.98, v))
    pts.push(v)
  }
  pts.push(price) // end at current price
  return pts
}

// Generate deterministic trader count from market id + volume
function genTraders(id: number, volNum: number): number {
  return Math.round((volNum / 100) + (id * 37) % 500 + 200)
}

// Days remaining helper for urgency
function daysUntil(endDate: string): number {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const parts = endDate.split(' ')
  const month = months[parts[0]] ?? 0
  const day = parseInt(parts[1]) || 31
  const target = new Date(2026, month, day)
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

interface Comment {
  user: string
  text: string
  time: string
  likes: number
}

const EVENTS: Market[] = [
  // Crypto
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', volNum: 1200000, endDate: 'Apr 30', category: 'Crypto', hot: true, traders: 1843 },
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', volNum: 890000, endDate: 'Jun 30', category: 'Crypto', hot: false },
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', volNum: 520000, endDate: 'Jun 30', category: 'Crypto', hot: true },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', volNum: 340000, endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 7, title: 'Bitcoin ETF inflows exceed $50B?', yesPrice: 0.58, volume: '$1.8M', volNum: 1800000, endDate: 'Dec 31', category: 'Crypto', hot: false },
  { id: 8, title: 'Hyperliquid top 3 DEX by volume?', yesPrice: 0.76, volume: '$680K', volNum: 680000, endDate: 'Dec 31', category: 'Crypto', hot: true },
  { id: 18, title: 'XRP above $2 by July?', yesPrice: 0.29, volume: '$410K', volNum: 410000, endDate: 'Jul 31', category: 'Crypto', hot: false },
  { id: 19, title: 'Ethereum ETF approved by SEC in 2026?', yesPrice: 0.81, volume: '$3.6M', volNum: 3600000, endDate: 'Dec 31', category: 'Crypto', hot: true },
  { id: 20, title: 'Total crypto market cap above $4T?', yesPrice: 0.44, volume: '$920K', volNum: 920000, endDate: 'Dec 31', category: 'Crypto', hot: false },

  // Economy / Macro
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', volNum: 2400000, endDate: 'May 7', category: 'Economy', hot: true },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', volNum: 3100000, endDate: 'Dec 31', category: 'Economy', hot: true },
  { id: 9, title: 'EU passes stablecoin ban?', yesPrice: 0.09, volume: '$420K', volNum: 420000, endDate: 'Dec 31', category: 'Economy', hot: false },
  { id: 21, title: 'US inflation below 2.5% by Q4?', yesPrice: 0.38, volume: '$1.7M', volNum: 1700000, endDate: 'Dec 31', category: 'Economy', hot: false },
  { id: 22, title: 'US unemployment above 5%?', yesPrice: 0.15, volume: '$980K', volNum: 980000, endDate: 'Dec 31', category: 'Economy', hot: false },
  { id: 23, title: 'China GDP growth above 5% in 2026?', yesPrice: 0.52, volume: '$1.3M', volNum: 1300000, endDate: 'Dec 31', category: 'Economy', hot: false },

  // Politics
  { id: 10, title: 'Trump wins 2028 primary?', yesPrice: 0.41, volume: '$4.5M', volNum: 4500000, endDate: 'Dec 31', category: 'Politics', hot: true },
  { id: 24, title: 'Biden approval above 45% by June?', yesPrice: 0.22, volume: '$2.1M', volNum: 2100000, endDate: 'Jun 30', category: 'Politics', hot: false },
  { id: 25, title: 'Government shutdown in 2026?', yesPrice: 0.35, volume: '$1.9M', volNum: 1900000, endDate: 'Dec 31', category: 'Politics', hot: true },
  { id: 26, title: 'New US crypto regulation bill passes?', yesPrice: 0.47, volume: '$3.2M', volNum: 3200000, endDate: 'Dec 31', category: 'Politics', hot: true },

  // Tech
  { id: 11, title: 'Apple launches AR glasses in 2026?', yesPrice: 0.33, volume: '$1.1M', volNum: 1100000, endDate: 'Dec 31', category: 'Tech', hot: false },
  { id: 27, title: 'OpenAI IPO in 2026?', yesPrice: 0.56, volume: '$2.8M', volNum: 2800000, endDate: 'Dec 31', category: 'Tech', hot: true },
  { id: 28, title: 'Twitter/X monthly users above 600M?', yesPrice: 0.41, volume: '$780K', volNum: 780000, endDate: 'Dec 31', category: 'Tech', hot: false },
  { id: 29, title: 'GPT-5 released before July 2026?', yesPrice: 0.68, volume: '$4.1M', volNum: 4100000, endDate: 'Jul 31', category: 'Tech', hot: true },
  { id: 30, title: 'TikTok banned in US in 2026?', yesPrice: 0.18, volume: '$5.6M', volNum: 5600000, endDate: 'Dec 31', category: 'Tech', hot: true },

  // Sports
  { id: 12, title: 'Lakers make NBA playoffs?', yesPrice: 0.55, volume: '$2.8M', volNum: 2800000, endDate: 'Apr 30', category: 'Sports', hot: false },
  { id: 31, title: 'Real Madrid wins Champions League?', yesPrice: 0.32, volume: '$3.4M', volNum: 3400000, endDate: 'Jun 1', category: 'Sports', hot: true },
  { id: 32, title: 'Chiefs win Super Bowl LXI?', yesPrice: 0.21, volume: '$6.2M', volNum: 6200000, endDate: 'Feb 28', category: 'Sports', hot: false },
  { id: 33, title: 'Djokovic wins French Open 2026?', yesPrice: 0.14, volume: '$1.2M', volNum: 1200000, endDate: 'Jun 15', category: 'Sports', hot: false },
  { id: 34, title: 'Ohtani hits 50 HRs again in 2026?', yesPrice: 0.27, volume: '$1.8M', volNum: 1800000, endDate: 'Oct 31', category: 'Sports', hot: false },

  // Finance / TradFi
  { id: 13, title: 'S&P 500 above 5,500 by June?', yesPrice: 0.48, volume: '$3.8M', volNum: 3800000, endDate: 'Jun 30', category: 'Finance', hot: true },
  { id: 14, title: 'Gold above $3,000 by Q3?', yesPrice: 0.72, volume: '$2.1M', volNum: 2100000, endDate: 'Sep 30', category: 'Finance', hot: true },
  { id: 15, title: 'Tesla stock above $300 by EOY?', yesPrice: 0.31, volume: '$4.2M', volNum: 4200000, endDate: 'Dec 31', category: 'Finance', hot: false },
  { id: 16, title: 'WTI Crude Oil above $80 in April?', yesPrice: 0.19, volume: '$1.5M', volNum: 1500000, endDate: 'Apr 30', category: 'Finance', hot: false },
  { id: 17, title: 'NVIDIA above $150 by May?', yesPrice: 0.64, volume: '$5.1M', volNum: 5100000, endDate: 'May 30', category: 'Finance', hot: true },
  { id: 35, title: 'Apple market cap above $4T?', yesPrice: 0.39, volume: '$2.3M', volNum: 2300000, endDate: 'Dec 31', category: 'Finance', hot: false },
  { id: 36, title: 'US 10Y yield below 4% by Q3?', yesPrice: 0.54, volume: '$1.6M', volNum: 1600000, endDate: 'Sep 30', category: 'Finance', hot: false },

  // Geopolitics
  { id: 37, title: 'Ukraine ceasefire agreement in 2026?', yesPrice: 0.23, volume: '$7.8M', volNum: 7800000, endDate: 'Dec 31', category: 'Geopolitics', hot: true },
  { id: 38, title: 'Iran nuclear deal revival?', yesPrice: 0.11, volume: '$2.4M', volNum: 2400000, endDate: 'Dec 31', category: 'Geopolitics', hot: true },
  { id: 39, title: 'Taiwan Strait military incident?', yesPrice: 0.08, volume: '$4.1M', volNum: 4100000, endDate: 'Dec 31', category: 'Geopolitics', hot: false },
  { id: 40, title: 'New US-China tariff escalation?', yesPrice: 0.62, volume: '$3.5M', volNum: 3500000, endDate: 'Dec 31', category: 'Geopolitics', hot: true },

  // Culture
  { id: 41, title: 'GTA VI released before Dec 2026?', yesPrice: 0.73, volume: '$8.9M', volNum: 8900000, endDate: 'Dec 31', category: 'Culture', hot: true },
  { id: 42, title: 'Taylor Swift announces retirement?', yesPrice: 0.03, volume: '$1.2M', volNum: 1200000, endDate: 'Dec 31', category: 'Culture', hot: false },
  { id: 43, title: 'Netflix subscriber count above 300M?', yesPrice: 0.61, volume: '$950K', volNum: 950000, endDate: 'Dec 31', category: 'Culture', hot: false },
  { id: 44, title: 'Marvel movie crosses $1.5B box office?', yesPrice: 0.25, volume: '$1.4M', volNum: 1400000, endDate: 'Dec 31', category: 'Culture', hot: false },

  // Esports
  { id: 45, title: 'T1 wins Worlds 2026?', yesPrice: 0.38, volume: '$2.1M', volNum: 2100000, endDate: 'Nov 30', category: 'Esports', hot: true },
  { id: 46, title: 'Valorant Champions viewership above 2M?', yesPrice: 0.55, volume: '$680K', volNum: 680000, endDate: 'Dec 31', category: 'Esports', hot: false },
  { id: 47, title: 'CS2 Major prize pool above $2M?', yesPrice: 0.72, volume: '$430K', volNum: 430000, endDate: 'Dec 31', category: 'Esports', hot: false },
  { id: 48, title: 'Fortnite World Cup returns in 2026?', yesPrice: 0.64, volume: '$1.1M', volNum: 1100000, endDate: 'Dec 31', category: 'Esports', hot: true },

  // Weather
  { id: 49, title: 'Category 5 hurricane hits US in 2026?', yesPrice: 0.31, volume: '$2.8M', volNum: 2800000, endDate: 'Nov 30', category: 'Weather', hot: false },
  { id: 50, title: 'Hottest year on record in 2026?', yesPrice: 0.58, volume: '$1.9M', volNum: 1900000, endDate: 'Dec 31', category: 'Weather', hot: true },
  { id: 51, title: 'Major earthquake (7.0+) in California?', yesPrice: 0.12, volume: '$3.4M', volNum: 3400000, endDate: 'Dec 31', category: 'Weather', hot: false },

  // Elections
  { id: 52, title: 'Republicans win House majority 2026?', yesPrice: 0.56, volume: '$6.7M', volNum: 6700000, endDate: 'Nov 30', category: 'Elections', hot: true },
  { id: 53, title: 'Democrats win Senate 2026?', yesPrice: 0.48, volume: '$5.9M', volNum: 5900000, endDate: 'Nov 30', category: 'Elections', hot: true },
  { id: 54, title: 'DeSantis runs for president 2028?', yesPrice: 0.62, volume: '$3.8M', volNum: 3800000, endDate: 'Dec 31', category: 'Elections', hot: false },
  { id: 55, title: 'Newsom wins Democratic primary 2028?', yesPrice: 0.19, volume: '$2.1M', volNum: 2100000, endDate: 'Dec 31', category: 'Elections', hot: false },

  // Breaking
  { id: 56, title: 'US-China trade deal before July?', yesPrice: 0.17, volume: '$4.8M', volNum: 4800000, endDate: 'Jul 31', category: 'Breaking', hot: true },
  { id: 57, title: 'OPEC production cut extended?', yesPrice: 0.69, volume: '$2.3M', volNum: 2300000, endDate: 'Jun 30', category: 'Breaking', hot: true },
  { id: 58, title: 'Major bank failure in 2026?', yesPrice: 0.14, volume: '$5.2M', volNum: 5200000, endDate: 'Dec 31', category: 'Breaking', hot: false },

  // New
  { id: 59, title: 'SpaceX Starship orbital success by Q3?', yesPrice: 0.77, volume: '$1.8M', volNum: 1800000, endDate: 'Sep 30', category: 'New', hot: true },
  { id: 60, title: 'Spot Solana ETF filed in 2026?', yesPrice: 0.43, volume: '$2.9M', volNum: 2900000, endDate: 'Dec 31', category: 'New', hot: true },
  { id: 61, title: 'WHO declares new pandemic?', yesPrice: 0.06, volume: '$3.1M', volNum: 3100000, endDate: 'Dec 31', category: 'New', hot: false },
  { id: 62, title: 'First AI-generated movie in theaters?', yesPrice: 0.21, volume: '$1.5M', volNum: 1500000, endDate: 'Dec 31', category: 'New', hot: false },
]

const TRENDING_ITEMS = [
  { title: 'Fed Rate Decision', volume: '$8.2M', change: '+3.2%', marketId: 3 },
  { title: 'BTC Price Targets', volume: '$5.4M', change: '+1.8%', marketId: 1 },
  { title: 'Trump Tariffs', volume: '$4.1M', change: '-2.1%', marketId: 10 },
  { title: 'Hyperliquid TGE', volume: '$3.2M', change: '+5.6%', marketId: 8 },
  { title: 'Ukraine Ceasefire', volume: '$7.8M', change: '+2.4%', marketId: 37 },
  { title: 'GTA VI Release', volume: '$8.9M', change: '+0.8%', marketId: 41 },
]

const TOP_MOVES = [
  { title: 'NVIDIA above $150 by May?', change: +8, marketId: 17 },
  { title: 'Fed rate cut in May 2026?', change: +5, marketId: 3 },
  { title: 'Gold above $3,000 by Q3?', change: +4, marketId: 14 },
  { title: 'TikTok banned in US?', change: +7, marketId: 30 },
  { title: 'WTI Crude Oil above $80?', change: -6, marketId: 16 },
  { title: 'Tesla stock above $300?', change: -4, marketId: 15 },
  { title: 'US-China trade deal?', change: -3, marketId: 56 },
]

const NEWS = [
  { category: 'Crypto', headline: 'BTC breaks $69k as ETF inflows surge', time: '2h ago', source: 'CoinDesk' },
  { category: 'Macro', headline: 'US jobs report beats expectations', time: '5h ago', source: 'Bloomberg' },
  { category: 'DeFi', headline: 'Hyperliquid TVL hits $2B milestone', time: '8h ago', source: 'DeFiLlama' },
  { category: 'TradFi', headline: 'NVIDIA earnings beat, guidance strong', time: '12h ago', source: 'Reuters' },
  { category: 'Politics', headline: 'New tariff proposals shake markets', time: '1d ago', source: 'WSJ' },
  { category: 'Geopolitics', headline: 'Ukraine peace talks resume in Geneva', time: '1d ago', source: 'AP' },
]

type SortMode = 'volume' | 'newest' | 'ending' | 'probability'

const MOCK_ACTIVITY = [
  { user: '0x8f2...4a1', side: 'YES', amount: '$250', price: '62c', time: '2m ago' },
  { user: '0xd3e...7b2', side: 'NO', amount: '$180', price: '38c', time: '5m ago' },
  { user: '0x1a9...c3f', side: 'YES', amount: '$500', price: '63c', time: '8m ago' },
  { user: '0x7c4...2d8', side: 'YES', amount: '$1,200', price: '61c', time: '14m ago' },
  { user: '0xb2f...9e1', side: 'NO', amount: '$340', price: '39c', time: '22m ago' },
  { user: '0x5d1...8a3', side: 'YES', amount: '$90', price: '62c', time: '31m ago' },
  { user: '0xe8c...1f7', side: 'NO', amount: '$2,100', price: '37c', time: '45m ago' },
  { user: '0x3a7...6d4', side: 'YES', amount: '$420', price: '64c', time: '1h ago' },
]

const MOCK_HOLDERS = [
  { user: '0x8f2...4a1', position: 'YES', amount: '$12,400', pnl: '+$2,100' },
  { user: '0xd3e...7b2', position: 'NO', amount: '$8,900', pnl: '+$890' },
  { user: '0x1a9...c3f', position: 'YES', amount: '$6,200', pnl: '-$310' },
  { user: '0x7c4...2d8', position: 'YES', amount: '$4,800', pnl: '+$1,440' },
  { user: '0xb2f...9e1', position: 'NO', amount: '$3,500', pnl: '+$420' },
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

// ── Kalshi-style Sidebar ──
function SidebarContent({ onOpenMarket }: { onOpenMarket: (id: number) => void }) {
  return (
    <>
      {/* Trending */}
      <div className="pred-hot-card">
        <div className="pred-hot-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          Trending
        </div>
        {TRENDING_ITEMS.map((t, i) => (
          <button key={i} className="pred-hot-row" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font)' }} onClick={() => onOpenMarket(t.marketId)}>
            <span className="pred-hot-rank">{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="pred-hot-name" style={{ display: 'block' }}>{t.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.volume}</span>
            </div>
            <span className={t.change.startsWith('+') ? 'green' : 'red'} style={{ fontSize: 12, fontWeight: 600 }}>{t.change}</span>
          </button>
        ))}
      </div>

      {/* Top Moves */}
      <div className="pred-hot-card">
        <div className="pred-hot-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/><path d="M17 7l-5-5-5 5"/></svg>
          Top Moves
        </div>
        {TOP_MOVES.map((m, i) => (
          <button key={i} className="pred-mover-row" onClick={() => onOpenMarket(m.marketId)}>
            <span className="pred-mover-name">{m.title.slice(0, 26)}{m.title.length > 26 ? '...' : ''}</span>
            <span className={m.change > 0 ? 'green' : 'red'} style={{ fontWeight: 700, fontSize: 13 }}>
              {m.change > 0 ? '+' : ''}{m.change}%
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 2, verticalAlign: 'middle', transform: m.change < 0 ? 'rotate(180deg)' : 'none' }}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </span>
          </button>
        ))}
      </div>

      {/* News */}
      <div className="pred-hot-card">
        <div className="pred-hot-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M18 18h-8M18 10h-8"/></svg>
          News
        </div>
        {NEWS.map((n, i) => (
          <div key={i} className="pred-news-item">
            <div className="pred-news-top">
              <span className="pred-happening-label">{n.category}</span>
              <span className="pred-news-source">{n.source}</span>
            </div>
            <div className="pred-happening-text">{n.headline}</div>
            <div className="pred-happening-time">{n.time}</div>
          </div>
        ))}
      </div>
    </>
  )
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button className="pred-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <button className="pred-share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
            Share
          </button>
        </div>

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

        {/* Probability Chart */}
        <div className="pred-chart-area">
          <div className="pred-chart-header">
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>Probability</span>
            <div className="pred-chart-timeframes">
              {['1D', '1W', '1M', 'All'].map(tf => (
                <button key={tf} className={`pred-chart-tf ${tf === '1M' ? 'active' : ''}`}>{tf}</button>
              ))}
            </div>
          </div>
          <div className="pred-chart-svg">
            <Sparkline
              points={genSparkline(market.id, market.yesPrice)}
              color={market.yesPrice >= 0.5 ? 'var(--green)' : 'var(--red)'}
              width={500}
              height={120}
            />
          </div>
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
            <div className="pred-holders-list">
              <div className="pred-holder-header">
                <span>Address</span><span>Position</span><span>Value</span><span>PnL</span>
              </div>
              {MOCK_HOLDERS.map((h, i) => (
                <div key={i} className="pred-holder-row">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.user}</span>
                  <span className={h.position === 'YES' ? 'green' : 'red'} style={{ fontWeight: 600 }}>{h.position}</span>
                  <span>{h.amount}</span>
                  <span className={h.pnl.startsWith('+') ? 'green' : 'red'}>{h.pnl}</span>
                </div>
              ))}
            </div>
          )}
          {commentTab === 'activity' && (
            <div className="pred-activity-list">
              {MOCK_ACTIVITY.map((a, i) => (
                <div key={i} className="pred-activity-row">
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)' }}>{a.user}</span>
                  <span className={a.side === 'YES' ? 'green' : 'red'} style={{ fontWeight: 600, fontSize: 12 }}>
                    {a.side === 'YES' ? 'Bought' : 'Sold'} {a.side}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-1)' }}>{a.amount} @ {a.price}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>{a.time}</span>
                </div>
              ))}
            </div>
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

        <SidebarContent onOpenMarket={onOpenMarket} />
      </div>
    </div>
  )
}

// ── Featured Market ──
function FeaturedMarket({ market }: { market: Market }) {
  const yesPct = Math.round(market.yesPrice * 100)
  const noPct = 100 - yesPct
  return (
    <div className="featured-market featured-glow">
      <div className="featured-left">
        <div className="featured-header">
          <span className="pred-live-dot" />
          <span className="pred-card-badge">{market.category}</span>
          {market.hot && <span className="pred-card-hot">Hot</span>}
          <span className="featured-social">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            {genTraders(market.id, market.volNum).toLocaleString()} traders
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{market.volume} Vol.</span>
        </div>
        <h2 className="featured-title">{market.title}</h2>
        <div className="featured-bar">
          <div className="featured-bar-yes" style={{ width: `${yesPct}%` }}>Yes {yesPct}%</div>
          <div className="featured-bar-no" style={{ width: `${noPct}%` }}>No {noPct}%</div>
        </div>
        <div className="featured-actions">
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn yes featured-cta" style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}>Buy Yes {yesPct}c</a>
          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className="pred-outcome-btn no featured-cta" style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}>Buy No {noPct}c</a>
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
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('volume')
  const [watchlist, setWatchlist] = useState<Set<number>>(() => {
    try { const s = localStorage.getItem('pred-watchlist'); return s ? new Set(JSON.parse(s)) : new Set() }
    catch { return new Set() }
  })

  const toggleWatch = (id: number) => {
    setWatchlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      localStorage.setItem('pred-watchlist', JSON.stringify([...next]))
      return next
    })
  }

  // Featured: top 5 by volume, carousel
  const topMarkets = useMemo(() => [...EVENTS].sort((a, b) => b.volNum - a.volNum).slice(0, 5), [])
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const featured = topMarkets[featuredIdx]

  // Auto-rotate featured every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => setFeaturedIdx(i => (i + 1) % topMarkets.length), 8000)
    return () => clearInterval(timer)
  }, [topMarkets.length])
  const openMarket = EVENTS.find(e => e.id === openMarketId)

  const filtered = useMemo(() => {
    let list = category === 'All' ? [...EVENTS]
      : category === 'Trending' ? EVENTS.filter(e => e.hot)
      : EVENTS.filter(e => e.category === category)

    // Search filter
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))

    // Sort
    switch (sort) {
      case 'volume': list.sort((a, b) => b.volNum - a.volNum); break
      case 'newest': list.sort((a, b) => b.id - a.id); break
      case 'ending': list.sort((a, b) => a.endDate.localeCompare(b.endDate)); break
      case 'probability': list.sort((a, b) => Math.abs(b.yesPrice - 0.5) - Math.abs(a.yesPrice - 0.5)); break
    }
    return list
  }, [category, search, sort])

  const rest = filtered.filter(e => e.id !== featured.id)

  const handleOpen = (id: number) => { setOpenMarketId(id) }

  const catIcons: Record<string, React.ReactNode> = {
    'Trending': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>,
    'Breaking': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    'New': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    'Politics': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 0a3 3 0 006 0m0 0a3 3 0 006 0V7H3"/><path d="M6 21V11m12 10V11"/></svg>,
    'Sports': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z"/><path d="M2 12h20"/></svg>,
    'Crypto': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 8h6m-6 4h6m-6 4h4M6 3h12l4 4v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5l4-2z"/></svg>,
    'Esports': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m8-1h.01m2-2h.01"/></svg>,
    'Finance': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    'Geopolitics': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a16 16 0 014 10 16 16 0 01-4 10 16 16 0 01-4-10A16 16 0 0112 2z"/></svg>,
    'Tech': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
    'Culture': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0118 0"/><path d="M12 11V2"/><rect x="2" y="11" width="20" height="11" rx="2"/></svg>,
    'Economy': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    'Weather': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
    'Elections': <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  }

  const VISIBLE_COUNT = 8
  const visibleCats = CATEGORIES.slice(0, VISIBLE_COUNT)
  const moreCats = CATEGORIES.slice(VISIBLE_COUNT)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isMoreActive = moreCats.some(c => c === category)

  const topbar = (
    <div className="pred-topbar">
      <button className={`pred-topbar-tab ${category === 'All' ? 'active' : ''}`} onClick={() => { setCategory('All'); setOpenMarketId(null) }}>All</button>
      {visibleCats.map(c => (
        <button key={c} className={`pred-topbar-tab ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setOpenMarketId(null) }}>
          {catIcons[c]}{c}
        </button>
      ))}
      {/* On mobile: show all tabs inline (scrollable). On desktop: "More" dropdown */}
      {moreCats.map(c => (
        <button key={c} className={`pred-topbar-tab pred-mobile-tab ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setOpenMarketId(null) }}>
          {c}
        </button>
      ))}
      {moreCats.length > 0 && (
        <div ref={moreRef} style={{ position: 'relative' }} className="pred-more-wrap">
          <button className={`pred-topbar-tab ${isMoreActive ? 'active' : ''}`} onClick={() => setMoreOpen(o => !o)}>
            More
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 2, transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {moreOpen && (
            <div className="pred-more-dropdown">
              {moreCats.map(c => (
                <button key={c} className={`pred-more-item ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setOpenMarketId(null); setMoreOpen(false) }}>
                  {catIcons[c]}{c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Detail view
  if (openMarket) {
    return (
      <div className="pred-page">
        {topbar}
        <MarketView market={openMarket} onBack={() => setOpenMarketId(null)} onOpenMarket={handleOpen} />
      </div>
    )
  }

  // List view
  return (
    <div className="pred-page">
      {topbar}

      <div className="pred-layout">
        <div className="pred-main" style={{ padding: 4 }}>
          <FeaturedMarket market={featured} />
          <div className="pred-carousel-dots">
            {topMarkets.map((_, i) => (
              <button
                key={i}
                className={`pred-carousel-dot ${i === featuredIdx ? 'active' : ''}`}
                onClick={() => setFeaturedIdx(i)}
              />
            ))}
          </div>

          {/* Search + Sort bar */}
          <div className="pred-controls">
            <div className="pred-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="pred-search" placeholder="Search markets..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="pred-sort-wrap">
              {(['volume', 'newest', 'ending', 'probability'] as SortMode[]).map(s => (
                <button key={s} className={`pred-sort-btn ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
                  {s === 'volume' ? 'Top Volume' : s === 'newest' ? 'Newest' : s === 'ending' ? 'Ending Soon' : 'Most Likely'}
                </button>
              ))}
            </div>
          </div>

          {/* Trending markets bar */}
          <div className="pred-markets-bar">
            <div className="pred-markets-bar-left">
              <span className="pred-markets-title">Trending markets</span>
            </div>
            <div className="pred-markets-pills">
              {EVENTS.filter(e => e.hot).slice(0, 8).map(e => (
                <button key={e.id} className="pred-market-pill" onClick={() => handleOpen(e.id)}>
                  {e.title.length > 25 ? e.title.slice(0, 25) + '...' : e.title}
                </button>
              ))}
            </div>
          </div>

          {rest.length === 0 && search && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 14 }}>No markets found for "{search}"</div>
          )}

          <div className="pred-grid">
            {rest.map(e => (
              <button key={e.id} className={`pred-card ${e.hot ? 'pred-card-glow' : ''}`} onClick={() => handleOpen(e.id)}>
                <div className="pred-card-top">
                  <span className="pred-card-badge">{e.category}</span>
                  {e.hot && <span className="pred-card-hot">Hot</span>}
                  {daysUntil(e.endDate) <= 7 && daysUntil(e.endDate) > 0 && (
                    <span className="pred-card-urgent">{daysUntil(e.endDate)}d left</span>
                  )}
                  <span
                    className={`pred-card-star ${watchlist.has(e.id) ? 'active' : ''}`}
                    onClick={ev => { ev.stopPropagation(); toggleWatch(e.id) }}
                  >
                    {watchlist.has(e.id) ? '\u2605' : '\u2606'}
                  </span>
                </div>
                <div className="pred-card-title">{e.title}</div>
                <div className="pred-card-chart-row">
                  <Sparkline points={genSparkline(e.id, e.yesPrice)} color={e.yesPrice >= 0.5 ? 'var(--green)' : 'var(--red)'} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: e.yesPrice >= 0.5 ? 'var(--green)' : 'var(--red)' }}>{Math.round(e.yesPrice * 100)}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>chance</div>
                  </div>
                </div>
                <div className="pred-card-bar">
                  <div className="pred-card-bar-fill" style={{ width: `${e.yesPrice * 100}%` }} />
                </div>
                <div className="pred-card-prices">
                  <span className="pred-card-yes">Yes {Math.round(e.yesPrice * 100)}c</span>
                  <span className="pred-card-no">No {Math.round((1 - e.yesPrice) * 100)}c</span>
                </div>
                <div className="pred-card-footer">
                  <span className="pred-card-social">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    {genTraders(e.id, e.volNum).toLocaleString()}
                  </span>
                  <span>{e.volume} vol</span>
                  <span>Ends {e.endDate}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pred-sidebar">
          <SidebarContent onOpenMarket={handleOpen} />
        </div>
      </div>
    </div>
  )
}
