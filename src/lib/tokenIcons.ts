const cached = new Set(['HYPE', 'BTC', 'ETH', 'SOL', 'USDC', 'USDH'])
const lendingLogos = ['wstHYPE', 'USDe', 'sUSDe', 'USDT0', 'USDHL', 'kHYPE', 'USR', 'beHYPE']
const networkLogos = new Set(['ARB', 'OP', 'POL'])

const aliases: Record<string, string> = { WHYPE: 'HYPE', UBTC: 'BTC', UETH: 'ETH', USOL: 'SOL' }

export function tokenIconUrls(symbol: string, base: string, logo?: string): string[] {
  // HIP-3 namespaces are case-sensitive. Only lowercase k denotes a multiplier.
  const name = symbol.trim()
  const canonical = aliases[name.toUpperCase()] ?? (cached.has(name.toUpperCase()) ? name.toUpperCase() : name)
  const lendingName = name === 'USD₮0' ? 'USDT0' : name.toLowerCase() === 'sthype' ? 'wstHYPE' : lendingLogos.find(logo => logo.toLowerCase() === name.toLowerCase())
  const lendingLogo = lendingName ?? (/^PT-kHYPE-/i.test(name) ? 'PT-kHYPE' : /^PT-sUSDe-/i.test(name) ? 'PT-sUSDe' : undefined)
  const names = [...new Set([canonical, ...(canonical.startsWith('k') && /^k[A-Z]/.test(canonical) ? [canonical.slice(1)] : [])])]
  return [...new Set([
    ...(lendingLogo ? [`${base}tokens/hyperlend/${lendingLogo}.svg`] : []),
    ...(networkLogos.has(name.toUpperCase()) ? [`${base}tokens/networks/${name.toUpperCase()}.png`] : []),
    ...names.flatMap(name => [
      ...(cached.has(name) ? [`${base}tokens/hyperliquid/${name}.svg`] : []),
      `https://app.hyperliquid.xyz/coins/${encodeURIComponent(name)}.svg`,
    ]),
    ...(logo ? [logo] : []),
  ])]
}
