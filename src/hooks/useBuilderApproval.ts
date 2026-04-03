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

      const feePercent = `${(BUILDER_FEE / 1000).toFixed(4)}%`

      await exchange.approveBuilderFee({
        maxFeeRate: feePercent,
        builder: BUILDER_ADDRESS,
      })

      setIsApproved(true)
    } catch (e) {
      console.error('Failed to approve builder fee:', e)
      setError('Signature rejected or failed.')
    } finally {
      setApproving(false)
    }
  }, [exchange])

  return { isApproved, checking, approving, error, approve }
}
