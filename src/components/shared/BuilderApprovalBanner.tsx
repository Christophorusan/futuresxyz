import { useState } from 'react'
import { useBuilderApproval } from '../../hooks/useBuilderApproval'
import { useAccount } from 'wagmi'

export function BuilderApprovalBanner() {
  const { isConnected } = useAccount()
  const { isApproved, checking, approving, error, approve } = useBuilderApproval()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('builder-dismissed') === 'true')

  // Don't show if not connected, already approved, still checking, or dismissed
  if (!isConnected || isApproved || checking || dismissed) return null

  return (
    <div className="builder-banner">
      <div className="builder-banner-text">
        <span className="builder-banner-title">Enable Trading</span>
        <span className="builder-banner-desc">
          One-time gasless signature to trade through Futuresxyz.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="builder-banner-btn"
          onClick={approve}
          disabled={approving}
        >
          {approving ? 'Signing...' : 'Approve'}
        </button>
        <button
          className="builder-banner-btn"
          style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
          onClick={() => { setDismissed(true); sessionStorage.setItem('builder-dismissed', 'true') }}
        >
          Later
        </button>
      </div>
      {error && <div className="builder-banner-error">{error}</div>}
    </div>
  )
}
