import { useState, useEffect, useCallback, useRef } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'

export interface Position {
  coin: string
  szi: string
  entryPx: string
  positionValue: string
  unrealizedPnl: string
  returnOnEquity: string
  liquidationPx: string | null
  leverage: { type: string; value: number }
  marginUsed: string
}

export interface UserState {
  // Unified balance (perps + spot USDC)
  totalBalance: string
  accountValue: string
  totalMarginUsed: string
  totalNtlPos: string
  withdrawable: string
  // Spot USDC available
  spotUSDC: string
  positions: Position[]
}

export function useUserState() {
  const { info, address, isConnected } = useHyperliquid()
  const [state, setState] = useState<UserState | null>(null)
  const [loading, setLoading] = useState(false)
  const infoRef = useRef(info)
  const addressRef = useRef(address)

  infoRef.current = info
  addressRef.current = address

  const fetchState = useCallback(async () => {
    const addr = addressRef.current?.toLowerCase() as `0x${string}` | undefined
    if (!addr) {
      setState(null)
      return
    }

    try {
      setLoading(true)

      // Fetch both perps and spot state in parallel
      const [perpsRaw, spotRaw] = await Promise.all([
        infoRef.current.clearinghouseState({ user: addr }).catch(() => null),
        infoRef.current.spotClearinghouseState({ user: addr }).catch(() => null),
      ])

      // Perps data
      const perpsWithdrawable = perpsRaw?.withdrawable ? parseFloat(perpsRaw.withdrawable) : 0
      const accountValue = perpsRaw?.marginSummary?.accountValue ?? '0'
      const totalMarginUsed = perpsRaw?.marginSummary?.totalMarginUsed ?? '0'
      const totalNtlPos = perpsRaw?.marginSummary?.totalNtlPos ?? '0'

      // Spot USDC balance
      let spotUSDC = 0
      if (spotRaw?.balances) {
        const usdcBalance = spotRaw.balances.find(
          (b: { coin: string }) => b.coin === 'USDC'
        )
        if (usdcBalance) {
          spotUSDC = parseFloat(usdcBalance.total) - parseFloat(usdcBalance.hold || '0')
        }
      }

      // Unified balance = perps withdrawable + spot USDC
      const totalBalance = perpsWithdrawable + spotUSDC

      const positions: Position[] = (perpsRaw?.assetPositions || [])
        .filter((p: { position: { szi: string } }) => parseFloat(p.position.szi) !== 0)
        .map((p: { position: Record<string, unknown> }) => ({
          coin: p.position.coin as string,
          szi: p.position.szi as string,
          entryPx: p.position.entryPx as string,
          positionValue: p.position.positionValue as string,
          unrealizedPnl: p.position.unrealizedPnl as string,
          returnOnEquity: p.position.returnOnEquity as string,
          liquidationPx: p.position.liquidationPx as string | null,
          leverage: p.position.leverage as { type: string; value: number },
          marginUsed: p.position.marginUsed as string,
        }))

      setState({
        totalBalance: totalBalance.toFixed(2),
        accountValue,
        totalMarginUsed,
        totalNtlPos,
        withdrawable: perpsRaw?.withdrawable ?? '0',
        spotUSDC: spotUSDC.toFixed(2),
        positions,
      })
    } catch (e) {
      console.error('Failed to fetch user state:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isConnected) {
      setState(null)
      return
    }
    fetchState()
    const interval = setInterval(fetchState, 15000)
    return () => clearInterval(interval)
  }, [isConnected, address, fetchState])

  return { state, loading, refetch: fetchState }
}
