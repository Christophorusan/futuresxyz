import { useState, useEffect, useRef, useCallback } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'

export interface SpotMarket {
  name: string        // pair name like "@107" or "PURR/USDC"
  pairName: string    // display name like "HYPE/USDC"
  index: number
  baseToken: string
  quoteToken: string
  baseIndex: number
  markPx: string
  volume24h: string
  change24h: number
  prevDayPx: string
  evmContract: string | null
}

let cachedSpot: SpotMarket[] = []
let lastFetch = 0

export function useSpotMarkets() {
  const { info } = useHyperliquid()
  const [markets, setMarkets] = useState<SpotMarket[]>(cachedSpot)
  const [loading, setLoading] = useState(cachedSpot.length === 0)
  const infoRef = useRef(info)
  infoRef.current = info

  const fetchData = useCallback(async () => {
    const now = Date.now()
    if (now - lastFetch < 15000 && cachedSpot.length > 0) {
      setMarkets(cachedSpot)
      setLoading(false)
      return
    }

    try {
      const data = await infoRef.current.spotMetaAndAssetCtxs()
      const meta = (data as unknown[])[0] as {
        universe: Array<{ name: string; tokens: number[]; index: number }>
        tokens: Array<{ name: string; index: number; evmContract: { address: string } | null }>
      }
      const ctxs = (data as unknown[])[1] as Array<{
        markPx: string
        dayNtlVlm: string
        prevDayPx: string
      }>

      // Build token lookup
      const tokenMap = new Map<number, { name: string; evmContract: string | null }>()
      for (const t of meta.tokens) {
        tokenMap.set(t.index, {
          name: t.name,
          evmContract: t.evmContract?.address ?? null,
        })
      }

      const spotList: SpotMarket[] = meta.universe.map((pair, i) => {
        const ctx = ctxs[i]
        const baseInfo = tokenMap.get(pair.tokens[0])
        const quoteInfo = tokenMap.get(pair.tokens[1])
        const baseName = baseInfo?.name ?? `Token${pair.tokens[0]}`
        const quoteName = quoteInfo?.name ?? 'USDC'
        const markPx = ctx?.markPx ?? '0'
        const prevDay = parseFloat(ctx?.prevDayPx ?? '0')
        const current = parseFloat(markPx)
        const change = prevDay > 0 ? ((current - prevDay) / prevDay) * 100 : 0

        return {
          name: pair.name,
          pairName: `${baseName}/${quoteName}`,
          index: pair.index ?? i,
          baseToken: baseName,
          quoteToken: quoteName,
          baseIndex: pair.tokens[0],
          markPx,
          volume24h: ctx?.dayNtlVlm ?? '0',
          change24h: change,
          prevDayPx: ctx?.prevDayPx ?? '0',
          evmContract: baseInfo?.evmContract ?? null,
        }
      })

      cachedSpot = spotList
      lastFetch = now
      setMarkets(spotList)
    } catch (e) {
      console.error('Failed to fetch spot markets:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { markets, loading }
}
