import { useQuery } from '@tanstack/react-query'
import { useHyperliquid } from '../contexts/HyperliquidContext'
export function useWalletPrices() {
  const { info } = useHyperliquid()
  return useQuery({ queryKey: ['wallet-spot-prices'], queryFn: async () => {
    const [meta, contexts] = await info.spotMetaAndAssetCtxs()
    const prices: Record<string, number> = { USDC: 1 }
    meta.universe.forEach((pair, i) => {
      const base = meta.tokens.find(t => t.index === pair.tokens[0])
      const quote = meta.tokens.find(t => t.index === pair.tokens[1])
      const value = Number(contexts[i]?.midPx ?? contexts[i]?.markPx)
      if (base && quote?.name === 'USDC' && Number.isFinite(value) && value > 0) prices[base.name] = value
    })
    if (prices.HYPE) prices.WHYPE = prices.HYPE
    return prices
  }, refetchInterval: 30000, staleTime: 15000 })
}
