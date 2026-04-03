import { useMemo, useState, useEffect, useRef } from 'react'
import { useMarketMeta } from './useMarketMeta'
import { useHyperliquid } from '../contexts/HyperliquidContext'

export interface MarketStats {
  markPx: string
  midPx: string
  fundingRate: string
  openInterest: string
  volume24h: string
  change24h: number
}

export function useMarketStats(coin: string): MarketStats | null {
  const { info } = useHyperliquid()
  const { markets } = useMarketMeta()
  const [funding, setFunding] = useState<string>('0')
  const [openInterest, setOpenInterest] = useState<string>('0')
  const infoRef = useRef(info)
  const coinRef = useRef(coin)

  infoRef.current = info
  coinRef.current = coin

  const market = useMemo(() => markets.find(m => m.name === coin), [markets, coin])

  useEffect(() => {
    let mounted = true
    const fetchExtra = async () => {
      try {
        const ctxs = await infoRef.current.metaAndAssetCtxs()
        const meta = ctxs[0] as { universe: Array<{ name: string }> }
        const assetCtxs = ctxs[1] as Array<{ funding: string; openInterest: string }>
        const idx = meta.universe.findIndex(a => a.name === coinRef.current)
        if (idx >= 0 && mounted) {
          setFunding(assetCtxs[idx].funding)
          setOpenInterest(assetCtxs[idx].openInterest)
        }
      } catch {
        // silent
      }
    }

    fetchExtra()
    const interval = setInterval(fetchExtra, 60000)
    return () => { mounted = false; clearInterval(interval) }
  }, [coin]) // Only re-run when coin changes

  if (!market) return null

  return {
    markPx: market.midPrice,
    midPx: market.midPrice,
    fundingRate: funding,
    openInterest,
    volume24h: market.volume24h,
    change24h: market.change24h,
  }
}
