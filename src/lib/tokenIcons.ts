const cached = new Set(['HYPE', 'BTC', 'ETH', 'SOL', 'USDC', 'USDH'])
const aliases: Record<string, string> = { WHYPE: 'HYPE', UBTC: 'BTC', UETH: 'ETH', USOL: 'SOL' }

export function tokenIconUrls(symbol: string, base: string, logo?: string): string[] {
  // HIP-3 namespaces are case-sensitive. Only lowercase k denotes a multiplier.
  const name = symbol.trim()
  const canonical = aliases[name.toUpperCase()] ?? name
  const names = [...new Set([canonical, ...(canonical.startsWith('k') && /^k[A-Z]/.test(canonical) ? [canonical.slice(1)] : [])])]
  return [...new Set([
    ...names.flatMap(name => [
      ...(cached.has(name) ? [`${base}tokens/hyperliquid/${name}.svg`] : []),
      `https://app.hyperliquid.xyz/coins/${encodeURIComponent(name)}.svg`,
    ]),
    ...(logo ? [logo] : []),
  ])]
}
