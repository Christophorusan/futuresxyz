import { useState, useCallback } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { useMarketMeta } from './useMarketMeta'

export function useModifyLeverage() {
  const { exchange } = useHyperliquid()
  const { markets } = useMarketMeta()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateLeverage = useCallback(async (coin: string, leverage: number, isCross: boolean) => {
    if (!exchange) {
      setError('Wallet not connected')
      return false
    }

    const assetIndex = markets.findIndex(m => m.name === coin)
    if (assetIndex === -1) {
      setError(`Market ${coin} not found`)
      return false
    }

    try {
      setUpdating(true)
      setError(null)
      await exchange.updateLeverage({
        asset: assetIndex,
        isCross,
        leverage,
      })
      return true
    } catch (e) {
      console.error('Failed to update leverage:', e)
      setError(e instanceof Error ? e.message : 'Failed to update leverage')
      return false
    } finally {
      setUpdating(false)
    }
  }, [exchange, markets])

  return { updateLeverage, updating, error }
}
