import { useState } from 'react'

const MARKETS = [
  { asset: 'BTC', expiry: 'Apr 25', strike: '$70,000', type: 'Call', premium: '$1,240', iv: '52%', oi: '$4.2M' },
  { asset: 'BTC', expiry: 'Apr 25', strike: '$68,000', type: 'Put', premium: '$890', iv: '48%', oi: '$3.1M' },
  { asset: 'BTC', expiry: 'May 30', strike: '$75,000', type: 'Call', premium: '$2,100', iv: '55%', oi: '$5.8M' },
  { asset: 'ETH', expiry: 'Apr 25', strike: '$2,200', type: 'Call', premium: '$85', iv: '58%', oi: '$2.4M' },
  { asset: 'ETH', expiry: 'Apr 25', strike: '$2,000', type: 'Put', premium: '$62', iv: '54%', oi: '$1.8M' },
  { asset: 'ETH', expiry: 'May 30', strike: '$2,500', type: 'Call', premium: '$140', iv: '60%', oi: '$3.2M' },
  { asset: 'HYPE', expiry: 'Apr 25', strike: '$40', type: 'Call', premium: '$2.80', iv: '72%', oi: '$890K' },
  { asset: 'HYPE', expiry: 'Apr 25', strike: '$30', type: 'Put', premium: '$1.50', iv: '68%', oi: '$620K' },
]

export function OptionsPage() {
  const [asset, setAsset] = useState<'all' | 'BTC' | 'ETH' | 'HYPE'>('all')
  const [optionType, setOptionType] = useState<'all' | 'Call' | 'Put'>('all')

  const filtered = MARKETS
    .filter(m => asset === 'all' || m.asset === asset)
    .filter(m => optionType === 'all' || m.type === optionType)

  return (
    <div className="pred-page">
      <div className="pred-topbar">
        <button className={`pred-topbar-tab ${asset === 'all' ? 'active' : ''}`} onClick={() => setAsset('all')}>All</button>
        <button className={`pred-topbar-tab ${asset === 'BTC' ? 'active' : ''}`} onClick={() => setAsset('BTC')}>BTC</button>
        <button className={`pred-topbar-tab ${asset === 'ETH' ? 'active' : ''}`} onClick={() => setAsset('ETH')}>ETH</button>
        <button className={`pred-topbar-tab ${asset === 'HYPE' ? 'active' : ''}`} onClick={() => setAsset('HYPE')}>HYPE</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <button className={`pred-topbar-tab ${optionType === 'all' ? 'active' : ''}`} onClick={() => setOptionType('all')}>All</button>
          <button className={`pred-topbar-tab ${optionType === 'Call' ? 'active' : ''}`} onClick={() => setOptionType('Call')}>Calls</button>
          <button className={`pred-topbar-tab ${optionType === 'Put' ? 'active' : ''}`} onClick={() => setOptionType('Put')}>Puts</button>
        </div>
      </div>

      <div className="pred-layout">
        <div className="pred-main" style={{ padding: 8 }}>
          <div className="protocol-stats-row" style={{ marginBottom: 12 }}>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Protocol</span>
              <span className="protocol-stat-value">Rysk</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total OI</span>
              <span className="protocol-stat-value">$22.1M</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Markets</span>
              <span className="protocol-stat-value">{filtered.length}</span>
            </div>
          </div>

          <div className="lending-protocol-section">
            <div className="lending-protocol-header">
              <span className="lending-protocol-name">Rysk Finance</span>
              <span className="lending-protocol-desc">Options on HyperEVM</span>
              <a href="https://app.rysk.finance/" target="_blank" rel="noopener noreferrer" className="protocol-action-link">Open App</a>
            </div>
            <div className="protocol-table">
              <div className="protocol-table-header" style={{ gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 1fr 0.8fr 1fr' }}>
                <span>Asset</span>
                <span>Expiry</span>
                <span>Strike</span>
                <span>Type</span>
                <span>Premium</span>
                <span>IV</span>
                <span>Open Interest</span>
              </div>
              {filtered.map((m, i) => (
                <a key={i} href="https://app.rysk.finance/" target="_blank" rel="noopener noreferrer"
                  className="protocol-table-row" style={{ gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 1fr 0.8fr 1fr', textDecoration: 'none' }}>
                  <span className="protocol-cell-name">{m.asset}</span>
                  <span>{m.expiry}</span>
                  <span>{m.strike}</span>
                  <span className={m.type === 'Call' ? 'green' : 'red'}>{m.type}</span>
                  <span>{m.premium}</span>
                  <span>{m.iv}</span>
                  <span>{m.oi}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pred-sidebar">
          <div className="pred-hot-card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)', marginBottom: 8 }}>Trade Options</div>
            <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>Powered by Rysk Finance on HyperEVM</div>
            <a href="https://app.rysk.finance/" target="_blank" rel="noopener noreferrer" className="trade-submit buy" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>Launch Rysk</a>
          </div>
        </div>
      </div>
    </div>
  )
}
