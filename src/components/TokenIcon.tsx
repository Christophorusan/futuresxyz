import { useState } from 'react'
import { tokenIconUrls } from '../lib/tokenIcons'

export function TokenIcon({ symbol, size = 18, logo, fallback = 'icon', preferLogo = false }: { symbol: string; size?: number; logo?:string; fallback?: 'letter' | 'icon'; preferLogo?: boolean }) {
  const sources = tokenIconUrls(symbol, import.meta.env.BASE_URL, logo)
  const urls = preferLogo && logo ? [logo, ...sources.filter(url => url !== logo)] : sources
  return <TokenIconImage key={JSON.stringify(urls)} symbol={symbol} size={size} urls={urls} fallback={fallback} />
}

function TokenIconImage({ symbol, size, urls, fallback }: { symbol: string; size: number; urls: string[]; fallback: 'letter' | 'icon' }) {
  const [tryIndex, setTryIndex] = useState(0)
  const clean = symbol.split(':').pop() || symbol

  if (tryIndex >= urls.length) {
    if (fallback === 'icon') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" role="img" aria-label={`${clean} logo unavailable`} style={{ flexShrink: 0, color: 'var(--text-2)' }}><circle cx="12" cy="12" r="10" /><path d="m12 6 5 6-5 6-5-6Z" /></svg>

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
      style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'contain', boxSizing: 'border-box' }}
      onError={() => setTryIndex(i => i + 1)}
    />
  )
}
