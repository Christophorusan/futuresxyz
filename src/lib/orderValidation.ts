/** Hyperliquid allows five significant price figures, with integer prices exempt. */
export function orderPrice(value: number, szDecimals: number, spot = false): string {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid positive price')
  const cap = (spot ? 8 : 6) - szDecimals
  if (!Number.isInteger(cap) || cap < 0) throw new Error('Invalid market precision')
  if (Number.isInteger(value)) return value.toFixed(0)
  const significant = Number(value.toPrecision(5))
  const rounded = Number(significant.toFixed(cap))
  if (rounded <= 0) throw new Error('Price is below the market tick size')
  return rounded.toFixed(cap).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}
export function orderSize(value: number, decimals: number): string {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(decimals) || decimals < 0 || decimals > 8) throw new Error('Enter a valid order size')
  // Truncate instead of rounding above the amount the user chose.
  const rounded = Math.floor(value * 10 ** decimals) / 10 ** decimals
  if (rounded <= 0) throw new Error('Order size is below the market minimum increment')
  return rounded.toFixed(decimals).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}
export function orderOutcome(result: unknown): string {
  const r = result as { status?: string; response?: { data?: { statuses?: Array<{error?: string; filled?: {totalSz:string}; resting?: {oid:number}}> } } }
  const statuses = r?.response?.data?.statuses
  if (r?.status !== 'ok' || !statuses?.length) throw new Error('Exchange did not confirm the order. Check open orders before retrying.')
  const errors = statuses.flatMap(s => s.error ? [s.error] : [])
  if (errors.length) throw new Error(`Exchange response: ${errors.join('; ')}. Check orders and positions before retrying.`)
  const first = statuses[0]
  if (first.filled) return `Filled ${first.filled.totalSz}`
  if (first.resting) return `Limit order placed (#${first.resting.oid})`
  throw new Error('Order is pending. Check open orders before retrying.')
}
