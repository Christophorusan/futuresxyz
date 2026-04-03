import { useState, useEffect, useRef } from 'react'
import { wsManager } from '../../lib/ws'
import { useMarket } from '../../contexts/MarketContext'
import { useHyperliquid } from '../../contexts/HyperliquidContext'
import { formatPrice } from '../../lib/format'

interface Trade {
  px: string
  sz: string
  side: string
  time: number
}

export function RecentTrades() {
  const { selectedMarket } = useMarket()
  const { info } = useHyperliquid()
  const [trades, setTrades] = useState<Trade[]>([])
  const loadedRef = useRef(false)

  // Seed with REST data first (recentTrades endpoint)
  useEffect(() => {
    loadedRef.current = false
    if (!info) return

    const coin = selectedMarket.replace('-PERP', '')
    info.recentTrades({ coin }).then((data: unknown) => {
      if (!Array.isArray(data)) return
      const mapped = data.slice(0, 30).map((t: Record<string, unknown>) => ({
        px: String(t.px),
        sz: String(t.sz),
        side: String(t.side),
        time: Number(t.time),
      }))
      setTrades(mapped)
      loadedRef.current = true
    }).catch(() => {
      // ignore — WS will fill in
    })
  }, [info, selectedMarket])

  // Subscribe to live trades via WebSocket
  useEffect(() => {
    const coin = selectedMarket.replace('-PERP', '')
    const subId = `trades-${coin}`

    wsManager.subscribe(
      subId,
      { type: 'trades', coin },
      (data: unknown) => {
        // Hyperliquid sends trades as an array under data key or directly
        const rawTrades = Array.isArray(data) ? data : (data as Record<string, unknown>)?.data
        if (!Array.isArray(rawTrades)) return

        const mapped = rawTrades.map((t: Record<string, unknown>) => ({
          px: String(t.px),
          sz: String(t.sz),
          side: String(t.side),
          time: Number(t.time),
        }))

        setTrades(prev => [...mapped, ...prev].slice(0, 50))
      }
    )

    return () => {
      wsManager.unsubscribe(subId)
      setTrades([])
    }
  }, [selectedMarket])

  return (
    <div className="recent-trades">
      <div className="rt-header">
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div className="rt-body">
        {trades.length === 0 ? (
          <div className="rt-empty">Waiting for trades...</div>
        ) : (
          trades.map((t, i) => {
            const isBuy = t.side === 'B' || t.side === 'Buy'
            return (
              <div key={`${t.time}-${i}`} className="rt-row">
                <span className={isBuy ? 'rt-buy' : 'rt-sell'}>${formatPrice(t.px)}</span>
                <span className="rt-size">{parseFloat(t.sz).toFixed(4)}</span>
                <span className="rt-time">{new Date(t.time).toLocaleTimeString()}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
