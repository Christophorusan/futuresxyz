import { useState, useEffect, useCallback, useRef } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'

export interface SpotBalance {
  coin: string
  total: string
  available: string
  usdValue: string
  entryNtl: string
  pnl: string
  pnlPct: string
}

export interface OpenOrder {
  coin: string
  side: 'B' | 'A'
  limitPx: string
  sz: string
  oid: number
  timestamp: number
  origSz: string
  reduceOnly?: boolean
}

export interface Fill {
  coin: string
  side: string
  px: string
  sz: string
  time: number
  fee: string
  oid: number
  crossed: boolean
}

export function useAccountData() {
  const { info, address, isConnected } = useHyperliquid()
  const [spotBalances, setSpotBalances] = useState<SpotBalance[]>([])
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([])
  const [fills, setFills] = useState<Fill[]>([])
  const [loading, setLoading] = useState(false)
  const infoRef = useRef(info)
  const addressRef = useRef(address)

  infoRef.current = info
  addressRef.current = address

  const fetchAll = useCallback(async () => {
    const addr = addressRef.current
    if (!addr) {
      setSpotBalances([])
      setOpenOrders([])
      setFills([])
      return
    }

    try {
      setLoading(true)
      const [spotState, orders, userFills] = await Promise.all([
        infoRef.current.spotClearinghouseState({ user: addr }).catch(() => null),
        infoRef.current.openOrders({ user: addr }).catch(() => []),
        infoRef.current.userFills({ user: addr }).catch(() => []),
      ])

      if (spotState?.balances) {
        const balances: SpotBalance[] = spotState.balances
          .filter((b: { total: string }) => parseFloat(b.total) > 0)
          .map((b: { coin: string; total: string; hold: string; entryNtl: string }) => {
            const total = parseFloat(b.total)
            const hold = parseFloat(b.hold)
            const available = total - hold
            const entryNtl = parseFloat(b.entryNtl || '0')
            const isStable = ['USDC', 'USDT', 'USDH'].includes(b.coin)
            const usdValue = isStable ? total : entryNtl
            return {
              coin: b.coin,
              total: b.total,
              available: available.toString(),
              usdValue: usdValue.toFixed(2),
              entryNtl: b.entryNtl || '0',
              pnl: '0',
              pnlPct: '0',
            }
          })
        setSpotBalances(balances)
      }

      setOpenOrders(orders as OpenOrder[])
      setFills((userFills as Fill[]).slice(0, 50))
    } catch (e) {
      console.error('Failed to fetch account data:', e)
    } finally {
      setLoading(false)
    }
  }, []) // No deps — uses refs

  useEffect(() => {
    if (!isConnected) {
      setSpotBalances([])
      setOpenOrders([])
      setFills([])
      return
    }
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [isConnected, address, fetchAll])

  return { spotBalances, openOrders, fills, loading, refetch: fetchAll }
}
