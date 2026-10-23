import { orderPrice, orderSize, orderOutcome } from '../lib/orderValidation'
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
  leverage?: number
}

export function usePlaceOrder() {
  const { exchange } = useHyperliquid()
  const { markets } = useMarketMeta()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<unknown>(null)

  const placeOrder = useCallback(async (params: PlaceOrderParams) => {
    if (!exchange) {
      setError('Wallet not connected. Switch to Arbitrum and reconnect.')
      return null
    }

    try {
      setPlacing(true)
      setError(null)

      // Strip -PERP suffix if present
      const coin = params.coin.replace('-PERP', '')

      const assetIndex = markets.findIndex(m => m.name === coin)
      if (assetIndex === -1) {
        setError(`Market ${coin} not found`)
        setPlacing(false)
        return null
      }

      const market = markets[assetIndex]
      const roundPrice = (price: number) => orderPrice(price, market.szDecimals)
      const isBuy = params.side === 'buy'
      const isMarket = params.orderType === 'market'

      // Update leverage if provided
      if (params.leverage && params.leverage > 0) {
        try {
          await exchange.updateLeverage({
            asset: assetIndex,
            isCross: true,
            leverage: params.leverage,
          })
        } catch (e) {
          throw new Error(`Leverage update failed: ${e instanceof Error ? e.message : 'try again'}`)
        }
      }

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

      // Round size to szDecimals
      const rawSize = parseFloat(params.size)
      if (rawSize <= 0) {
        setError('Enter a valid size')
        setPlacing(false)
        return null
      }
      const roundedSize = orderSize(rawSize, market.szDecimals)

      // Check if we need TP/SL trigger orders
      const hasTp = params.tpPrice && parseFloat(params.tpPrice) > 0
      const hasSl = params.slPrice && parseFloat(params.slPrice) > 0

      if (hasTp || hasSl) {
        const orders: Array<{
          a: number; b: boolean; p: string; s: string; r: boolean
          t: { limit: { tif: string } } | { trigger: { isMarket: boolean; triggerPx: string; tpsl: string } }
        }> = [
          {
            a: assetIndex,
            b: isBuy,
            p: limitPx,
            s: roundedSize,
            r: params.reduceOnly ?? false,
            t: { limit: { tif: isMarket ? 'Ioc' : (params.tif || 'Gtc') } },
          },
        ]

        if (hasTp) {
          orders.push({
            a: assetIndex,
            b: !isBuy,
            p: roundPrice(parseFloat(params.tpPrice!)),
            s: roundedSize,
            r: true,
            t: { trigger: { isMarket: true, triggerPx: roundPrice(parseFloat(params.tpPrice!)), tpsl: 'tp' } },
          })
        }
        if (hasSl) {
          orders.push({
            a: assetIndex,
            b: !isBuy,
            p: roundPrice(parseFloat(params.slPrice!)),
            s: roundedSize,
            r: true,
            t: { trigger: { isMarket: true, triggerPx: roundPrice(parseFloat(params.slPrice!)), tpsl: 'sl' } },
          })
        }

        const result = await exchange.order({
          orders: orders as Parameters<typeof exchange.order>[0]['orders'],
          grouping: 'normalTpsl',
          builder: { b: BUILDER_ADDRESS, f: BUILDER_FEE },
        })
        orderOutcome(result)
        setLastResult(result)
        return result
      } else {
        const result = await exchange.order({
          orders: [{
            a: assetIndex,
            b: isBuy,
            p: limitPx,
            s: roundedSize,
            r: params.reduceOnly ?? false,
            t: { limit: { tif: isMarket ? 'Ioc' : (params.tif || 'Gtc') } },
          }],
          grouping: 'na',
          builder: { b: BUILDER_ADDRESS, f: BUILDER_FEE },
        })
        orderOutcome(result)
        setLastResult(result)
        return result
      }
    } catch (e) {
      console.error('Failed to place order:', e)
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ApiRequestError')) {
        setError('Order rejected. Check size, price, and margin.')
      } else if (msg.includes('AbstractWalletError') || msg.includes('signTypedData') || msg.includes('viem wallet')) {
        setError('Wallet signing failed. Switch to Arbitrum chain and try again.')
      } else if (msg.includes('insufficient')) {
        setError('Insufficient balance for this order.')
      } else {
        setError(msg.slice(0, 150))
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
