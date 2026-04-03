import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMarketMeta, type MarketInfo } from '../../hooks/useMarketMeta'
import { useMarket } from '../../contexts/MarketContext'
import { formatPrice } from '../../lib/format'

type SortField = 'name' | 'price' | 'change' | 'volume' | 'oi'
type SortDir = 'asc' | 'desc'

const MAIN_TABS = ['All', 'Perps', 'Spot', 'Crypto', 'Tradfi', 'HIP-3', 'Trending', 'Pre-launch'] as const
type MainTab = typeof MAIN_TABS[number]

// Categorize markets by name
const TRADFI = new Set(['SPX', 'PAXG'])
const MEMES = new Set(['DOGE', 'SHIB', 'PEPE', 'BONK', 'FLOKI', 'WIF', 'PNUT', 'MOODENG', 'FARTCOIN', 'POPCAT', 'BRETT', 'MEW', 'MYRO', 'NEIRO', 'GOAT', 'CHILLGUY', 'TRUMP', 'MELANIA', 'BOME', 'kBONK', 'kDOGS', 'kFLOKI', 'kLUNC', 'kNEIRO', 'kPEPE', 'kSHIB', 'LOOM', 'HPOS', 'TURBO', 'MON', 'DOOD', 'PURR'])
const AI_TOKENS = new Set(['AI', 'AI16Z', 'AIXBT', 'FET', 'RENDER', 'RNDR', 'GRIFFAIN', 'VIRTUAL', 'ZEREBRO', 'GRASS', 'IO', 'TAO', 'HYPER', 'KAITO'])
const DEFI = new Set(['AAVE', 'UNI', 'COMP', 'CRV', 'MKR', 'DYDX', 'GMX', 'SNX', 'LDO', 'PENDLE', 'MORPHO', 'EIGEN', 'ENA', 'ONDO', 'USUAL', 'RESOLV', 'ETHFI', 'STG', 'SUSHI', 'JUP', 'INIT'])
const L1L2 = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'AVAX', 'DOT', 'ADA', 'NEAR', 'SUI', 'APT', 'SEI', 'TIA', 'OP', 'ARB', 'HYPE', 'MOVE', 'S', 'BERA', 'INJ', 'TRX', 'XRP', 'TON', 'FTM', 'MATIC', 'POL', 'ATOM', 'ICP', 'ALGO', 'XLM', 'LINK', 'STX', 'ZETA', 'ZK'])

function formatVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${Math.round(v / 1e6)}M`
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`
  return `$${Math.round(v)}`
}

function MarketRow({ market, isActive, isFav, onSelect, onToggleFav }: {
  market: MarketInfo; isActive: boolean; isFav: boolean
  onSelect: () => void; onToggleFav: () => void
}) {
  const change = market.change24h
  const changeDollar = parseFloat(market.midPrice) * (change / 100)
  const vol = parseFloat(market.volume24h)

  return (
    <button className={`mkt-row ${isActive ? 'active' : ''}`} onClick={onSelect}>
      <span className="mkt-fav" onClick={e => { e.stopPropagation(); onToggleFav() }}>
        {isFav ? '★' : '☆'}
      </span>
      <span className="mkt-symbol">
        <span className="mkt-name">{market.name}-USDC</span>
        <span className="mkt-badge">{market.maxLeverage}x</span>
      </span>
      <span className="mkt-cell">{formatPrice(market.midPrice)}</span>
      <span className={`mkt-cell ${change >= 0 ? 'green' : 'red'}`}>
        {change >= 0 ? '+' : ''}{changeDollar.toFixed(changeDollar > 100 ? 0 : Math.abs(changeDollar) < 0.01 ? 5 : 2)} / {change >= 0 ? '+' : ''}{change.toFixed(2)}%
      </span>
      <span className="mkt-cell">--</span>
      <span className="mkt-cell">{formatVol(vol)}</span>
      <span className="mkt-cell">--</span>
    </button>
  )
}

export function MarketSelector() {
  const { markets } = useMarketMeta()
  const { selectedMarket, setSelectedMarket } = useMarket()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mainTab, setMainTab] = useState<MainTab>('All')
  const [sortField, setSortField] = useState<SortField>('volume')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('fav-markets')
      return saved ? new Set(JSON.parse(saved)) : new Set<string>()
    } catch { return new Set<string>() }
  })

  const currentMarket = markets.find(m => m.name === selectedMarket)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }, [sortField])

  const toggleFav = (name: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      localStorage.setItem('fav-markets', JSON.stringify([...next]))
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = [...markets]

    // Search filter
    if (search) {
      list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Tab filter
    if (mainTab === 'Crypto') {
      list = list.filter(m => !TRADFI.has(m.name))
    } else if (mainTab === 'Tradfi') {
      list = list.filter(m => TRADFI.has(m.name))
    } else if (mainTab === 'Trending') {
      list = list.filter(m => Math.abs(m.change24h) > 3)
    } else if (mainTab === 'HIP-3') {
      list = list.filter(m => MEMES.has(m.name))
    }

    // Sort: favorites first, then by field
    list.sort((a, b) => {
      const aFav = favorites.has(a.name) ? 1 : 0
      const bFav = favorites.has(b.name) ? 1 : 0
      if (aFav !== bFav) return bFav - aFav

      let cmp = 0
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'price': cmp = parseFloat(a.midPrice) - parseFloat(b.midPrice); break
        case 'change': cmp = a.change24h - b.change24h; break
        case 'volume': cmp = parseFloat(a.volume24h) - parseFloat(b.volume24h); break
        default: break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [markets, search, mainTab, sortField, sortDir, favorites])

  const handleSelect = (name: string) => {
    setSelectedMarket(name)
    setOpen(false)
    setSearch('')
  }

  const Arrow = ({ field }: { field: SortField }) => (
    sortField === field
      ? <span className="sort-active">{sortDir === 'asc' ? '▲' : '▼'}</span>
      : null
  )

  return (
    <>
      <button className="market-selector-btn" onClick={() => setOpen(true)}>
        <span className="market-name">{selectedMarket}/USDC</span>
        <span className="market-arrow">▲</span>
      </button>

      {open && (
        <div className="mkt-overlay" onClick={() => setOpen(false)}>
          <div className="mkt-modal" onClick={e => e.stopPropagation()}>
            {/* Search */}
            <div className="mkt-search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="mkt-search-input"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Main Tabs */}
            <div className="mkt-main-tabs">
              {MAIN_TABS.map(t => (
                <button
                  key={t}
                  className={`mkt-main-tab ${mainTab === t ? 'active' : ''}`}
                  onClick={() => setMainTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Column Headers */}
            <div className="mkt-cols">
              <span className="mkt-col-fav"></span>
              <button className="mkt-col-header mkt-col-sym" onClick={() => handleSort('name')}>
                Symbol <Arrow field="name" />
              </button>
              <button className="mkt-col-header" onClick={() => handleSort('price')}>
                Last Price <Arrow field="price" />
              </button>
              <button className="mkt-col-header" onClick={() => handleSort('change')}>
                24h Change <Arrow field="change" />
              </button>
              <button className="mkt-col-header">
                8h Funding
              </button>
              <button className="mkt-col-header" onClick={() => handleSort('volume')}>
                Volume <Arrow field="volume" />
              </button>
              <button className="mkt-col-header" onClick={() => handleSort('oi')}>
                Open Interest <Arrow field="oi" />
              </button>
            </div>

            {/* Market Rows */}
            <div className="mkt-rows">
              {filtered.length === 0 ? (
                <div className="mkt-empty">No markets found</div>
              ) : (
                filtered.map(m => (
                  <MarketRow
                    key={m.name}
                    market={m}
                    isActive={m.name === selectedMarket}
                    isFav={favorites.has(m.name)}
                    onSelect={() => handleSelect(m.name)}
                    onToggleFav={() => toggleFav(m.name)}
                  />
                ))
              )}
            </div>

            {/* Keyboard Shortcuts Footer */}
            <div className="mkt-shortcuts">
              <span><kbd>⌘K</kbd> Open</span>
              <span><kbd>↕</kbd> Navigate</span>
              <span><kbd>Enter</kbd> Select</span>
              <span><kbd>⌘S</kbd> Favorite</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
