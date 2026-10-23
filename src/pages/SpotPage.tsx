import { orderPrice, orderSize, orderOutcome } from '../lib/orderValidation'
import { AssetLabel } from '../components/AssetLabel'
import './BridgePage.css'
import { Link } from 'react-router-dom'
import { AppDiscovery } from '../components/AppDiscovery'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { useUserState } from '../hooks/useUserState'
import { useSpotMarkets, type SpotMarket } from '../hooks/useSpotMarkets'
import { formatPrice } from '../lib/format'
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type Time } from 'lightweight-charts'
import { useTheme } from '../contexts/ThemeContext'
import { Positions } from '../components/perps/Positions'
import { TickerBar } from '../components/perps/TickerBar'
import { TokenIcon } from '../components/TokenIcon'

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
      layout: { background: { color: 'transparent' }, textColor: isDark ? '#a4a4a0' : '#656560', fontFamily: "'Inter', sans-serif", fontSize: 11 },
      grid: { vertLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }, horzLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' } },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', timeVisible: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })
    const up = isDark ? '#16a34a' : '#16a34a'
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
    let cancelled = false
    seriesRef.current.setData([])
    volRef.current.setData([])
    const now = Date.now()
    info.candleSnapshot({ coin, interval: chartInterval, startTime: now - 7 * 86400000, endTime: now }).then((raw: unknown) => {
      if (cancelled) return
      const candles = raw as Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>
      const cd: CandlestickData<Time>[] = candles.map(c => ({ time: Math.floor(c.t / 1000) as Time, open: parseFloat(c.o), high: parseFloat(c.h), low: parseFloat(c.l), close: parseFloat(c.c) }))
      const vd: HistogramData<Time>[] = candles.map(c => ({ time: Math.floor(c.t / 1000) as Time, value: parseFloat(c.v), color: parseFloat(c.c) >= parseFloat(c.o) ? (isDark ? 'rgba(34,197,94,0.25)' : 'rgba(20,184,166,0.25)') : (isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.25)') }))
      seriesRef.current?.setData(cd)
      volRef.current?.setData(vd)
      chartRef.current?.timeScale().fitContent()
    }).catch(() => {})
    return () => { cancelled = true }
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
  const dropRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  const PINNED = new Set(['BTC', 'ETH', 'SOL', 'HYPE'])
  const filtered = useMemo(() => {
    const matched = markets.filter(m => m.baseToken.toLowerCase().includes(search.toLowerCase()) || m.pairName.toLowerCase().includes(search.toLowerCase()))
    const pinned = matched.filter(m => PINNED.has(m.baseToken)).sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
    const rest = matched.filter(m => !PINNED.has(m.baseToken)).sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
    return [...pinned, ...rest]
  }, [markets, search])

  return (
    <div className="spot-selector" ref={dropRef}>
      <button className="market-selector-btn" onClick={() => setOpen(!open)}>
        <TokenIcon symbol={selected.split('/')[0]} size={22} />
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
                  <TokenIcon symbol={m.name} size={16} />
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
  const { state, refetch, error: balanceError } = useUserState()
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
  const sizingPrice = orderType === 'limit' ? Number(limitPrice) : price
  const tokenAmount = sizingPrice > 0 ? usdcNum / sizingPrice : 0
  const baseBalance = state?.spotBalances[String(market?.baseIndex)] ?? 0
  const spotBalance = side === 'buy' ? Number(state?.spotUSDC ?? 0) : baseBalance * sizingPrice

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

      if (market.quoteToken !== 'USDC') throw new Error('This swap currently supports USDC-quoted markets only')
      const limitPx = orderPrice(isMarketOrder ? price * (isBuy ? 1.05 : 0.95) : Number(limitPrice), market.szDecimals, true)
      const roundedSize = orderSize(isBuy && isMarketOrder ? usdcNum / Number(limitPx) : tokenAmount, market.szDecimals)
      if (!isBuy && Number(roundedSize) > baseBalance) throw new Error('Insufficient available token balance')
      if (isBuy && Number(roundedSize) * Number(limitPx) > spotBalance) throw new Error('Insufficient available USDC balance')

      const result = await exchange.order({
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: limitPx,
          s: roundedSize,
          r: false,
          t: { limit: { tif: isMarketOrder ? 'Ioc' : 'Gtc' } },
        }],
        grouping: 'na',
      })

      setSuccess(`${orderOutcome(result)} · ${market.baseToken}`)
      void refetch()
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
    pct = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0))
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
        <button className={`trade-side-btn buy ${side === 'buy' ? 'active' : ''}`} aria-pressed={side === 'buy'} onClick={() => setSide('buy')}>Buy</button>
        <button className={`trade-side-btn sell ${side === 'sell' ? 'active' : ''}`} aria-pressed={side === 'sell'} onClick={() => setSide('sell')}>Sell</button>
      </div>

      {/* Available + Price */}
      <div className="tp-info-rows">
        <div className="tp-info-row">
          <span>Available to Trade</span>
          <span>{side === 'buy' ? `${Number(state?.spotUSDC ?? 0).toFixed(2)} USDC` : `${baseBalance} ${market?.baseToken ?? ''}`}</span>
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
            <span className="trade-input-unit"><AssetLabel symbol="USDC" size={16} /></span>
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
          <span className="trade-input-unit"><AssetLabel symbol="USDC" size={16} /> ▾</span>
        </div>
        {tokenAmount > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            = {tokenAmount.toFixed(tokenAmount >= 100 ? 0 : tokenAmount >= 1 ? 2 : 4)} {market?.baseToken}
          </div>
        )}
      </div>

      {/* Thermometer slider with dots */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="thermo-wrapper" style={{ flex: 1 }}>
          <div className="thermo-track">
            <div className="thermo-fill" style={{ width: `${sizePct}%` }} />
            {[0, 25, 50, 75, 100].map(pct => (
              <button key={pct} className={`thermo-dot ${sizePct >= pct ? 'active' : ''}`} style={{ left: `${pct}%` }} onClick={() => handleSizePct(pct)} />
            ))}
          </div>
          <input type="range" className="thermo-input" min={0} max={100} value={sizePct} onChange={e => handleSizePct(parseInt(e.target.value))} />
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
        <div className="tp-summary-row"><span>Fee</span><span>Varies by account tier</span></div>{orderType === 'market' && <div className="tp-summary-row"><span>Market price limit</span><span>5% slippage cap</span></div>}
      </div>

      {/* Submit */}
      {!isConnected ? (
        <div className="connect-prompt">Connect wallet to trade</div>
      ) : !agentApproved ? (
        <button className="trade-submit transfer" onClick={async () => { switchToArbitrum(); setTimeout(approveAgent, 1500) }} disabled={approving}>
          {approving ? 'Setting up...' : 'Enable Trading'}
        </button>
      ) : (
        <button className={`trade-submit ${side}`} disabled={placing || !state || !Number.isFinite(tokenAmount) || tokenAmount <= 0 || market?.quoteToken !== 'USDC'} onClick={handleSpotOrder}>
          {placing ? 'Swapping...' : side === 'buy' ? `Swap to ${market?.baseToken ?? ''}` : `Swap ${market?.baseToken ?? ''} to USDC`}
        </button>
      )}

      {balanceError && <div className="trade-error">{balanceError} <button onClick={() => void refetch()}>Retry</button></div>}
      {error && <div className="trade-error">{error}</div>}
      {success && <div className="dw-success">{success}</div>}

    </div>
  )
}

// ── Main Page ──
export function SpotPage() {
  const { markets: allMarkets, loading, error: marketsError } = useSpotMarkets()
  const markets = allMarkets.filter(m => m.quoteToken === 'USDC')
  const { theme } = useTheme()
  const [selectedPair, setSelectedPair] = useState('PURR/USDC')

  const selected = markets.find(m => m.pairName === selectedPair) ?? markets[0]
  // For chart candles, use the spot pair name (e.g., "@1" format) which is what the API expects
  const chartCoin = selected?.name ?? '@1'

  if (loading && markets.length === 0) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Loading spot markets...</div>
  }

  if (!markets.length) return <main className="lending-page" role="status">{marketsError ?? 'No supported spot markets are available. Please refresh to retry.'}</main>

  return (
    <div className="finance-product-page"><div className="bridge-spot-link"><Link to="/bridge">Bridge assets across networks →</Link></div><div className="perps-page"><div className="perps-discover-bar"><strong>Swap · Hyperliquid Spot</strong><span>Buy and sell spot assets directly in Oslo</span></div>
      <TickerBar />
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
          <SpotTradePanel key={selected?.name} market={selected} />
        </div>
      </div>
    </div><div className="finance-product-discovery"><AppDiscovery category="swap" /></div></div>
  )
}
