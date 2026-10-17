import { erc20Abi, type Address, type PublicClient } from 'viem'
import { protocols, dataAbi, registryAbi, poolAbi, oracleAbi, type ProtocolId } from './contracts'

export interface LendingMarket {
  protocol: ProtocolId; asset: Address; symbol: string; decimals: number
  supply: bigint; debt: bigint; supplyRate: bigint; borrowRate: bigint
  active: boolean; frozen: boolean; paused: boolean; borrowing: boolean
  collateral: boolean; ltv: bigint; liquidationThreshold: bigint
  supplyCap: bigint; borrowCap: bigint; aToken: Address
}
export async function verifyProtocol(client: PublicClient, id: ProtocolId) {
  if (await client.getChainId() !== 999) throw new Error('Expected HyperEVM (chain 999).')
  const p = protocols[id]
  const [pool, provider] = await Promise.all([
    client.readContract({ address: p.provider, abi: registryAbi, functionName: 'getPool' }),
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'ADDRESSES_PROVIDER' }),
  ])
  if (pool.toLowerCase() !== p.pool || provider.toLowerCase() !== p.provider) {
    throw new Error(`${p.name} deployment changed. Trading is unavailable until addresses are reviewed.`)
  }
}
export async function readMarket(client: PublicClient, id: ProtocolId, asset: Address, symbol: string): Promise<LendingMarket> {
  const p = protocols[id]
  const [config, data, caps, paused, tokens] = await Promise.all([
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'getReserveConfigurationData', args: [asset] }),
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'getReserveData', args: [asset] }),
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'getReserveCaps', args: [asset] }),
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'getPaused', args: [asset] }),
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'getReserveTokensAddresses', args: [asset] }),
  ])
  return { protocol: id, asset, symbol, decimals: Number(config[0]), ltv: config[1], liquidationThreshold: config[2],
    collateral: config[5], borrowing: config[6], active: config[8], frozen: config[9], paused,
    supply: data[2], debt: data[3] + data[4], supplyRate: data[5], borrowRate: data[6],
    borrowCap: caps[0], supplyCap: caps[1], aToken: tokens[0] }
}
export async function readMarkets(client: PublicClient, id: ProtocolId) {
  await verifyProtocol(client, id)
  const blockNumber = await client.getBlockNumber()
  const tokens = await client.readContract({ address: protocols[id].data, abi: dataAbi, functionName: 'getAllReservesTokens' })
  // Limit concurrency while HTTP batching combines each group's RPC reads.
  const markets: LendingMarket[] = []
  for (let i = 0; i < tokens.length; i += 4) {
    markets.push(...await Promise.all(tokens.slice(i, i + 4).map(t => readMarket(client, id, t.tokenAddress, t.symbol))))
  }
  return { markets, blockNumber }
}
export async function readPosition(client: PublicClient, market: LendingMarket, account: Address) {
  const p = protocols[market.protocol]
  const blockNumber = await client.getBlockNumber()
  const oracle = await client.readContract({ address: p.provider, abi: registryAbi, functionName: 'getPriceOracle' })
  const [reserve, summary, balance, allowance, liquidity, price, priceUnit] = await Promise.all([
    client.readContract({ address: p.data, abi: dataAbi, functionName: 'getUserReserveData', args: [market.asset, account] }),
    client.readContract({ address: p.pool, abi: poolAbi, functionName: 'getUserAccountData', args: [account] }),
    client.readContract({ address: market.asset, abi: erc20Abi, functionName: 'balanceOf', args: [account] }),
    client.readContract({ address: market.asset, abi: erc20Abi, functionName: 'allowance', args: [account, p.pool] }),
    client.readContract({ address: market.asset, abi: erc20Abi, functionName: 'balanceOf', args: [market.aToken] }),
    client.readContract({ address: oracle, abi: oracleAbi, functionName: 'getAssetPrice', args: [market.asset] }),
    client.readContract({ address: oracle, abi: oracleAbi, functionName: 'BASE_CURRENCY_UNIT' }),
  ])
  return { supplied: reserve[0], debt: reserve[2], stableDebt: reserve[1], collateralEnabled: reserve[8],
    collateralBase: summary[0], debtBase: summary[1], availableBorrowsBase: summary[2],
    liquidationThreshold: summary[3], healthFactor: summary[5], balance, allowance, liquidity, price, priceUnit, blockNumber }
}
export type LendingPosition = Awaited<ReturnType<typeof readPosition>>
export function rateToApy(rate: bigint) {
  return Math.expm1(31536000 * Math.log1p(Number(rate) / 1e27 / 31536000)) * 100
}
