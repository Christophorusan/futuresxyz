export type BalancePoint = { time: number; value: number }
export function parseHistory(raw: string | null): BalancePoint[] {
  try {
    const data: unknown = JSON.parse(raw || '[]')
    if (!Array.isArray(data)) return []
    const unique = new Map<number, BalancePoint>()
    for (const p of data) if (p && Number.isFinite(p.time) && p.time > 0 && Number.isFinite(p.value) && p.value >= 0) unique.set(p.time, {time:p.time,value:p.value})
    return [...unique.values()].sort((a,b)=>a.time-b.time)
  } catch { return [] }
}
export function appendSnapshot(points: BalancePoint[], point: BalancePoint): BalancePoint[] {
  if (!Number.isFinite(point.value) || point.value < 0 || !Number.isFinite(point.time)) return points
  const previous = points.at(-1)
  const next = !previous || point.time-previous.time >= 60000 ? [...points,point] : points
  // Minute resolution for the last day, hourly resolution for older observations.
  const buckets = new Map<number,BalancePoint>()
  for (const p of next) {
    if (p.time < point.time-90*86400000) continue
    const interval = p.time >= point.time-86400000 ? 60000 : 3600000
    buckets.set(Math.floor(p.time/interval)*interval,p)
  }
  return [...buckets.values()].sort((a,b)=>a.time-b.time)
}
