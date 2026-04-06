import { useState } from 'react'

const VAULTS = [
  { collateral: 'HYPE', minted: '$4.2M', collRatio: '185%', minRatio: '150%', fee: '0.5%' },
  { collateral: 'stHYPE', minted: '$2.8M', collRatio: '192%', minRatio: '150%', fee: '0.5%' },
  { collateral: 'ETH', minted: '$6.1M', collRatio: '210%', minRatio: '160%', fee: '0.3%' },
  { collateral: 'BTC', minted: '$8.5M', collRatio: '225%', minRatio: '170%', fee: '0.3%' },
]

export function CDPPage() {
  const [mode, setMode] = useState<'mint' | 'repay'>('mint')
  const [selectedVault, setSelectedVault] = useState('HYPE')
  const [amount, setAmount] = useState('')

  const vault = VAULTS.find(v => v.collateral === selectedVault)!

  return (
    <div className="protocol-page">
      <div className="protocol-main">
        <div className="protocol-content">
          <div className="protocol-stats-row">
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">feUSD Price</span>
              <span className="protocol-stat-value">$1.00</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total feUSD Minted</span>
              <span className="protocol-stat-value">$21.6M</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">TVL</span>
              <span className="protocol-stat-value">$45.2M</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Avg Coll. Ratio</span>
              <span className="protocol-stat-value green">203%</span>
            </div>
          </div>

          <div className="protocol-table-section">
            <div className="protocol-table-title">Vaults</div>
            <div className="protocol-table">
              <div className="protocol-table-header">
                <span>Collateral</span>
                <span>feUSD Minted</span>
                <span>Coll. Ratio</span>
                <span>Min Ratio</span>
                <span>Minting Fee</span>
              </div>
              {VAULTS.map(v => (
                <button key={v.collateral} className={`protocol-table-row ${v.collateral === selectedVault ? 'active' : ''}`} onClick={() => setSelectedVault(v.collateral)}>
                  <span className="protocol-cell-name">{v.collateral}</span>
                  <span>{v.minted}</span>
                  <span className="green">{v.collRatio}</span>
                  <span>{v.minRatio}</span>
                  <span>{v.fee}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="protocol-panel">
          <div className="protocol-panel-title">{selectedVault} Vault</div>
          <div className="protocol-panel-sub">Powered by Felix</div>

          <div className="trade-type-toggle">
            <button className={`trade-type-btn ${mode === 'mint' ? 'active' : ''}`} onClick={() => setMode('mint')}>Mint feUSD</button>
            <button className={`trade-type-btn ${mode === 'repay' ? 'active' : ''}`} onClick={() => setMode('repay')}>Repay</button>
          </div>

          <div className="trade-input-group">
            <div className="tp-info-row" style={{ marginBottom: 4 }}>
              <span>{mode === 'mint' ? 'Collateral' : 'Repay Amount'}</span>
              <span>Balance: 0.00 {mode === 'mint' ? selectedVault : 'feUSD'}</span>
            </div>
            <div className="trade-input-wrapper">
              <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
              <span className="trade-input-unit">{mode === 'mint' ? selectedVault : 'feUSD'}</span>
            </div>
          </div>

          <div className="tp-summary">
            <div className="tp-summary-row">
              <span>Collateralization</span>
              <span className="green">{vault.collRatio}</span>
            </div>
            <div className="tp-summary-row">
              <span>Min Ratio</span>
              <span>{vault.minRatio}</span>
            </div>
            <div className="tp-summary-row">
              <span>Minting Fee</span>
              <span>{vault.fee}</span>
            </div>
          </div>

          <a href="https://www.usefelix.xyz/portfolio" target="_blank" rel="noopener noreferrer" className="trade-submit buy" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            {mode === 'mint' ? 'Mint feUSD' : 'Repay feUSD'} on Felix
          </a>
        </div>
      </div>
    </div>
  )
}
