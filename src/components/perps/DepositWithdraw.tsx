import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useHyperliquid } from '../../contexts/HyperliquidContext'
import { useUserState } from '../../hooks/useUserState'

type Mode = 'deposit' | 'withdraw'

export function DepositWithdraw() {
  const { address, isConnected } = useAccount()
  const { exchange } = useHyperliquid()
  const { state, refetch } = useUserState()
  const [mode, setMode] = useState<Mode>('deposit')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isConnected) return null

  const handleTransfer = async () => {
    if (!exchange || !amount || parseFloat(amount) <= 0) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      if (mode === 'deposit') {
        // Spot → Perps: usdClassTransfer with toPerp: true
        await exchange.usdClassTransfer({
          amount: parseFloat(amount),
          toPerp: true,
        })
        setSuccess(`Deposited $${amount} to Perps`)
      } else {
        // Perps → Spot: usdClassTransfer with toPerp: false
        await exchange.usdClassTransfer({
          amount: parseFloat(amount),
          toPerp: false,
        })
        setSuccess(`Withdrew $${amount} to Spot`)
      }

      setAmount('')
      refetch()
    } catch (e) {
      console.error('Transfer failed:', e)
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Insufficient')) {
        setError(`Insufficient balance. Check your ${mode === 'deposit' ? 'Spot' : 'Perps'} account.`)
      } else {
        setError(msg || 'Transfer failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawToEVM = async () => {
    if (!exchange || !address || !amount || parseFloat(amount) <= 0) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await exchange.withdraw3({
        amount,
        destination: address,
      })
      setSuccess(`Withdrew $${amount} to HyperEVM`)
      setAmount('')
      refetch()
    } catch (e) {
      console.error('EVM withdrawal failed:', e)
      setError(e instanceof Error ? e.message : 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dw-module">
      <div className="dw-title">Transfer</div>

      {/* Mode toggle */}
      <div className="dw-toggle">
        <button className={`dw-toggle-btn ${mode === 'deposit' ? 'active' : ''}`} onClick={() => setMode('deposit')}>
          Deposit
        </button>
        <button className={`dw-toggle-btn ${mode === 'withdraw' ? 'active' : ''}`} onClick={() => setMode('withdraw')}>
          Withdraw
        </button>
      </div>

      {/* Amount */}
      <div className="dw-input-group">
        <div className="dw-input-label">
          <span>Amount (USDC)</span>
          {state && (
            <span className="dw-balance" onClick={() => setAmount(state.withdrawable)}>
              Available: ${parseFloat(state.withdrawable).toFixed(2)}
            </span>
          )}
        </div>
        <div className="trade-input-wrapper">
          <input
            type="number"
            className="trade-input"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            step="any"
          />
          <span className="trade-input-unit">USDC</span>
        </div>
      </div>

      <button
        className="dw-btn"
        onClick={handleTransfer}
        disabled={loading || !amount || parseFloat(amount) <= 0}
      >
        {loading ? 'Processing...' : mode === 'deposit' ? 'Spot → Perps' : 'Perps → Spot'}
      </button>

      {mode === 'withdraw' && (
        <button
          className="dw-btn dw-btn-secondary"
          onClick={handleWithdrawToEVM}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          style={{ marginTop: 8 }}
        >
          {loading ? 'Processing...' : 'Withdraw to HyperEVM'}
        </button>
      )}

      {error && <div className="trade-error">{error}</div>}
      {success && <div className="dw-success">{success}</div>}
    </div>
  )
}
