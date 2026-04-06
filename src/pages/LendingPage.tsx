import { useState } from 'react'

type Protocol = 'all' | 'hyperlend' | 'felix' | 'hypurrfi'

interface LendingMarket {
  asset: string
  protocol: 'HyperLend' | 'Felix' | 'HypurrFi'
  type: 'lending' | 'cdp'
  supplyApy: string
  borrowApy: string
  totalSupply: string
  totalBorrow: string
  utilization: string
  collateral?: boolean
}

const MARKETS: LendingMarket[] = [
  // HyperLend markets
  { asset: 'USDC', protocol: 'HyperLend', type: 'lending', supplyApy: '4.2%', borrowApy: '6.1%', totalSupply: '$82M', totalBorrow: '$54M', utilization: '66%', collateral: true },
  { asset: 'HYPE', protocol: 'HyperLend', type: 'lending', supplyApy: '2.8%', borrowApy: '5.4%', totalSupply: '$45M', totalBorrow: '$18M', utilization: '40%', collateral: true },
  { asset: 'uETH', protocol: 'HyperLend', type: 'lending', supplyApy: '1.9%', borrowApy: '4.2%', totalSupply: '$38M', totalBorrow: '$12M', utilization: '32%', collateral: true },
  { asset: 'uBTC', protocol: 'HyperLend', type: 'lending', supplyApy: '0.8%', borrowApy: '3.1%', totalSupply: '$120M', totalBorrow: '$22M', utilization: '18%', collateral: true },
  { asset: 'USDe', protocol: 'HyperLend', type: 'lending', supplyApy: '5.1%', borrowApy: '7.8%', totalSupply: '$28M', totalBorrow: '$19M', utilization: '68%', collateral: false },
  { asset: 'USDT0', protocol: 'HyperLend', type: 'lending', supplyApy: '3.8%', borrowApy: '5.9%', totalSupply: '$35M', totalBorrow: '$21M', utilization: '60%', collateral: false },
  // Felix CDP markets
  { asset: 'HYPE', protocol: 'Felix', type: 'cdp', supplyApy: '--', borrowApy: '0.5%', totalSupply: '$62M', totalBorrow: '$28M', utilization: '45%', collateral: true },
  { asset: 'kHYPE', protocol: 'Felix', type: 'cdp', supplyApy: '--', borrowApy: '0.5%', totalSupply: '$34M', totalBorrow: '$14M', utilization: '41%', collateral: true },
  { asset: 'uBTC', protocol: 'Felix', type: 'cdp', supplyApy: '--', borrowApy: '0.3%', totalSupply: '$48M', totalBorrow: '$12M', utilization: '25%', collateral: true },
  // HypurrFi markets
  { asset: 'USDXL', protocol: 'HypurrFi', type: 'lending', supplyApy: '5.1%', borrowApy: '7.2%', totalSupply: '$18M', totalBorrow: '$11M', utilization: '61%', collateral: false },
  { asset: 'HYPE', protocol: 'HypurrFi', type: 'lending', supplyApy: '3.4%', borrowApy: '6.8%', totalSupply: '$24M', totalBorrow: '$9M', utilization: '38%', collateral: true },
  { asset: 'USDC', protocol: 'HypurrFi', type: 'lending', supplyApy: '4.8%', borrowApy: '6.5%', totalSupply: '$32M', totalBorrow: '$20M', utilization: '63%', collateral: true },
  { asset: 'uETH', protocol: 'HypurrFi', type: 'lending', supplyApy: '2.1%', borrowApy: '4.9%', totalSupply: '$15M', totalBorrow: '$5M', utilization: '33%', collateral: true },
]

const PROTOCOL_INFO = {
  hyperlend: { name: 'HyperLend', url: 'https://app.hyperlend.finance/dashboard', desc: 'Lend & borrow on HyperEVM', tvl: '$348M', markets: 6 },
  felix: { name: 'Felix', url: 'https://www.usefelix.xyz/portfolio', desc: 'CDP - mint feUSD against collateral', tvl: '$144M', markets: 3 },
  hypurrfi: { name: 'HypurrFi', url: 'https://hypurrfi.com/', desc: 'Pooled & isolated lending + USDXL', tvl: '$89M', markets: 4 },
}

export function LendingPage() {
  const [protocol, setProtocol] = useState<Protocol>('all')
  const [selectedAsset, setSelectedAsset] = useState<LendingMarket | null>(null)
  const [mode, setMode] = useState<'supply' | 'borrow'>('supply')
  const [amount, setAmount] = useState('')

  const filtered = protocol === 'all' ? MARKETS : MARKETS.filter(m => m.protocol.toLowerCase() === protocol)

  const hyperlendMarkets = MARKETS.filter(m => m.protocol === 'HyperLend')
  const felixMarkets = MARKETS.filter(m => m.protocol === 'Felix')
  const hypurrfiMarkets = MARKETS.filter(m => m.protocol === 'HypurrFi')

  return (
    <div className="pred-page">
      {/* Protocol tabs */}
      <div className="pred-topbar">
        <button className={`pred-topbar-tab ${protocol === 'all' ? 'active' : ''}`} onClick={() => setProtocol('all')}>All Markets</button>
        <button className={`pred-topbar-tab ${protocol === 'hyperlend' ? 'active' : ''}`} onClick={() => setProtocol('hyperlend')}>HyperLend</button>
        <button className={`pred-topbar-tab ${protocol === 'felix' ? 'active' : ''}`} onClick={() => setProtocol('felix')}>Felix CDP</button>
        <button className={`pred-topbar-tab ${protocol === 'hypurrfi' ? 'active' : ''}`} onClick={() => setProtocol('hypurrfi')}>HypurrFi</button>
      </div>

      <div className="pred-layout">
        {/* Main: markets */}
        <div className="pred-main">
          {/* Protocol stats */}
          <div className="protocol-stats-row" style={{ marginBottom: 12 }}>
            {(protocol === 'all' || protocol === 'hyperlend') && (
              <div className="protocol-stat-card">
                <span className="protocol-stat-label">HyperLend TVL</span>
                <span className="protocol-stat-value">{PROTOCOL_INFO.hyperlend.tvl}</span>
              </div>
            )}
            {(protocol === 'all' || protocol === 'felix') && (
              <div className="protocol-stat-card">
                <span className="protocol-stat-label">Felix TVL</span>
                <span className="protocol-stat-value">{PROTOCOL_INFO.felix.tvl}</span>
              </div>
            )}
            {(protocol === 'all' || protocol === 'hypurrfi') && (
              <div className="protocol-stat-card">
                <span className="protocol-stat-label">HypurrFi TVL</span>
                <span className="protocol-stat-value">{PROTOCOL_INFO.hypurrfi.tvl}</span>
              </div>
            )}
            <div className="protocol-stat-card">
              <span className="protocol-stat-label">Total Markets</span>
              <span className="protocol-stat-value">{filtered.length}</span>
            </div>
          </div>

          {/* HyperLend section */}
          {(protocol === 'all' || protocol === 'hyperlend') && (
            <div className="lending-protocol-section">
              <div className="lending-protocol-header">
                <span className="lending-protocol-name">HyperLend</span>
                <span className="lending-protocol-desc">Lend & Borrow</span>
                <a href={PROTOCOL_INFO.hyperlend.url} target="_blank" rel="noopener noreferrer" className="protocol-action-link">Open App</a>
              </div>
              <div className="protocol-table">
                <div className="protocol-table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr' }}>
                  <span>Asset</span>
                  <span>Supply APY</span>
                  <span>Borrow APY</span>
                  <span>Total Supply</span>
                  <span>Total Borrow</span>
                  <span>Util.</span>
                </div>
                {hyperlendMarkets.map(m => (
                  <button key={`hl-${m.asset}`} className={`protocol-table-row ${selectedAsset === m ? 'active' : ''}`}
                    style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr' }}
                    onClick={() => { setSelectedAsset(m); setMode('supply'); setAmount('') }}>
                    <span className="protocol-cell-name">{m.asset} {m.collateral && <span className="lending-collateral-badge">C</span>}</span>
                    <span className="green">{m.supplyApy}</span>
                    <span>{m.borrowApy}</span>
                    <span>{m.totalSupply}</span>
                    <span>{m.totalBorrow}</span>
                    <span>{m.utilization}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Felix section */}
          {(protocol === 'all' || protocol === 'felix') && (
            <div className="lending-protocol-section">
              <div className="lending-protocol-header">
                <span className="lending-protocol-name">Felix</span>
                <span className="lending-protocol-desc">CDP - Mint feUSD</span>
                <a href={PROTOCOL_INFO.felix.url} target="_blank" rel="noopener noreferrer" className="protocol-action-link">Open App</a>
              </div>
              <div className="protocol-table">
                <div className="protocol-table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr' }}>
                  <span>Collateral</span>
                  <span>Supply APY</span>
                  <span>Mint Fee</span>
                  <span>Deposited</span>
                  <span>feUSD Minted</span>
                  <span>Util.</span>
                </div>
                {felixMarkets.map(m => (
                  <button key={`fx-${m.asset}`} className={`protocol-table-row ${selectedAsset === m ? 'active' : ''}`}
                    style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr' }}
                    onClick={() => { setSelectedAsset(m); setMode('supply'); setAmount('') }}>
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
          )}

          {/* HypurrFi section */}
          {(protocol === 'all' || protocol === 'hypurrfi') && (
            <div className="lending-protocol-section">
              <div className="lending-protocol-header">
                <span className="lending-protocol-name">HypurrFi</span>
                <span className="lending-protocol-desc">Pooled & Isolated + USDXL</span>
                <a href={PROTOCOL_INFO.hypurrfi.url} target="_blank" rel="noopener noreferrer" className="protocol-action-link">Open App</a>
              </div>
              <div className="protocol-table">
                <div className="protocol-table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr' }}>
                  <span>Asset</span>
                  <span>Supply APY</span>
                  <span>Borrow APY</span>
                  <span>Total Supply</span>
                  <span>Total Borrow</span>
                  <span>Util.</span>
                </div>
                {hypurrfiMarkets.map(m => (
                  <button key={`hf-${m.asset}`} className={`protocol-table-row ${selectedAsset === m ? 'active' : ''}`}
                    style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr' }}
                    onClick={() => { setSelectedAsset(m); setMode('supply'); setAmount('') }}>
                    <span className="protocol-cell-name">{m.asset} {m.collateral && <span className="lending-collateral-badge">C</span>}</span>
                    <span className="green">{m.supplyApy}</span>
                    <span>{m.borrowApy}</span>
                    <span>{m.totalSupply}</span>
                    <span>{m.totalBorrow}</span>
                    <span>{m.utilization}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="pred-sidebar">
          {selectedAsset ? (
            <div className="pred-trade-card">
              <div className="pred-trade-title">{selectedAsset.asset}</div>
              <div className="protocol-panel-sub">via {selectedAsset.protocol}</div>

              {selectedAsset.type === 'lending' ? (
                <>
                  <div className="trade-type-toggle">
                    <button className={`trade-type-btn ${mode === 'supply' ? 'active' : ''}`} onClick={() => setMode('supply')}>Supply</button>
                    <button className={`trade-type-btn ${mode === 'borrow' ? 'active' : ''}`} onClick={() => setMode('borrow')}>Borrow</button>
                  </div>
                  <div className="trade-input-group">
                    <div className="tp-info-row" style={{ marginBottom: 4 }}>
                      <span>Amount</span>
                      <span>Balance: 0.00 {selectedAsset.asset}</span>
                    </div>
                    <div className="trade-input-wrapper">
                      <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
                      <span className="trade-input-unit">{selectedAsset.asset}</span>
                    </div>
                  </div>
                  <div className="tp-summary">
                    <div className="tp-summary-row">
                      <span>{mode === 'supply' ? 'Supply APY' : 'Borrow APY'}</span>
                      <span className={mode === 'supply' ? 'green' : ''}>{mode === 'supply' ? selectedAsset.supplyApy : selectedAsset.borrowApy}</span>
                    </div>
                    <div className="tp-summary-row"><span>Utilization</span><span>{selectedAsset.utilization}</span></div>
                    <div className="tp-summary-row"><span>Collateral</span><span>{selectedAsset.collateral ? 'Yes' : 'No'}</span></div>
                  </div>
                  <a href={selectedAsset.protocol === 'HyperLend' ? PROTOCOL_INFO.hyperlend.url : PROTOCOL_INFO.hypurrfi.url} target="_blank" rel="noopener noreferrer"
                    className={`trade-submit ${mode === 'supply' ? 'buy' : 'sell'}`}
                    style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                    {mode === 'supply' ? 'Supply' : 'Borrow'} on {selectedAsset.protocol}
                  </a>
                </>
              ) : (
                <>
                  <div className="trade-input-group">
                    <div className="tp-info-row" style={{ marginBottom: 4 }}>
                      <span>Collateral</span>
                      <span>Balance: 0.00 {selectedAsset.asset}</span>
                    </div>
                    <div className="trade-input-wrapper">
                      <input type="number" className="trade-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} step="any" />
                      <span className="trade-input-unit">{selectedAsset.asset}</span>
                    </div>
                  </div>
                  <div className="tp-summary">
                    <div className="tp-summary-row"><span>Mint Fee</span><span>{selectedAsset.borrowApy}</span></div>
                    <div className="tp-summary-row"><span>Min Coll. Ratio</span><span>150%</span></div>
                    <div className="tp-summary-row"><span>You mint</span><span>{amount ? `${(parseFloat(amount) * 0.6).toFixed(2)} feUSD` : '0.00 feUSD'}</span></div>
                  </div>
                  <a href={PROTOCOL_INFO.felix.url} target="_blank" rel="noopener noreferrer"
                    className="trade-submit buy" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                    Mint feUSD on Felix
                  </a>
                </>
              )}
            </div>
          ) : (
            <div className="pred-hot-card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Select a market to supply or borrow</div>
            </div>
          )}

          {/* Protocol links */}
          <div className="pred-hot-card">
            <div className="pred-hot-title">Protocols</div>
            <a href={PROTOCOL_INFO.hyperlend.url} target="_blank" rel="noopener noreferrer" className="pred-hot-row" style={{ textDecoration: 'none' }}>
              <span className="pred-hot-name">HyperLend</span>
              <span className="pred-hot-vol">{PROTOCOL_INFO.hyperlend.tvl} TVL</span>
            </a>
            <a href={PROTOCOL_INFO.felix.url} target="_blank" rel="noopener noreferrer" className="pred-hot-row" style={{ textDecoration: 'none' }}>
              <span className="pred-hot-name">Felix</span>
              <span className="pred-hot-vol">{PROTOCOL_INFO.felix.tvl} TVL</span>
            </a>
            <a href={PROTOCOL_INFO.hypurrfi.url} target="_blank" rel="noopener noreferrer" className="pred-hot-row" style={{ textDecoration: 'none' }}>
              <span className="pred-hot-name">HypurrFi</span>
              <span className="pred-hot-vol">{PROTOCOL_INFO.hypurrfi.tvl} TVL</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
