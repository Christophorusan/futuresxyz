import { useRef, useEffect, useState, useCallback } from 'react'
import { useOrderBook, type OrderBookLevel } from '../../hooks/useOrderBook'
import { useMarket } from '../../contexts/MarketContext'
import { formatPrice } from '../../lib/format'

interface OrderBookProps {
  onPriceClick?: (price: string) => void
  onSizeClick?: (size: string) => void
}

const ROW_HEIGHT = 22 // px per level row
const HEADER_HEIGHT = 30
const SPREAD_HEIGHT = 28

function LevelRow({ level, maxTotal, side, onPriceClick, onSizeClick }: {
  level: OrderBookLevel
  maxTotal: number
  side: 'bid' | 'ask'
  onPriceClick?: (price: string) => void
  onSizeClick?: (size: string) => void
}) {
  const pct = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0

  return (
    <div className="ob-row">
      <div
        className="ob-depth"
        style={{
          width: `${pct}%`,
          background: side === 'bid'
            ? 'rgba(45, 212, 191, 0.15)'
            : 'rgba(239, 68, 68, 0.15)',
          right: 0,
        }}
      />
      <span
        className={`ob-price ${side === 'bid' ? 'ob-bid' : 'ob-ask'}`}
        onClick={() => onPriceClick?.(level.price)}
      >
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

  // Calculate how many levels fit based on container height
  const calcLevels = useCallback(() => {
    if (!containerRef.current) return
    const h = containerRef.current.offsetHeight
    const available = h - HEADER_HEIGHT - SPREAD_HEIGHT
    const perSide = Math.floor(available / 2 / ROW_HEIGHT)
    setMaxLevels(Math.max(3, Math.min(perSide, 15)))
  }, [])

  useEffect(() => {
    calcLevels()
    const observer = new ResizeObserver(calcLevels)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [calcLevels])

  const asks = book.asks.slice(0, maxLevels)
  const bids = book.bids.slice(0, maxLevels)
  const askMax = asks[asks.length - 1]?.total || 0
  const bidMax = bids[bids.length - 1]?.total || 0

  return (
    <div className="orderbook" ref={containerRef}>
      <div className="ob-header">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="ob-body">
        <div className="ob-asks">
          {[...asks].reverse().map((level, i) => (
            <LevelRow key={`ask-${i}`} level={level} maxTotal={askMax} side="ask" onPriceClick={onPriceClick} onSizeClick={onSizeClick} />
          ))}
        </div>

        <div className="ob-mid">
          <span className="ob-mid-spread">Spread ${book.spread} ({book.spreadPct}%)</span>
        </div>

        <div className="ob-bids">
          {bids.map((level, i) => (
            <LevelRow key={`bid-${i}`} level={level} maxTotal={bidMax} side="bid" onPriceClick={onPriceClick} onSizeClick={onSizeClick} />
          ))}
        </div>
      </div>
    </div>
  )
}
