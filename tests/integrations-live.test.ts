import { test, expect } from 'vitest'
import { InfoClient, HttpTransport } from '@nktkas/hyperliquid'
import { readProviderMarkets } from '../src/lib/lending/providerMarkets'
import { loadDiscovery } from '../src/lib/llamaDiscovery'
const enabled = process.env.LIVE_INTEGRATIONS === '1'
for (const provider of ['aave', 'morpho']) test.skipIf(!enabled)(`${provider} live market API`, async () => {
  const markets = await readProviderMarkets(provider)
  expect(markets.length).toBeGreaterThan(0)
  expect(markets.some(m => m.supplyApy !== null)).toBe(true)
  console.log(provider, markets.length, 'markets')
}, 30000)
test.skipIf(!enabled)('DeFiLlama live discovery feeds', async () => {
  const apps = await loadDiscovery()
  expect(apps.length).toBeGreaterThan(0)
  console.log('Discovery', apps.length, 'qualified listings')
}, 30000)
test.skipIf(!enabled)('Hyperliquid live spot, perps and candles', async () => {
  const info = new InfoClient({ transport: new HttpTransport() })
  const [spot, perps, candles] = await Promise.all([info.spotMetaAndAssetCtxs(), info.metaAndAssetCtxs(), info.candleSnapshot({coin:'BTC',interval:'1h',startTime:Date.now()-86400000,endTime:Date.now()})])
  expect(spot[0].universe.length).toBeGreaterThan(0)
  expect(perps[0].universe.length).toBeGreaterThan(0)
  expect(candles.length).toBeGreaterThan(0)
  console.log('Hyperliquid', spot[0].universe.length, 'spot pairs;',perps[0].universe.length,'perps')
},30000)

test.skipIf(!enabled)('deBridge public token metadata', async () => {
  const response = await fetch('https://dln.debridge.finance/v1.0/token-list?chainId=42161', {signal:AbortSignal.timeout(20000)})
  expect(response.ok).toBe(true)
  const data = await response.json()
  expect(Object.keys(data.tokens ?? {}).length).toBeGreaterThan(0)
},30000)
