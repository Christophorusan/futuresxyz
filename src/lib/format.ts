// Format price with appropriate decimals
export function formatPrice(price: number | string, decimals = 2): string {
  const n = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(n)) return '—'
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(decimals)
  // Small prices: show more decimals
  return n.toFixed(Math.max(decimals, 4))
}

// Format size with szDecimals from market meta
export function formatSize(size: number | string, szDecimals: number): string {
  const n = typeof size === 'string' ? parseFloat(size) : size
  if (isNaN(n)) return '0'
  return n.toFixed(szDecimals)
}

// Format USD amounts
export function formatUsd(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '$0.00'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}K`
  return `$${n.toFixed(2)}`
}

// Format percentage
export function formatPct(pct: number | string): string {
  const n = typeof pct === 'string' ? parseFloat(pct) : pct
  if (isNaN(n)) return '0%'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

// Truncate address
export function truncAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
