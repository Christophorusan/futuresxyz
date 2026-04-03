import { useState, useEffect, useCallback } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { BUILDER_ADDRESS, BUILDER_FEE } from '../config/hyperliquid'

export function useBuilderApproval() {
  const { info, exchange, address, isConnected } = useHyperliquid()
  const [isApproved, setIsApproved] = useState(false)
  const [checking, setChecking] = useState(true)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkApproval = useCallback(async () => {
    if (!address || !isConnected) {
      setIsApproved(false)
      setChecking(false)
      return
    }

    try {
      setChecking(true)
      const maxFee = await info.maxBuilderFee({
        user: address,
        builder: BUILDER_ADDRESS,
      })
      setIsApproved(typeof maxFee === 'string' ? parseFloat(maxFee) > 0 : Number(maxFee) > 0)
    } catch {
      // If the check fails, assume not approved but don't block
      setIsApproved(false)
    } finally {
      setChecking(false)
    }
  }, [info, address, isConnected])

  useEffect(() => {
    checkApproval()
  }, [checkApproval])

  const approve = useCallback(async () => {
    if (!exchange) {
      setError('Wallet not connected')
      return
    }

    try {
      setApproving(true)
      setError(null)

      // BUILDER_FEE is in tenths of basis points (30 = 3 bps = 0.03%)
      // maxFeeRate needs to be a string like "0.03%"
      const feePercent = `${(BUILDER_FEE / 1000).toFixed(2)}%`

      await exchange.approveBuilderFee({
        maxFeeRate: feePercent as `${string}%`,
        builder: BUILDER_ADDRESS,
      })

      setIsApproved(true)
    } catch (e) {
      console.error('Failed to approve builder fee:', e)
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('rejected') || msg.includes('denied')) {
        setError('Signature rejected by wallet.')
      } else {
        setError(`Approval failed: ${msg.slice(0, 100)}`)
      }
    } finally {
      setApproving(false)
    }
  }, [exchange])

  return { isApproved, checking, approving, error, approve }
}
