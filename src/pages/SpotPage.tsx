import { useState, useEffect, useMemo, useRef } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { useUserState } from '../hooks/useUserState'
import { useSpotMarkets, type SpotMarket } from '../hooks/useSpotMarkets'
import { formatPrice } from '../lib/format'
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type Time } from 'lightweight-charts'
import { useTheme } from '../contexts/ThemeContext'
import { Positions } from '../components/perps/Positions'

// ── Spot Chart ──
function SpotChart({ coin, theme }: { coin: string; theme: 'dark' | 'light' }) {
  const { info } = useHyperliquid()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [chartInterval, setChartInterval] = useState<'1h' | '4h' | '1d'>('1h')

  useEffect(() => {
    if (!containerRef.current) return
    const isDark = theme === 'dark'
    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: isDark ? '#5c5e69' : '#9ca3af', fontFamily: "'Inter', sans-serif", fontSize: 11 },
      grid: { vertLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }, horzLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' } },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', timeVisible: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })
    const up = isDark ? '#2dd4bf' : '#059669'
    const down = isDark ? '#ef4444' : '#dc2626'
    const series = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderUpColor: up, borderDownColor: down, wickUpColor: up, wickDownColor: down })
    const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    chartRef.current = chart
    seriesRef.current = series
    volRef.current = vol

    const obs = new ResizeObserver(e => { const { width, height } = e[0].contentRect; chart.resize(width, height) })
    obs.observe(containerRef.current)
    return () => { obs.disconnect(); chart.remove(); chartRef.current = null }
  }, [theme])

  useEffect(() => {
    if (!seriesRef.current || !volRef.current) return
    const isDark = theme === 'dark'
    const now = Date.now()
    info.candleSnapshot({ coin, interval: chartInterval, startTime: now - 7 * 86400000, endTime: now }).then((raw: unknown) => {
      const candles = raw as Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>
      const cd: CandlestickData<Time>[] = candles.map(c => ({ time: Math.floor(c.t / 1000) as Time, open: parseFloat(c.o), high: parseFloat(c.h), low: parseFloat(c.l), close: parseFloat(c.c) }))
      const vd: HistogramData<Time>[] = candles.map(c => ({ time: Math.floor(c.t / 1000) as Time, value: parseFloat(c.v), color: parseFloat(c.c) >= parseFloat(c.o) ? (isDark ? 'rgba(45,212,191,0.25)' : 'rgba(20,184,166,0.25)') : (isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.25)') }))
      seriesRef.current?.setData(cd)
      volRef.current?.setData(vd)
      chartRef.current?.timeScale().fitContent()
    }).catch(() => {})
  }, [coin, chartInterval, info, theme])

  return (
    <div className="chart-container">
      <div className="chart-controls">
        {(['1h', '4h', '1d'] as const).map(i => (
          <button key={i} className={`chart-interval ${chartInterval === i ? 'active' : ''}`} onClick={() => setChartInterval(i)}>{i}</button>
        ))}
      </div>
      <div className="chart-wrapper" ref={containerRef} />
    </div>
  )
}

// ── Spot Market Selector (inline) ──
function SpotSelector({ markets, selected, onSelect }: { markets: SpotMarket[]; selected: string; onSelect: (name: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const PINNED = new Set(['BTC', 'ETH', 'SOL', 'HYPE'])
  const filtered = useMemo(() => {
    const matched = markets.filter(m => m.baseToken.toLowerCase().includes(search.toLowerCase()) || m.pairName.toLowerCase().includes(search.toLowerCase()))
    const pinned = matched.filter(m => PINNED.has(m.baseToken)).sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
    const rest = matched.filter(m => !PINNED.has(m.baseToken)).sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
    return [...pinned, ...rest]
  }, [markets, search])

  return (
    <div className="spot-selector">
      <button className="market-selector-btn" onClick={() => setOpen(!open)}>
        <span className="market-name">{selected}</span>
        <span className="market-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="spot-dropdown">
          <input className="spot-dd-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="spot-dd-header">
            <span>Pair</span>
            <span>Price</span>
            <span>24h</span>
            <span>Volume</span>
          </div>
          <div className="spot-dd-list">
            {filtered.map(m => {
              const vol = parseFloat(m.volume24h)
              const volStr = vol >= 1e6 ? `$${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `$${(vol / 1e3).toFixed(0)}K` : `$${vol.toFixed(0)}`
              return (
                <button key={m.name} className={`spot-dd-item ${m.pairName === selected ? 'active' : ''}`} onClick={() => { onSelect(m.pairName); setOpen(false); setSearch('') }}>
                  <span className="spot-dd-name">{m.pairName}</span>
                  <span className="spot-dd-price">${formatPrice(m.markPx)}</span>
                  <span className={m.change24h >= 0 ? 'green' : 'red'}>{m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(1)}%</span>
                  <span className="spot-dd-vol">{volStr}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Spot Trade Panel ──
function SpotTradePanel({ market }: { market: SpotMarket | undefined }) {
  const { isConnected, exchange, agentApproved, approving, approveAgent, switchToArbitrum } = useHyperliquid()
  const { state } = useUserState()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [usdcAmount, setUsdcAmount] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sizePct, setSizePct] = useState(0)

  const price = market ? parseFloat(market.markPx) : 0
  const usdcNum = parseFloat(usdcAmount) || 0
  const tokenAmount = price > 0 ? usdcNum / price : 0
  const spotBalance = state ? parseFloat(state.spotUSDC) : 0

  const handleSpotOrder = async () => {
    if (!market || tokenAmount <= 0 || price <= 0) return

    if (!exchange) {
      setError('Wallet not connected. Switch to Arbitrum chain and reconnect.')
      return
    }

    try {
      setPlacing(true)
      setError(null)
      setSuccess(null)

      const isBuy = side === 'buy'
      const assetIndex = 10000 + market.index
      const isMarketOrder = orderType === 'market'

      let limitPx: string
      if (isMarketOrder) {
        const slippedPx = isBuy ? price * 1.05 : price * 0.95
        if (slippedPx >= 10000) limitPx = slippedPx.toFixed(0)
        else if (slippedPx >= 100) limitPx = slippedPx.toFixed(1)
        else if (slippedPx >= 1) limitPx = slippedPx.toFixed(2)
        else if (slippedPx >= 0.001) limitPx = slippedPx.toFixed(5)
        else limitPx = slippedPx.toFixed(8)
      } else {
        if (!limitPrice || parseFloat(limitPrice) <= 0) { setError('Enter a limit price'); setPlacing(false); return }
        limitPx = limitPrice
      }

      const roundedSize = tokenAmount.toFixed(4)

      await exchange.order({
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: limitPx,
          s: roundedSize,
          r: false,
          t: { limit: { tif: isMarketOrder ? 'FrontendMarket' : 'Gtc' } },
        }],
        grouping: 'na',
      })

      setSuccess(`${isBuy ? 'Bought' : 'Sold'} ${roundedSize} ${market.baseToken}`)
      setUsdcAmount('')
    } catch (e) {
      console.error('Spot order failed:', e)
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('viem wallet') || msg.includes('signTypedData')) {
        setError('Signing failed. Switch your wallet to Arbitrum chain.')
      } else if (msg.includes('Not enough') || msg.includes('insufficient')) {
        setError('Not enough balance. Need USDC to buy or tokens to sell.')
      } else if (msg.includes('rejected') || msg.includes('denied')) {
        setError('Transaction rejected by wallet.')
      } else {
        setError(msg.slice(0, 150))
      }
    } finally {
      setPlacing(false)
    }
  }

  const handleSizePct = (pct: number) => {
    setSizePct(pct)
    if (spotBalance > 0) {
      const usd = (spotBalance * pct / 100)
      setUsdcAmount(usd > 0 ? usd.toFixed(2) : '')
    }
  }

  return (
    <div className="trade-panel">
      {/* Market / Limit */}
      <div className="trade-type-toggle">
        <button className={`trade-type-btn ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</button>
        <button className={`trade-type-btn ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</button>
      </div>

      {/* Buy / Sell */}
      <div className="trade-side-toggle">
        <button className={`trade-side-btn ${side === 'buy' ? 'active buy' : ''}`} onClick={() => setSide('buy')}>Buy</button>
        <button className={`trade-side-btn ${side === 'sell' ? 'active sell' : ''}`} onClick={() => setSide('sell')}>Sell</button>
      </div>

      {/* Available + Price */}
      <div className="tp-info-rows">
        <div className="tp-info-row">
          <span>Available to Trade</span>
          <span>{spotBalance > 0 ? `${spotBalance.toFixed(2)} USDC` : '0.00 USDC'}</span>
        </div>
        <div className="tp-info-row">
          <span>Price</span>
          <span>${price > 0 ? formatPrice(price.toString()) : '--'}</span>
        </div>
      </div>

      {/* Limit price input */}
      {orderType === 'limit' && (
        <div className="trade-input-group">
          <div className="trade-input-wrapper">
            <input type="number" className="trade-input" placeholder={formatPrice(price.toString())} value={limitPrice} onChange={e => setLimitPrice(e.target.value)} step="any" />
            <span className="trade-input-unit">USDC</span>
          </div>
        </div>
      )}

      {/* Size in USDC */}
      <div className="trade-input-group">
        <div className="trade-input-wrapper">
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 8 }}>Size</span>
          <input type="number" className="trade-input" placeholder="0.00" value={usdcAmount} onChange={e => {
            setUsdcAmount(e.target.value)
            const val = parseFloat(e.target.value) || 0
            if (spotBalance > 0) setSizePct(Math.min(100, Math.round((val / spotBalance) * 100)))
          }} step="any" />
          <span className="trade-input-unit">USDC ▾</span>
        </div>
        {tokenAmount > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            = {tokenAmount.toFixed(tokenAmount >= 100 ? 0 : tokenAmount >= 1 ? 2 : 4)} {market?.baseToken}
          </div>
        )}
      </div>

      {/* Slider with % input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="tp-slider-wrapper" style={{ flex: 1 }}>
          <div className="tp-slider-dots">
            {[0, 25, 50, 75, 100].map(pct => (
              <button key={pct} className={`tp-slider-dot ${sizePct >= pct ? 'active' : ''}`} onClick={() => handleSizePct(pct)} />
            ))}
          </div>
          <input type="range" className="tp-slider" min={0} max={100} value={sizePct} onChange={e => handleSizePct(parseInt(e.target.value))} />
        </div>
        <div className="trade-input-wrapper" style={{ width: 70, padding: '6px 8px' }}>
          <input type="number" className="trade-input" style={{ fontSize: 13 }} value={sizePct || ''} onChange={e => handleSizePct(parseInt(e.target.value) || 0)} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>%</span>
        </div>
      </div>

      {/* Order summary */}
      <div className="tp-summary">
        <div className="tp-summary-row"><span>Order Value</span><span>{usdcNum > 0 ? `$${usdcNum.toFixed(2)}` : 'N/A'}</span></div>
        <div className="tp-summary-row"><span>You {side === 'buy' ? 'receive' : 'sell'}</span><span>{tokenAmount > 0 ? `${tokenAmount.toFixed(tokenAmount >= 100 ? 0 : 2)} ${market?.baseToken ?? ''}` : 'N/A'}</span></div>
        <div className="tp-summary-row"><span>Fee</span><span>0.0560% / 0.0400%</span></div>
      </div>

      {/* Submit */}
      {!isConnected ? (
        <div className="connect-prompt">Connect wallet to trade</div>
      ) : !agentApproved ? (
        <button className="trade-submit transfer" onClick={async () => { switchToArbitrum(); setTimeout(approveAgent, 1500) }} disabled={approving}>
          {approving ? 'Setting up...' : 'Enable Trading'}
        </button>
      ) : (
        <button className={`trade-submit ${side}`} disabled={placing || tokenAmount <= 0} onClick={handleSpotOrder}>
          {placing ? 'Swapping...' : side === 'buy' ? `Swap to ${market?.baseToken ?? ''}` : `Swap ${market?.baseToken ?? ''} to USDC`}
        </button>
      )}

      {error && <div className="trade-error">{error}</div>}
      {success && <div className="dw-success">{success}</div>}

    </div>
  )
}

// ── Main Page ──
export function SpotPage() {
  const { markets, loading } = useSpotMarkets()
  const { theme } = useTheme()
  const [selectedPair, setSelectedPair] = useState('PURR/USDC')

  const selected = markets.find(m => m.pairName === selectedPair) ?? markets[0]
  // For chart candles, use the spot pair name (e.g., "@1" format) which is what the API expects
  const chartCoin = selected?.name ?? '@1'

  if (loading && markets.length === 0) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Loading spot markets...</div>
  }

  return (
    <div className="perps-page">
      {/* Market header */}
      <div className="market-header">
        <SpotSelector markets={markets} selected={selectedPair} onSelect={setSelectedPair} />
        {selected && (
          <div className="market-stats">
            <div className="market-stat">
              <span className="market-stat-label">Price</span>
              <span className="market-stat-value">${formatPrice(selected.markPx)}</span>
            </div>
            <div className="market-stat">
              <span className="market-stat-label">24h Change</span>
              <span className={`market-stat-value ${selected.change24h >= 0 ? 'green' : 'red'}`}>
                {selected.change24h >= 0 ? '+' : ''}{selected.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="market-stat">
              <span className="market-stat-label">24h Volume</span>
              <span className="market-stat-value">
                {parseFloat(selected.volume24h) >= 1e6 ? `$${(parseFloat(selected.volume24h) / 1e6).toFixed(1)}M` : `$${Math.round(parseFloat(selected.volume24h)).toLocaleString()}`}
              </span>
            </div>
            {selected.evmContract && (
              <div className="market-stat">
                <span className="market-stat-label">Contract</span>
                <span className="market-stat-value" style={{ fontSize: 11, fontFamily: "'Inter', monospace" }}>
                  {selected.evmContract.slice(0, 6)}...{selected.evmContract.slice(-4)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Same layout as perps: left (chart + bottom) + right (trade) */}
      <div className="perps-main">
        <div className="perps-left">
          <div className="perps-top-row">
            <div className="perps-chart-area">
              <SpotChart coin={chartCoin} theme={theme} />
            </div>
          </div>
          <div className="perps-bottom">
            <Positions />
          </div>
        </div>
        <div className="perps-trade-area">
          <SpotTradePanel market={selected} />
        </div>
      </div>
    </div>
  )
}
