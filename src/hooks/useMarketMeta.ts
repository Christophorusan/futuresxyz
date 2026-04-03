import { useState, useEffect, useRef, useCallback } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'

export interface MarketInfo {
  name: string
  szDecimals: number
  maxLeverage: number
  midPrice: string
  volume24h: string
  change24h: number
  funding: string
  openInterest: string
}

// Singleton cache to prevent duplicate fetches across components
let cachedMarkets: MarketInfo[] = []
let lastFetchTime = 0
let fetchInProgress: Promise<MarketInfo[]> | null = null

export function useMarketMeta() {
  const { info } = useHyperliquid()
  const [markets, setMarkets] = useState<MarketInfo[]>(cachedMarkets)
  const [loading, setLoading] = useState(cachedMarkets.length === 0)
  const [error, setError] = useState<string | null>(null)
  const infoRef = useRef(info)
  const mountedRef = useRef(true)

  infoRef.current = info

  const fetchMeta = useCallback(async () => {
    const now = Date.now()
    // Debounce: don't fetch if we fetched less than 10s ago
    if (now - lastFetchTime < 10000 && cachedMarkets.length > 0) {
      setMarkets(cachedMarkets)
      setLoading(false)
      return
    }

    // Deduplicate: if a fetch is already running, wait for it
    if (fetchInProgress) {
      try {
        const result = await fetchInProgress
        if (mountedRef.current) {
          setMarkets(result)
          setLoading(false)
        }
      } catch { /* handled below */ }
      return
    }

    const currentInfo = infoRef.current

    fetchInProgress = (async () => {
      const [metaAndCtxs, mids] = await Promise.all([
        currentInfo.metaAndAssetCtxs(),
        currentInfo.allMids(),
      ])

      const meta = metaAndCtxs[0] as { universe: Array<{ name: string; szDecimals: number; maxLeverage: number }> }
      const ctxs = metaAndCtxs[1] as Array<{
        dayNtlVlm: string
        prevDayPx: string
        markPx: string
        funding: string
        openInterest: string
      }>

      const marketList: MarketInfo[] = meta.universe.map((asset, i) => {
        const ctx = ctxs[i]
        const midPrice = mids[asset.name] ?? ctx?.markPx ?? '0'
        const prevDay = ctx ? parseFloat(ctx.prevDayPx) : 0
        const current = parseFloat(midPrice)
        const change24h = prevDay > 0 ? ((current - prevDay) / prevDay) * 100 : 0

        return {
          name: asset.name,
          szDecimals: asset.szDecimals,
          maxLeverage: asset.maxLeverage,
          midPrice,
          volume24h: ctx?.dayNtlVlm ?? '0',
          change24h,
          funding: ctx?.funding ?? '0',
          openInterest: ctx?.openInterest ?? '0',
        }
      })

      cachedMarkets = marketList
      lastFetchTime = Date.now()
      return marketList
    })()

    try {
      const result = await fetchInProgress
      if (mountedRef.current) {
        setMarkets(result)
        setError(null)
      }
    } catch (e) {
      console.error('Failed to fetch market meta:', e)
      if (mountedRef.current) {
        setError('Failed to load markets')
      }
    } finally {
      fetchInProgress = null
      if (mountedRef.current) setLoading(false)
    }
  }, []) // No deps — uses ref

  useEffect(() => {
    mountedRef.current = true
    // Initial fetch
    const timeout = setTimeout(fetchMeta, 300)
    // Poll every 30s
    const interval = setInterval(fetchMeta, 30000)
    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchMeta])

  return { markets, loading, error, refetch: fetchMeta }
}
