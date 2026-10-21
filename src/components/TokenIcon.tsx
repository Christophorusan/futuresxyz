import { useState } from 'react'

export function TokenIcon({ symbol, size = 18, logo }: { symbol: string; size?: number; logo?:string }) {
  const [tryIndex, setTryIndex] = useState(0)
  const raw = symbol.toUpperCase()
  const clean = raw.replace(/^K/, '')

  // Verified local wallet assets, then the Hyperliquid market icon CDN.
  const localSymbol = raw === 'WHYPE' ? 'HYPE' : raw
  const urls = [
    ...(logo ? [logo] : []),
    ...(['HYPE', 'USDC', 'USDT0', 'USDH'].includes(localSymbol) ? [`${import.meta.env.BASE_URL}tokens/${localSymbol}.svg`] : []),
    `https://app.hyperliquid.xyz/coins/${raw}.svg`,
    `https://app.hyperliquid.xyz/coins/${clean}.svg`,
  ]

  if (tryIndex >= urls.length) {
    const colors: Record<string, string> = {
      B: '#f7931a', E: '#627eea', S: '#9945ff', H: '#00d4aa',
      X: '#00aae4', D: '#c2a633', A: '#0033ad', L: '#2a5ada',
      P: '#8247e5', T: '#1c1c1c', G: '#16a34a', F: '#6366f1',
      R: '#ef4444', M: '#3b82f6', N: '#f59e0b', O: '#14b8a6',
      C: '#8b5cf6', W: '#ec4899', I: '#06b6d4', K: '#22c55e',
      V: '#a855f7', Z: '#0ea5e9', U: '#f97316', J: '#10b981',
      Y: '#eab308', Q: '#6366f1',
    }
    const color = colors[clean[0]] || '#6366f1'
    return (
      <span
        className="token-icon-fallback"
        style={{
          width: size, height: size, borderRadius: '50%', background: color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, fontWeight: 700, color: '#fff', flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {clean[0]}
      </span>
    )
  }

  return (
    <img
      src={urls[tryIndex]}
      alt={clean}
      width={size}
      height={size}
      className="token-icon"
      style={{ borderRadius: '50%', flexShrink: 0, background: localSymbol === 'HYPE' ? '#072f2c' : undefined, padding: localSymbol === 'HYPE' ? size * 0.14 : 0, boxSizing: 'border-box' }}
      onError={() => setTryIndex(i => i + 1)}
    />
  )
}
