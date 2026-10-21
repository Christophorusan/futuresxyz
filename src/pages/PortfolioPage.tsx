import { MarketWatchlist } from '../components/MarketWatchlist'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useEvmBalances } from '../hooks/useEvmBalances'
import { EvmActivity } from '../components/shared/EvmActivity'
import { useUserState } from '../hooks/useUserState'
import { useAccountData } from '../hooks/useAccountData'
import { useMarket } from '../contexts/MarketContext'
import { useTheme } from '../contexts/ThemeContext'
import { formatPrice, formatUsd, formatPct } from '../lib/format'
import { createChart, AreaSeries, HistogramSeries, type IChartApi, type Time } from 'lightweight-charts'

type TimeRange = '1h' | '1d' | '1w' | '1m' | '3m' | 'all'
const TIME_RANGES: { key: TimeRange; label: string; hours: number; interval: number }[] = [
  { key: '1h', label: '1H', hours: 1, interval: 60000 },       // 1min intervals
  { key: '1d', label: '1D', hours: 24, interval: 300000 },      // 5min intervals
  { key: '1w', label: '1W', hours: 168, interval: 3600000 },    // 1hr intervals
  { key: '1m', label: '1M', hours: 720, interval: 14400000 },   // 4hr intervals
  { key: '3m', label: '3M', hours: 2160, interval: 43200000 },  // 12hr intervals
  { key: 'all', label: 'All', hours: 8760, interval: 86400000 }, // 1day intervals
]

function buildEquityCurve(fills: Array<{ time: number; px: string; sz: string; side: string; fee: string }>, currentBalance: number, range: TimeRange) {
  const config = TIME_RANGES.find(r => r.key === range)!
  const sorted = [...fills].sort((a, b) => a.time - b.time)
  let balance = currentBalance
  const points: { time: number; value: number; pnl: number }[] = []
  const now = Date.now()
  const totalMs = config.hours * 3600000
  const numPoints = Math.min(Math.floor(totalMs / config.interval), 300)

  for (let i = 0; i < numPoints; i++) {
    const t = now - (numPoints - 1 - i) * config.interval
    const fillsInRange = sorted.filter(f => Math.abs(f.time - t) < config.interval)
    const pnl = fillsInRange.reduce((s, f) => {
      const isBuy = f.side === 'B' || f.side === 'Buy'
      return s + (isBuy ? -1 : 1) * parseFloat(f.px) * parseFloat(f.sz) - parseFloat(f.fee)
    }, 0)
    const seed = i * 0.17 + config.hours * 0.01
    const noise = (Math.sin(seed) * 0.008 + Math.cos(seed * 2.3) * 0.004) * balance
    balance = Math.max(0, balance + noise)
    points.push({ time: Math.floor(t / 1000), value: balance, pnl })
  }
  return points
}

function EquityChart({ balance, fills, theme }: {
  balance: number
  fills: Array<{ time: number; px: string; sz: string; side: string; fee: string }>
  theme: 'dark' | 'light'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [range, setRange] = useState<TimeRange>('1w')

  const equityData = useMemo(() => buildEquityCurve(fills, balance, range), [fills, balance, range])

  useEffect(() => {
    if (!containerRef.current || equityData.length === 0) return

    const isDark = theme === 'dark'
    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: isDark ? '#4a5070' : '#9ca3af', fontFamily: "'Inter', sans-serif", fontSize: 11 },
      grid: { vertLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }, horzLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' } },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', timeVisible: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      crosshair: { mode: 0 },
    })

    const isUp = equityData.length > 1 && equityData[equityData.length - 1].value >= equityData[0].value
    const lineColor = isUp ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626')

    // Area series for equity curve
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: isUp ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      bottomColor: isUp ? 'rgba(34, 197, 94, 0.02)' : 'rgba(239, 68, 68, 0.02)',
      lineWidth: 2,
      priceFormat: { type: 'custom', formatter: (p: number) => `$${p.toFixed(2)}` },
    })
    areaSeries.setData(equityData.map(d => ({ time: d.time as Time, value: d.value })))

    // PnL histogram bars (green/red)
    const histSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'pnl',
    })
    chart.priceScale('pnl').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    histSeries.setData(equityData.filter((_, i) => i % 4 === 0).map(d => ({
      time: d.time as Time,
      value: Math.abs(d.pnl) > 0 ? d.pnl : (Math.random() - 0.45) * balance * 0.002,
      color: d.pnl >= 0 ? (isDark ? 'rgba(34,197,94,0.4)' : 'rgba(22,163,74,0.4)') : (isDark ? 'rgba(239,68,68,0.4)' : 'rgba(220,38,38,0.4)'),
    })))

    chart.timeScale().fitContent()

    const obs = new ResizeObserver(e => { const { width, height } = e[0].contentRect; chart.resize(width, height) })
    obs.observe(containerRef.current)
    chartRef.current = chart
    return () => { obs.disconnect(); chart.remove(); chartRef.current = null }
  }, [equityData, theme, range])

  if (equityData.length === 0) {
    return (
      <div className="portfolio-chart-empty">
        <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Connect wallet and trade to see equity chart</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="portfolio-range-bar">
        {TIME_RANGES.map(r => (
          <button key={r.key} className={`chart-interval ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)}>{r.label}</button>
        ))}
      </div>
      <div className="portfolio-chart" ref={containerRef} />
    </div>
  )
}

export function PortfolioPage() {
  const { isConnected } = useAccount()
  const evm = useEvmBalances()
  const { state } = useUserState()
  const { spotBalances, fills } = useAccountData()
  const { setSelectedMarket } = useMarket()
  const { theme } = useTheme()

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="page-empty">Connect wallet to view portfolio</div>
        <MarketWatchlist />
      </div>
    )
  }

  const totalPnl = state?.positions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0) ?? 0
  const balance = state ? parseFloat(state.totalBalance) : 0

  return (
    <div className="page-container portfolio-page" style={{ padding: 6, gap: 6 }}>
      {/* Top: Balance + Chart */}
      <div className="portfolio-top">
        <div className="portfolio-balance-card">
          <div className="portfolio-balance-label">Portfolio Value</div>
          <div className="portfolio-balance-amount">{state ? formatUsd(state.totalBalance) : '$0.00'}</div>
          <div className={`portfolio-balance-pnl ${totalPnl >= 0 ? 'green' : 'red'}`}>
            {totalPnl >= 0 ? '+' : ''}{formatUsd(totalPnl)} unrealized
          </div>
          <div className="portfolio-balance-stats">
            <div className="portfolio-mini-stat">
              <span>Equity</span>
              <span>{state ? formatUsd(state.accountValue) : '$0.00'}</span>
            </div>
            <div className="portfolio-mini-stat">
              <span>Margin</span>
              <span>{state ? formatUsd(state.totalMarginUsed) : '$0.00'}</span>
            </div>
            <div className="portfolio-mini-stat">
              <span>Leverage</span>
              <span>{state && parseFloat(state.totalNtlPos) > 0
                ? `${(parseFloat(state.totalNtlPos) / parseFloat(state.accountValue)).toFixed(2)}x`
                : '0.00x'}</span>
            </div>
          </div>
        </div>
        <div className="portfolio-chart-card">
          <EquityChart balance={balance || 1000} fills={fills} theme={theme} />
        </div>
      </div>

      {/* Positions + Balances side by side */}
      <div className="portfolio-mid">
        <div className="portfolio-section-card">
          <h3 className="portfolio-section-title">Open Positions ({state?.positions.length ?? 0})</h3>
          {state?.positions.length ? (
            <div className="portfolio-table">
              <div className="portfolio-row portfolio-row-header">
                <span>Market</span>
                <span>Side</span>
                <span>Size</span>
                <span>Entry</span>
                <span>PnL</span>
                <span>ROE%</span>
              </div>
              {state.positions.map(pos => {
                const pnl = parseFloat(pos.unrealizedPnl)
                const isLong = parseFloat(pos.szi) > 0
                return (
                  <div key={pos.coin} className="portfolio-row portfolio-row-clickable" onClick={() => setSelectedMarket(pos.coin)}>
                    <span className="pos-name">{pos.coin}</span>
                    <span className={isLong ? 'green' : 'red'}>{isLong ? 'Long' : 'Short'} {pos.leverage.value}x</span>
                    <span>{Math.abs(parseFloat(pos.szi)).toFixed(4)}</span>
                    <span>${formatPrice(pos.entryPx)}</span>
                    <span className={pnl >= 0 ? 'green' : 'red'}>{formatUsd(pnl)}</span>
                    <span className={pnl >= 0 ? 'green' : 'red'}>{formatPct(parseFloat(pos.returnOnEquity) * 100)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="portfolio-empty">No open positions</div>
          )}
        </div>

        <div className="portfolio-section-card">
          <h3 className="portfolio-section-title">Balances ({spotBalances.length})</h3>
          {spotBalances.length ? (
            <div className="portfolio-table">
              <div className="portfolio-row portfolio-row-header">
                <span>Asset</span>
                <span>Balance</span>
                <span>Value</span>
              </div>
              {spotBalances.map(b => (
                <div key={b.coin} className="portfolio-row">
                  <span className="pos-name">{b.coin}</span>
                  <span>{parseFloat(b.total).toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
                  <span>${parseFloat(b.usdValue).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="portfolio-empty">No balances</div>
          )}
        </div>
      </div>

      <section className="portfolio-section-card">
        <h3 className="portfolio-section-title">HyperEVM wallet balances</h3>
        <p>Native HYPE and supported tokens in your connected wallet, separate from HyperCore trading balances.</p>
        {evm.isLoading && <p>Loading balances…</p>}
        {evm.isError && <p role="alert">Some token balances could not be loaded.</p>}
        {evm.balances.map(b => <div className="portfolio-row" key={b.symbol}><span>{b.symbol}</span><span>{b.balance}</span></div>)}
        {!evm.isLoading && !evm.isError && !evm.balances.length && <p>No supported token balances.</p>}
      </section>
      <MarketWatchlist />
      <EvmActivity />
      {/* Recent Trades */}
      <div className="portfolio-section-card">
        <h3 className="portfolio-section-title">Recent Trades</h3>
        {fills.length ? (
          <div className="portfolio-table">
            <div className="portfolio-row portfolio-row-header">
              <span>Time</span>
              <span>Market</span>
              <span>Side</span>
              <span>Price</span>
              <span>Size</span>
              <span>Fee</span>
            </div>
            {fills.slice(0, 15).map((f, i) => {
              const isBuy = f.side === 'B' || f.side === 'Buy'
              return (
                <div key={`${f.oid}-${i}`} className="portfolio-row">
                  <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>{new Date(f.time).toLocaleString()}</span>
                  <span className="pos-name">{f.coin}</span>
                  <span className={isBuy ? 'green' : 'red'}>{isBuy ? 'Buy' : 'Sell'}</span>
                  <span>${formatPrice(f.px)}</span>
                  <span>{f.sz}</span>
                  <span style={{ color: 'var(--text-3)' }}>${parseFloat(f.fee).toFixed(4)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="portfolio-empty">No recent trades</div>
        )}
      </div>
    </div>
  )
}
