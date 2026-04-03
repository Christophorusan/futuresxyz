import { useState, useEffect, useRef, useCallback } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { wsManager } from '../lib/ws'

export interface Candle {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type CandleInterval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M'

export function useCandles(market: string, interval: CandleInterval = '1h') {
  const { info } = useHyperliquid()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const candlesRef = useRef<Candle[]>([])

  // Fetch historical candles
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const now = Date.now()
      const lookback = 7 * 24 * 60 * 60 * 1000 // 7 days
      const raw = await info.candleSnapshot({
        coin: market,
        interval,
        startTime: now - lookback,
        endTime: now,
      })

      const parsed: Candle[] = raw.map((c: { t: number; o: string; h: string; l: string; c: string; v: string }) => ({
        time: Math.floor(c.t / 1000),
        open: parseFloat(c.o),
        high: parseFloat(c.h),
        low: parseFloat(c.l),
        close: parseFloat(c.c),
        volume: parseFloat(c.v),
      }))

      candlesRef.current = parsed
      setCandles(parsed)
    } catch (e) {
      console.error('Failed to fetch candles:', e)
    } finally {
      setLoading(false)
    }
  }, [info, market, interval])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Live candle updates via WebSocket
  useEffect(() => {
    const subId = `candle-${market}-${interval}`

    wsManager.subscribe(
      subId,
      { type: 'candle', coin: market, interval: interval },
      (data: unknown) => {
        const d = data as { t: number; o: string; h: string; l: string; c: string; v: string }
        if (!d.t) return

        const newCandle: Candle = {
          time: Math.floor(d.t / 1000),
          open: parseFloat(d.o),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          close: parseFloat(d.c),
          volume: parseFloat(d.v),
        }

        const existing = candlesRef.current
        const lastIdx = existing.findIndex(c => c.time === newCandle.time)
        let updated: Candle[]
        if (lastIdx >= 0) {
          updated = [...existing]
          updated[lastIdx] = newCandle
        } else {
          updated = [...existing, newCandle]
        }
        candlesRef.current = updated
        setCandles(updated)
      }
    )

    return () => {
      wsManager.unsubscribe(subId)
    }
  }, [market, interval])

  return { candles, loading }
}
