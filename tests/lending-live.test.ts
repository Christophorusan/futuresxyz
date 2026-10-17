import { test, expect } from 'vitest'
import { createPublicClient, http } from 'viem'
import { hyperEvm } from 'viem/chains'
import { readMarkets, readPosition } from '../src/lib/lending/markets'
const rpc = process.env.LIVE_RPC
const client = createPublicClient({ chain: hyperEvm, transport: http(rpc || 'http://127.0.0.1:8545', { batch: true }) })
for (const protocol of ['hyperlend', 'hypurrfi'] as const) {
  test.skipIf(!rpc)(`${protocol} deployed registry, reserves and account ABI`, async () => {
    const data = await readMarkets(client, protocol)
    expect(data.markets.length).toBeGreaterThan(0)
    const market = data.markets.find(m => m.symbol === 'WHYPE') || data.markets[0]
    const position = await readPosition(client, market, '0x0000000000000000000000000000000000000001')
    expect(position.priceUnit).toBeGreaterThan(0n)
    console.log(protocol, String(data.blockNumber), data.markets.map(m => `${m.symbol}:${m.active ? 'active' : 'inactive'}${m.paused ? ':paused' : ''}`).join(', '))
  }, 120000)
}
