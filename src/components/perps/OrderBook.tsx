import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useOrderBook, type OrderBookLevel } from '../../hooks/useOrderBook'
import { useMarket } from '../../contexts/MarketContext'
import { formatPrice } from '../../lib/format'

interface OrderBookProps {
  onPriceClick?: (price: string) => void
  onSizeClick?: (size: string) => void
}

const ROW_HEIGHT = 22
const TOOLBAR_HEIGHT = 32
const HEADER_HEIGHT = 30
const SPREAD_HEIGHT = 28

const GROUPINGS = [0.01, 0.1, 1, 10, 100]
type ViewMode = 'both' | 'bids' | 'asks'

function groupLevels(levels: OrderBookLevel[], grouping: number): OrderBookLevel[] {
  const grouped = new Map<string, number>()
  for (const level of levels) {
    const px = parseFloat(level.price)
    const rounded = (Math.round(px / grouping) * grouping).toFixed(
      grouping < 1 ? Math.abs(Math.floor(Math.log10(grouping))) : 0
    )
    grouped.set(rounded, (grouped.get(rounded) || 0) + parseFloat(level.size))
  }
  let cumulative = 0
  return Array.from(grouped.entries()).map(([price, size]) => {
    cumulative += size
    return { price, size: size.toString(), total: cumulative }
  })
}

function LevelRow({ level, maxTotal, side, onPriceClick, onSizeClick }: {
  level: OrderBookLevel; maxTotal: number; side: 'bid' | 'ask'
  onPriceClick?: (price: string) => void; onSizeClick?: (size: string) => void
}) {
  const pct = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0
  return (
    <div className="ob-row">
      <div className="ob-depth" style={{
        width: `${pct}%`,
        background: side === 'bid' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        right: 0,
      }} />
      <span className={`ob-price ${side === 'bid' ? 'ob-bid' : 'ob-ask'}`} onClick={() => onPriceClick?.(level.price)}>
        {formatPrice(level.price)}
      </span>
      <span className="ob-size" onClick={() => onSizeClick?.(level.size)}>
        {parseFloat(level.size).toFixed(4)}
      </span>
      <span className="ob-total">{level.total.toFixed(4)}</span>
    </div>
  )
}

export function OrderBook({ onPriceClick, onSizeClick }: OrderBookProps = {}) {
  const { selectedMarket } = useMarket()
  const book = useOrderBook(selectedMarket)
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxLevels, setMaxLevels] = useState(10)
  const [grouping, setGrouping] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('both')

  const calcLevels = useCallback(() => {
    if (!containerRef.current) return
    const h = containerRef.current.offsetHeight
    const spreadH = viewMode === 'both' ? SPREAD_HEIGHT : 0
    const available = h - TOOLBAR_HEIGHT - HEADER_HEIGHT - spreadH
    const divisor = viewMode === 'both' ? 2 : 1
    const perSide = Math.floor(available / divisor / ROW_HEIGHT)
    setMaxLevels(Math.max(3, Math.min(perSide, 20)))
  }, [viewMode])

  useEffect(() => {
    calcLevels()
    const observer = new ResizeObserver(calcLevels)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [calcLevels])

  const groupedAsks = useMemo(() => groupLevels(book.asks, grouping), [book.asks, grouping])
  const groupedBids = useMemo(() => groupLevels(book.bids, grouping), [book.bids, grouping])

  const asks = groupedAsks.slice(0, maxLevels)
  const bids = groupedBids.slice(0, maxLevels)
  const askMax = asks[asks.length - 1]?.total || 0
  const bidMax = bids[bids.length - 1]?.total || 0

  return (
    <div className="orderbook" ref={containerRef}>
      {/* Toolbar: grouping + view modes */}
      <div className="ob-toolbar">
        <div className="ob-grouping">
          {GROUPINGS.map(g => (
            <button key={g} className={`ob-grp-btn ${grouping === g ? 'active' : ''}`} onClick={() => setGrouping(g)}>
              {g}
            </button>
          ))}
        </div>
        <div className="ob-view-modes">
          <button className={`ob-vm-btn ${viewMode === 'both' ? 'active' : ''}`} onClick={() => setViewMode('both')} title="Both">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="5" rx="1" fill="var(--red)" opacity="0.6"/><rect x="1" y="8" width="12" height="5" rx="1" fill="var(--green)" opacity="0.6"/></svg>
          </button>
          <button className={`ob-vm-btn ${viewMode === 'bids' ? 'active' : ''}`} onClick={() => setViewMode('bids')} title="Bids only">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="1" fill="var(--green)" opacity="0.6"/></svg>
          </button>
          <button className={`ob-vm-btn ${viewMode === 'asks' ? 'active' : ''}`} onClick={() => setViewMode('asks')} title="Asks only">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="1" fill="var(--red)" opacity="0.6"/></svg>
          </button>
        </div>
      </div>

      <div className="ob-header">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="ob-body">
        {(viewMode === 'both' || viewMode === 'asks') && (
          <div className="ob-asks">
            {[...asks].reverse().map((level, i) => (
              <LevelRow key={`ask-${i}`} level={level} maxTotal={askMax} side="ask" onPriceClick={onPriceClick} onSizeClick={onSizeClick} />
            ))}
          </div>
        )}

        {viewMode === 'both' && (
          <div className="ob-mid">
            <span className="ob-mid-spread">Spread ${book.spread} ({book.spreadPct}%)</span>
          </div>
        )}

        {(viewMode === 'both' || viewMode === 'bids') && (
          <div className="ob-bids">
            {bids.map((level, i) => (
              <LevelRow key={`bid-${i}`} level={level} maxTotal={bidMax} side="bid" onPriceClick={onPriceClick} onSizeClick={onSizeClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
