import { useState } from 'react'

const EVENTS = [
  { id: 1, title: 'BTC above $70k by end of April?', yesPrice: 0.62, volume: '$1.2M', endDate: 'Apr 30', category: 'Crypto' },
  { id: 2, title: 'ETH above $4k by Q2 2026?', yesPrice: 0.34, volume: '$890K', endDate: 'Jun 30', category: 'Crypto' },
  { id: 3, title: 'Fed rate cut in May 2026?', yesPrice: 0.71, volume: '$2.4M', endDate: 'May 7', category: 'Macro' },
  { id: 4, title: 'HYPE above $20 by June?', yesPrice: 0.45, volume: '$520K', endDate: 'Jun 30', category: 'Crypto' },
  { id: 5, title: 'SOL flips ETH in TVL?', yesPrice: 0.12, volume: '$340K', endDate: 'Dec 31', category: 'Crypto' },
  { id: 6, title: 'US recession in 2026?', yesPrice: 0.28, volume: '$3.1M', endDate: 'Dec 31', category: 'Macro' },
  { id: 7, title: 'Bitcoin ETF inflows exceed $50B?', yesPrice: 0.58, volume: '$1.8M', endDate: 'Dec 31', category: 'Crypto' },
  { id: 8, title: 'Hyperliquid top 3 DEX by volume?', yesPrice: 0.76, volume: '$680K', endDate: 'Dec 31', category: 'Crypto' },
  { id: 9, title: 'EU passes stablecoin ban?', yesPrice: 0.09, volume: '$420K', endDate: 'Dec 31', category: 'Macro' },
]

export function PredictionsPage() {
  const [category, setCategory] = useState<'all' | 'Crypto' | 'Macro'>('all')
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null)
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')

  const filtered = category === 'all' ? EVENTS : EVENTS.filter(e => e.category === category)

  return (
    <div className="protocol-page">
      <div className="protocol-main">
        {/* Left: Card grid */}
        <div className="protocol-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-0)' }}>Prediction Markets</div>
            <div className="pred-cat-toggle">
              {(['all', 'Crypto', 'Macro'] as const).map(c => (
                <button key={c} className={`pred-cat-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>

          <div className="pred-grid">
            {filtered.map(e => (
              <button
                key={e.id}
                className={`pred-card ${selectedEvent?.id === e.id ? 'active' : ''}`}
                onClick={() => { setSelectedEvent(e); setSide('yes') }}
              >
                <div className="pred-card-badge">{e.category}</div>
                <div className="pred-card-title">{e.title}</div>
                <div className="pred-card-bar">
                  <div className="pred-card-bar-fill" style={{ width: `${e.yesPrice * 100}%` }} />
                </div>
                <div className="pred-card-prices">
                  <span className="pred-card-yes">Yes {(e.yesPrice * 100).toFixed(0)}c</span>
                  <span className="pred-card-no">No {((1 - e.yesPrice) * 100).toFixed(0)}c</span>
                </div>
                <div className="pred-card-meta">
                  <span>{e.volume} vol</span>
                  <span>Ends {e.endDate}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Trade panel */}
        <div className="protocol-panel">
          {selectedEvent ? (
            <>
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
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Select a market to trade
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
