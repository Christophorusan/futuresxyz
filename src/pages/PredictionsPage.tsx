import { useState } from 'react'

const EVENTS = [
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', endDate: 'Apr 30', category: 'Crypto' },
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', endDate: 'Jun 30', category: 'Crypto' },
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', endDate: 'May 7', category: 'Macro' },
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', endDate: 'Jun 30', category: 'Crypto' },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', endDate: 'Dec 31', category: 'Crypto' },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', endDate: 'Dec 31', category: 'Macro' },
]

export function PredictionsPage() {
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0])
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<'all' | 'Crypto' | 'Macro'>('all')

  const filtered = category === 'all' ? EVENTS : EVENTS.filter(e => e.category === category)

  return (
    <div className="protocol-page">
      <div className="protocol-main">
        <div className="protocol-content">
          <div className="protocol-stats-row">
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Open Markets</span>
              <span className="protocol-stat-value">{EVENTS.length}</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total Volume</span>
              <span className="protocol-stat-value">$8.4M</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Active Traders</span>
              <span className="protocol-stat-value">1,247</span>
            </div>
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Protocol</span>
              <span className="protocol-stat-value">Outcome</span>
            </div>
          </div>

          <div className="protocol-table-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="protocol-table-title" style={{ marginBottom: 0 }}>Markets</div>
              <div className="trade-type-toggle" style={{ width: 'auto' }}>
                <button className={`trade-type-btn ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>All</button>
                <button className={`trade-type-btn ${category === 'Crypto' ? 'active' : ''}`} onClick={() => setCategory('Crypto')}>Crypto</button>
                <button className={`trade-type-btn ${category === 'Macro' ? 'active' : ''}`} onClick={() => setCategory('Macro')}>Macro</button>
              </div>
            </div>
            <div className="protocol-table">
              <div className="protocol-table-header">
                <span style={{ flex: 2 }}>Event</span>
                <span>YES</span>
                <span>NO</span>
                <span>Volume</span>
                <span>Ends</span>
              </div>
              {filtered.map(e => (
                <button key={e.id} className={`protocol-table-row ${e.id === selectedEvent.id ? 'active' : ''}`} onClick={() => setSelectedEvent(e)}>
                  <span className="protocol-cell-name" style={{ flex: 2 }}>{e.title}</span>
                  <span className="green">{(e.yesPrice * 100).toFixed(0)}c</span>
                  <span className="red">{((1 - e.yesPrice) * 100).toFixed(0)}c</span>
                  <span>{e.volume}</span>
                  <span>{e.endDate}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="protocol-panel">
          <div className="protocol-panel-title" style={{ fontSize: 14, lineHeight: 1.4 }}>{selectedEvent.title}</div>
          <div className="protocol-panel-sub">Powered by Outcome</div>

          <div className="trade-side-toggle">
            <button className={`trade-side-btn ${side === 'yes' ? 'active buy' : ''}`} onClick={() => setSide('yes')}>YES {(selectedEvent.yesPrice * 100).toFixed(0)}c</button>
            <button className={`trade-side-btn ${side === 'no' ? 'active sell' : ''}`} onClick={() => setSide('no')}>NO {((1 - selectedEvent.yesPrice) * 100).toFixed(0)}c</button>
          </div>

          <div className="trade-input-group">
            <div className="tp-info-row" style={{ marginBottom: 4 }}>
              <span>Amount</span>
              <span>Balance: 0.00 USDC</span>
            </div>
            <div className="trade-input-wrapper">
              <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
              <span className="trade-input-unit">USDC</span>
            </div>
          </div>

          <div className="tp-summary">
            <div className="tp-summary-row">
              <span>Shares</span>
              <span>{amount ? (parseFloat(amount) / (side === 'yes' ? selectedEvent.yesPrice : 1 - selectedEvent.yesPrice)).toFixed(1) : '0'}</span>
            </div>
            <div className="tp-summary-row">
              <span>Potential payout</span>
              <span className="green">{amount ? `$${(parseFloat(amount) / (side === 'yes' ? selectedEvent.yesPrice : 1 - selectedEvent.yesPrice)).toFixed(2)}` : '$0.00'}</span>
            </div>
            <div className="tp-summary-row">
              <span>Ends</span>
              <span>{selectedEvent.endDate}</span>
            </div>
          </div>

          <a href="https://testnet.outcome.xyz/events" target="_blank" rel="noopener noreferrer" className={`trade-submit ${side === 'yes' ? 'buy' : 'sell'}`} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Buy {side.toUpperCase()} on Outcome
          </a>
        </div>
      </div>
    </div>
  )
}
