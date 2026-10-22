export interface LlamaProtocol {
  id?: string; defillamaId?: string; slug?: string; name?: string; category?: string
  chains?: string[]; description?: string; url?: string; tvl?: number; total24h?: number | null
  rugged?: boolean; deadFrom?: number; deadUrl?: boolean; parentProtocol?: string; protocolType?: string
}
export interface DiscoveryListing {
  id: string; slug: string; name: string; category: string; networks: string[]; description: string
  url?: string; tvl: number | null; revenue: number | null; detailPath?: string
}
export const listingThresholds = { tvl: 20_000_000, revenue: 2_000 }
const amount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
export function qualifies(tvl: unknown, revenue: unknown) {
  return (amount(tvl) ?? -1) >= listingThresholds.tvl || (amount(revenue) ?? -1) >= listingThresholds.revenue
}
export function officialUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined } catch { return undefined }
}
const internalViews: Record<string, string> = { 'aave-v3': '/lending/aave', 'morpho-blue': '/lending/morpho', 'kamino-lend': '/lending/kamino', 'hyperliquid-perps': '/perps', 'hyperlend-pooled': '/lending', 'hyperliquid-spot-orderbook': '/spot' }
export function buildListings(protocols: LlamaProtocol[], revenues: LlamaProtocol[]): DiscoveryListing[] {
  // Join exact protocol IDs only. Parent revenue must never qualify every child app.
  const revenueById = new Map(revenues.filter(r => r.defillamaId).map(r => [String(r.defillamaId), r]))
  const all = new Map(protocols.filter(p => p.id).map(p => [String(p.id), p]))
  for (const r of revenues) if (r.defillamaId && !all.has(String(r.defillamaId)) && r.protocolType === 'protocol' && !String(r.defillamaId).startsWith('parent#')) all.set(String(r.defillamaId), r)
  const blocked = new Set(protocols.filter(p => p.rugged || p.deadFrom || p.deadUrl).map(p => String(p.id)))
  const result: DiscoveryListing[] = []
  for (const [id, p] of all) {
    if (blocked.has(id) || (p.parentProtocol && blocked.has(p.parentProtocol)) || p.rugged || p.deadFrom || p.deadUrl || ['CEX', 'Chain'].includes(p.category ?? '')) continue
    const revenue = amount(revenueById.get(id)?.total24h)
    const tvl = amount(p.tvl)
    if (!qualifies(tvl, revenue) || !p.name || !p.slug) continue
    result.push({ id, slug: p.slug, name: p.name, category: p.category ?? 'Other', networks: (p.chains ?? []).filter(n => typeof n === 'string'), description: p.description ?? `Explore ${p.category ?? 'DeFi'} products and protocol information.`, url: officialUrl(p.url), tvl, revenue, detailPath: internalViews[p.slug] })
  }
  return result.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0) || (b.revenue ?? 0) - (a.revenue ?? 0) || a.name.localeCompare(b.name))
}
export async function loadDiscovery(signal?: AbortSignal) {
  const request = async (url: string) => {
    const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error('DeFiLlama is unavailable')
    return response.json()
  }
  // Require both feeds: never silently drop revenue-qualified apps on a failed request.
  const [protocols, fees] = await Promise.all([
    request('https://api.llama.fi/protocols'),
    request('https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyRevenue'),
  ])
  if (!Array.isArray(protocols) || !Array.isArray(fees.protocols)) throw new Error('Invalid DeFiLlama response')
  return buildListings(protocols, fees.protocols)
}
const aliases: Record<string, string> = { lend: 'lending', borrow: 'lending', borrowing: 'lending', perps: 'derivatives', trade: 'derivatives', trading: 'derivatives', swap: 'dex', swaps: 'dex', arb: 'arbitrum', eth: 'ethereum', sol: 'solana' }
const ignored = new Set(['i','want','to','on','the','with','my','find','apps','app','for','in'])
export function filterListings(apps: DiscoveryListing[], query: string, category: string, network: string) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !ignored.has(t)).map(t => aliases[t] ?? t)
  const selected = ({ lending: 'Lending', perps: 'Derivatives', swap: 'Dexs' } as Record<string, string>)[category] ?? category
  return apps.filter(app => (selected === 'all' || app.category === selected) && (network === 'all' || app.networks.includes(network)) && terms.every(t => `${app.name} ${app.category} ${app.networks.join(' ')} ${app.description}`.toLowerCase().includes(t)))
}
