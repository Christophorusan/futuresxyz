export interface ProviderMarket {
  id: string; asset: string; network: string; market: string; collateral?: string
  supplyApy: number | null; borrowApy: number | null; status: string
}
export function annualRate(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number * 100 : null
}
type AaveMarket = { address: string; name: string; chain: { name: string }; reserves: { underlyingToken: { address: string; symbol: string }; supplyInfo: { apy: { value: string } }; borrowInfo: { apy: { value: string } } | null; isFrozen: boolean; isPaused: boolean }[] }
type MorphoMarket = { marketId: string; loanAsset: { symbol: string }; collateralAsset: { symbol: string } | null; morphoBlue: { chain: { id: number } }; state: { supplyApy: number; borrowApy: number } | null }
export async function readProviderMarkets(provider: string, signal?: AbortSignal): Promise<ProviderMarket[]> {
  if (provider !== 'aave' && provider !== 'morpho') throw new Error('Unsupported provider')
  const aave = provider === 'aave'
  const query = aave
    ? '{ markets(request: {chainIds: [1,42161,8453,10,137]}) { name address chain {name} reserves { underlyingToken {symbol address} supplyInfo { apy {value} } borrowInfo { apy {value} } isFrozen isPaused } } }'
    : '{ markets(first: 50, where: { chainId_in: [1,8453], listed: true }, orderBy: SupplyAssetsUsd, orderDirection: Desc) { items { marketId loanAsset {symbol} collateralAsset {symbol} morphoBlue {chain {id}} state {supplyApy borrowApy} } } }'
  const response = await fetch(aave ? 'https://api.v3.aave.com/graphql' : 'https://api.morpho.org/graphql', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Market service unavailable')
  const result = await response.json()
  if (result.errors?.length || !result.data?.markets) throw new Error('Market service returned incomplete data')
  if (aave) {
    if (!Array.isArray(result.data.markets)) throw new Error('Invalid market response')
    return (result.data.markets as AaveMarket[]).flatMap(m => m.reserves.map(r => ({
      id: `${m.chain.name}:${m.address}:${r.underlyingToken.address}`, asset: r.underlyingToken.symbol,
      network: m.chain.name, market: m.name, supplyApy: annualRate(r.supplyInfo.apy.value),
      borrowApy: annualRate(r.borrowInfo?.apy.value), status: r.isPaused ? 'Paused' : r.isFrozen ? 'Frozen' : 'Active',
    })))
  }
  if (!Array.isArray(result.data.markets.items)) throw new Error('Invalid market response')
  return (result.data.markets.items as MorphoMarket[]).map(m => ({
    id: `${m.morphoBlue.chain.id}:${m.marketId}`, asset: m.loanAsset.symbol,
    network: m.morphoBlue.chain.id === 1 ? 'Ethereum' : 'Base', market: m.marketId,
    collateral: m.collateralAsset?.symbol ?? 'None', supplyApy: annualRate(m.state?.supplyApy),
    borrowApy: annualRate(m.state?.borrowApy), status: m.state ? 'Listed' : 'Data unavailable',
  }))
}
