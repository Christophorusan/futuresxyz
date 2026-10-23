import { spotContextMap, spotValuationPrice } from '../lib/spotPricing'
import { useQuery } from '@tanstack/react-query'
import { useHyperliquid } from '../contexts/HyperliquidContext'
export function useWalletPrices() {
  const { info } = useHyperliquid()
  return useQuery({ queryKey: ['wallet-spot-prices-v2'], queryFn: async () => {
    const [meta, contexts] = await info.spotMetaAndAssetCtxs()
    const prices: Record<string, number> = { USDC: 1 }
    const byMarket = spotContextMap(contexts)
    meta.universe.forEach(pair => {
      const base = meta.tokens.find(t => t.index === pair.tokens[0])
      const quote = meta.tokens.find(t => t.index === pair.tokens[1])
      const value = spotValuationPrice(byMarket.get(pair.name))
      if (base && quote?.name === 'USDC' && value !== null) prices[base.name] = value
    })
    if (prices.HYPE) prices.WHYPE = prices.HYPE
    return prices
  }, refetchInterval: 30000, staleTime: 15000 })
}
