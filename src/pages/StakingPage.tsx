import { useState } from 'react'

const VALIDATORS = [
  { name: 'HyperBeat', apy: '4.8%', staked: '12.4M', commission: '5%', url: 'https://app.hyperbeat.org/staking' },
  { name: 'Nansen', apy: '4.6%', staked: '8.1M', commission: '8%', url: 'https://app.hyperbeat.org/staking' },
  { name: 'Chorus One', apy: '4.5%', staked: '6.7M', commission: '10%', url: 'https://app.hyperbeat.org/staking' },
  { name: 'Figment', apy: '4.4%', staked: '5.2M', commission: '10%', url: 'https://app.hyperbeat.org/staking' },
]

export function StakingPage() {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake')

  return (
    <div className="protocol-page">
      <div className="protocol-main">
        {/* Left: Stats + Validators table */}
        <div className="protocol-content">
          <div className="protocol-stats-row">
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">HYPE Price</span>
              <span className="protocol-stat-value">$14.82</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">stHYPE APY</span>
              <span className="protocol-stat-value green">4.8%</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total Staked</span>
              <span className="protocol-stat-value">32.4M HYPE</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">stHYPE / HYPE</span>
              <span className="protocol-stat-value">1.024</span>
            </div>
          </div>

          <div className="protocol-table-section">
            <div className="protocol-table-title">Validators</div>
            <div className="protocol-table">
              <div className="protocol-table-header">
                <span>Validator</span>
                <span>APY</span>
                <span>Total Staked</span>
                <span>Commission</span>
                <span></span>
              </div>
              {VALIDATORS.map(v => (
                <div key={v.name} className="protocol-table-row">
                  <span className="protocol-cell-name">{v.name}</span>
                  <span className="green">{v.apy}</span>
                  <span>{v.staked} HYPE</span>
                  <span>{v.commission}</span>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="protocol-action-link">Stake</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Stake/Unstake panel */}
        <div className="protocol-panel">
          <div className="protocol-panel-title">Liquid Staking</div>
          <div className="protocol-panel-sub">Powered by HyperBeat</div>

          <div className="trade-type-toggle">
            <button className={`trade-type-btn ${mode === 'stake' ? 'active' : ''}`} onClick={() => setMode('stake')}>Stake</button>
            <button className={`trade-type-btn ${mode === 'unstake' ? 'active' : ''}`} onClick={() => setMode('unstake')}>Unstake</button>
          </div>

          <div className="trade-input-group">
            <div className="tp-info-row" style={{ marginBottom: 4 }}>
              <span>Amount</span>
              <span>Balance: 0.00 {mode === 'stake' ? 'HYPE' : 'stHYPE'}</span>
            </div>
            <div className="trade-input-wrapper">
              <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
              <span className="trade-input-unit">{mode === 'stake' ? 'HYPE' : 'stHYPE'}</span>
            </div>
          </div>

          <div className="tp-summary">
            <div className="tp-summary-row">
              <span>You receive</span>
              <span>{amount ? `${(parseFloat(amount) * (mode === 'stake' ? 0.976 : 1.024)).toFixed(4)}` : '0.00'} {mode === 'stake' ? 'stHYPE' : 'HYPE'}</span>
            </div>
            <div className="tp-summary-row">
              <span>Exchange rate</span>
              <span>1 stHYPE = 1.024 HYPE</span>
            </div>
            <div className="tp-summary-row">
              <span>APY</span>
              <span className="green">4.8%</span>
            </div>
          </div>

          <a href="https://app.hyperbeat.org/staking" target="_blank" rel="noopener noreferrer" className="trade-submit buy" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            {mode === 'stake' ? 'Stake on HyperBeat' : 'Unstake on HyperBeat'}
          </a>
        </div>
      </div>
    </div>
  )
}
