import { useState } from 'react'

const MARKETS = [
  { asset: 'USDC', supplyApy: '3.2%', borrowApy: '5.1%', totalSupply: '$42.1M', totalBorrow: '$28.3M', utilization: '67%' },
  { asset: 'HYPE', supplyApy: '1.8%', borrowApy: '4.2%', totalSupply: '$18.7M', totalBorrow: '$8.4M', utilization: '45%' },
  { asset: 'ETH', supplyApy: '2.1%', borrowApy: '4.8%', totalSupply: '$31.2M', totalBorrow: '$15.6M', utilization: '50%' },
  { asset: 'BTC', supplyApy: '0.8%', borrowApy: '3.5%', totalSupply: '$55.4M', totalBorrow: '$12.1M', utilization: '22%' },
  { asset: 'stHYPE', supplyApy: '2.4%', borrowApy: '5.6%', totalSupply: '$9.8M', totalBorrow: '$4.2M', utilization: '43%' },
]

export function LendingPage() {
  const [mode, setMode] = useState<'supply' | 'borrow'>('supply')
  const [selectedAsset, setSelectedAsset] = useState('USDC')
  const [amount, setAmount] = useState('')

  const market = MARKETS.find(m => m.asset === selectedAsset)!

  return (
    <div className="protocol-page">
      <div className="protocol-main">
        <div className="protocol-content">
          <div className="protocol-stats-row">
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total Supply</span>
              <span className="protocol-stat-value">$157.2M</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total Borrow</span>
              <span className="protocol-stat-value">$68.6M</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Markets</span>
              <span className="protocol-stat-value">{MARKETS.length}</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Avg Utilization</span>
              <span className="protocol-stat-value">45.4%</span>
            </div>
          </div>

          <div className="protocol-table-section">
            <div className="protocol-table-title">Markets</div>
            <div className="protocol-table">
              <div className="protocol-table-header">
                <span>Asset</span>
                <span>Supply APY</span>
                <span>Borrow APY</span>
                <span>Total Supply</span>
                <span>Total Borrow</span>
                <span>Utilization</span>
              </div>
              {MARKETS.map(m => (
                <button key={m.asset} className={`protocol-table-row ${m.asset === selectedAsset ? 'active' : ''}`} onClick={() => setSelectedAsset(m.asset)}>
                  <span className="protocol-cell-name">{m.asset}</span>
                  <span className="green">{m.supplyApy}</span>
                  <span>{m.borrowApy}</span>
                  <span>{m.totalSupply}</span>
                  <span>{m.totalBorrow}</span>
                  <span>{m.utilization}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="protocol-panel">
          <div className="protocol-panel-title">{selectedAsset}</div>
          <div className="protocol-panel-sub">Powered by HyperLend</div>

          <div className="trade-type-toggle">
            <button className={`trade-type-btn ${mode === 'supply' ? 'active' : ''}`} onClick={() => setMode('supply')}>Supply</button>
            <button className={`trade-type-btn ${mode === 'borrow' ? 'active' : ''}`} onClick={() => setMode('borrow')}>Borrow</button>
          </div>

          <div className="trade-input-group">
            <div className="tp-info-row" style={{ marginBottom: 4 }}>
              <span>Amount</span>
              <span>Balance: 0.00 {selectedAsset}</span>
            </div>
            <div className="trade-input-wrapper">
              <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
              <span className="trade-input-unit">{selectedAsset}</span>
            </div>
          </div>

          <div className="tp-summary">
            <div className="tp-summary-row">
              <span>{mode === 'supply' ? 'Supply APY' : 'Borrow APY'}</span>
              <span className={mode === 'supply' ? 'green' : ''}>{mode === 'supply' ? market.supplyApy : market.borrowApy}</span>
            </div>
            <div className="tp-summary-row">
              <span>Utilization</span>
              <span>{market.utilization}</span>
            </div>
            <div className="tp-summary-row">
              <span>Total {mode === 'supply' ? 'Supply' : 'Borrow'}</span>
              <span>{mode === 'supply' ? market.totalSupply : market.totalBorrow}</span>
            </div>
          </div>

          <a href="https://app.hyperlend.finance/dashboard" target="_blank" rel="noopener noreferrer" className={`trade-submit ${mode === 'supply' ? 'buy' : 'sell'}`} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            {mode === 'supply' ? `Supply ${selectedAsset}` : `Borrow ${selectedAsset}`} on HyperLend
          </a>
        </div>
      </div>
    </div>
  )
}
