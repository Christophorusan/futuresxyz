import { useState, useCallback } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { useMarketMeta } from './useMarketMeta'
import { BUILDER_ADDRESS, BUILDER_FEE } from '../config/hyperliquid'

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type Tif = 'Gtc' | 'Ioc' | 'Alo'

interface PlaceOrderParams {
  coin: string
  side: OrderSide
  size: string
  orderType: OrderType
  price?: string
  tif?: Tif
  reduceOnly?: boolean
  tpPrice?: string
  slPrice?: string
}

function roundPrice(price: number): string {
  if (price >= 10000) return price.toFixed(0)
  if (price >= 100) return price.toFixed(1)
  if (price >= 1) return price.toFixed(2)
  if (price >= 0.01) return price.toFixed(4)
  return price.toFixed(6)
}

export function usePlaceOrder() {
  const { exchange } = useHyperliquid()
  const { markets } = useMarketMeta()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<unknown>(null)

  const placeOrder = useCallback(async (params: PlaceOrderParams) => {
    if (!exchange) {
      setError('Wallet not connected')
      return null
    }

    try {
      setPlacing(true)
      setError(null)

      const assetIndex = markets.findIndex(m => m.name === params.coin)
      if (assetIndex === -1) {
        setError(`Market ${params.coin} not found`)
        setPlacing(false)
        return null
      }

      const isBuy = params.side === 'buy'
      const isMarket = params.orderType === 'market'

      let limitPx: string
      if (isMarket) {
        if (!params.price || parseFloat(params.price) <= 0) {
          setError('Price unavailable — wait for market data to load')
          setPlacing(false)
          return null
        }
        const px = parseFloat(params.price)
        const slippedPx = isBuy ? px * 1.03 : px * 0.97
        limitPx = roundPrice(slippedPx)
      } else {
        if (!params.price || parseFloat(params.price) <= 0) {
          setError('Enter a valid price for limit order')
          setPlacing(false)
          return null
        }
        limitPx = roundPrice(parseFloat(params.price))
      }

      if (parseFloat(params.size) <= 0) {
        setError('Enter a valid size')
        setPlacing(false)
        return null
      }

      // Check if we need TP/SL trigger orders
      const hasTp = params.tpPrice && parseFloat(params.tpPrice) > 0
      const hasSl = params.slPrice && parseFloat(params.slPrice) > 0

      if (hasTp || hasSl) {
        // Submit main order + TP/SL as grouped orders
        const orders: Array<{
          a: number; b: boolean; p: string; s: string; r: boolean
          t: { limit: { tif: string } } | { trigger: { isMarket: boolean; triggerPx: string; tpsl: string } }
        }> = [
          {
            a: assetIndex,
            b: isBuy,
            p: limitPx,
            s: params.size,
            r: params.reduceOnly ?? false,
            t: { limit: { tif: isMarket ? 'FrontendMarket' : (params.tif || 'Gtc') } },
          },
        ]

        if (hasTp) {
          orders.push({
            a: assetIndex,
            b: !isBuy, // opposite side to close
            p: roundPrice(parseFloat(params.tpPrice!)),
            s: params.size,
            r: true,
            t: { trigger: { isMarket: true, triggerPx: roundPrice(parseFloat(params.tpPrice!)), tpsl: 'tp' } },
          })
        }
        if (hasSl) {
          orders.push({
            a: assetIndex,
            b: !isBuy,
            p: roundPrice(parseFloat(params.slPrice!)),
            s: params.size,
            r: true,
            t: { trigger: { isMarket: true, triggerPx: roundPrice(parseFloat(params.slPrice!)), tpsl: 'sl' } },
          })
        }

        const result = await exchange.order({
          orders: orders as Parameters<typeof exchange.order>[0]['orders'],
          grouping: 'normalTpsl',
          builder: { b: BUILDER_ADDRESS, f: BUILDER_FEE },
        })
        setLastResult(result)
        return result
      } else {
        // Simple order without TP/SL
        const result = await exchange.order({
          orders: [{
            a: assetIndex,
            b: isBuy,
            p: limitPx,
            s: params.size,
            r: params.reduceOnly ?? false,
            t: { limit: { tif: isMarket ? 'FrontendMarket' : (params.tif || 'Gtc') } },
          }],
          grouping: 'na',
          builder: { b: BUILDER_ADDRESS, f: BUILDER_FEE },
        })
        setLastResult(result)
        return result
      }
    } catch (e) {
      console.error('Failed to place order:', e)
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ApiRequestError')) {
        setError('Order rejected by Hyperliquid. Check size, price, and margin.')
      } else if (msg.includes('AbstractWalletError') || msg.includes('signTypedData')) {
        setError('Wallet signature rejected or failed.')
      } else {
        setError(msg)
      }
      return null
    } finally {
      setPlacing(false)
    }
  }, [exchange, markets])

  const cancelOrder = useCallback(async (coin: string, oid: number) => {
    if (!exchange) {
      setError('Wallet not connected')
      return false
    }
    try {
      setError(null)
      const assetIndex = markets.findIndex(m => m.name === coin)
      if (assetIndex === -1) {
        setError(`Market ${coin} not found`)
        return false
      }
      await exchange.cancel({ cancels: [{ a: assetIndex, o: oid }] })
      return true
    } catch (e) {
      console.error('Failed to cancel order:', e)
      setError(e instanceof Error ? e.message : 'Failed to cancel order')
      return false
    }
  }, [exchange, markets])

  const cancelAll = useCallback(async (orders: Array<{ coin: string; oid: number }>) => {
    if (!exchange) {
      setError('Wallet not connected')
      return false
    }
    try {
      setError(null)
      const cancels = orders.map(o => {
        const idx = markets.findIndex(m => m.name === o.coin)
        return { a: idx, o: o.oid }
      }).filter(c => c.a >= 0)

      if (cancels.length === 0) return true
      await exchange.cancel({ cancels })
      return true
    } catch (e) {
      console.error('Failed to cancel orders:', e)
      setError(e instanceof Error ? e.message : 'Failed to cancel orders')
      return false
    }
  }, [exchange, markets])

  return { placeOrder, cancelOrder, cancelAll, placing, error, lastResult, clearError: () => setError(null) }
}
