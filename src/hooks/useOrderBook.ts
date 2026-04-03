import { useState, useEffect, useRef } from 'react'
import { wsManager } from '../lib/ws'

export interface OrderBookLevel {
  price: string
  size: string
  total: number // cumulative size
}

export interface OrderBookData {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  spread: string
  spreadPct: string
}

interface WsLevel {
  px: string
  sz: string
  n: number
}

function processLevels(levels: WsLevel[], isBids: boolean): OrderBookLevel[] {
  const sorted = [...levels].sort((a, b) =>
    isBids ? parseFloat(b.px) - parseFloat(a.px) : parseFloat(a.px) - parseFloat(b.px)
  )

  let cumulative = 0
  return sorted.slice(0, 10).map((level) => {
    cumulative += parseFloat(level.sz)
    return { price: level.px, size: level.sz, total: cumulative }
  })
}

export function useOrderBook(market: string) {
  const [book, setBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
    spread: '0',
    spreadPct: '0',
  })
  const subIdRef = useRef(`l2Book-${market}`)

  useEffect(() => {
    const subId = `l2Book-${market}`
    subIdRef.current = subId

    wsManager.subscribe(
      subId,
      { type: 'l2Book', coin: market },
      (data: unknown) => {
        const d = data as { levels?: WsLevel[][]; coin?: string }
        if (d.coin && d.coin !== market) return
        if (!d.levels || d.levels.length < 2) return

        const bids = processLevels(d.levels[0], true)
        const asks = processLevels(d.levels[1], false)

        const bestBid = bids[0]?.price ? parseFloat(bids[0].price) : 0
        const bestAsk = asks[0]?.price ? parseFloat(asks[0].price) : 0
        const spread = bestAsk - bestBid
        const mid = (bestAsk + bestBid) / 2
        const spreadPct = mid > 0 ? ((spread / mid) * 100).toFixed(3) : '0'

        setBook({
          bids,
          asks,
          spread: spread.toFixed(2),
          spreadPct,
        })
      }
    )

    return () => {
      wsManager.unsubscribe(subId)
    }
  }, [market])

  return book
}
