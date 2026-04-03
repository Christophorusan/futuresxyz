import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type Time } from 'lightweight-charts'
import { useMarket } from '../../contexts/MarketContext'
import { useCandles } from '../../hooks/useCandles'
import { useTheme } from '../../contexts/ThemeContext'

type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d']

function getChartColors(theme: 'dark' | 'light') {
  return theme === 'dark' ? {
    bg: '#13141a',
    text: '#5c5e69',
    grid: 'rgba(255, 255, 255, 0.03)',
    cross: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.05)',
    up: '#2dd4bf',
    down: '#ef4444',
    volUp: 'rgba(45, 212, 191, 0.25)',
    volDown: 'rgba(239, 68, 68, 0.25)',
  } : {
    bg: '#fafafa',
    text: '#9ca3af',
    grid: 'rgba(0, 0, 0, 0.04)',
    cross: 'rgba(0, 0, 0, 0.08)',
    border: 'rgba(0, 0, 0, 0.06)',
    up: '#14b8a6',
    down: '#dc2626',
    volUp: 'rgba(20, 184, 166, 0.25)',
    volDown: 'rgba(220, 38, 38, 0.25)',
  }
}

export function PriceChart() {
  const { selectedMarket } = useMarket()
  const { theme } = useTheme()
  const [interval, setInterval] = useState<CandleInterval>('1h')
  const { candles, loading } = useCandles(selectedMarket, interval)

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return

    const c = getChartColors(theme)
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: c.bg },
        textColor: c.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: c.grid },
        horzLines: { color: c.grid },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: c.cross, width: 1, style: 2 },
        horzLine: { color: c.cross, width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: c.border,
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: c.border,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: c.up,
      downColor: c.down,
      borderUpColor: c.up,
      borderDownColor: c.down,
      wickUpColor: c.up,
      wickDownColor: c.down,
    })

    // Volume histogram overlay on the same pane
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    seriesRef.current = series
    volumeRef.current = volumeSeries

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      chart.resize(width, height)
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeRef.current = null
    }
  }, [theme])

  // Update data
  useEffect(() => {
    if (!seriesRef.current || !volumeRef.current || candles.length === 0) return

    const c = getChartColors(theme)

    const candleData: CandlestickData<Time>[] = candles.map(candle => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))

    const volumeData: HistogramData<Time>[] = candles.map(candle => ({
      time: candle.time as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? c.volUp : c.volDown,
    }))

    seriesRef.current.setData(candleData)
    volumeRef.current.setData(volumeData)
    chartRef.current?.timeScale().fitContent()
  }, [candles, theme])

  return (
    <div className="chart-container">
      <div className="chart-controls">
        {INTERVALS.map(i => (
          <button
            key={i}
            className={`chart-interval ${interval === i ? 'active' : ''}`}
            onClick={() => setInterval(i)}
          >
            {i}
          </button>
        ))}
      </div>
      {loading && candles.length === 0 && (
        <div className="chart-loading">Loading chart...</div>
      )}
      <div className="chart-wrapper" ref={containerRef} />
    </div>
  )
}
