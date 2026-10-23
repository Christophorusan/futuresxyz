import { describe, it, expect } from 'vitest'
import { once } from 'node:events'
import { createAcrossServer, upstreamRequest } from './across-proxy.mjs'
const address = '0x1111111111111111111111111111111111111111'
const valid = () => new URLSearchParams({ originChainId: '42161', destinationChainId: '8453', inputToken: address, outputToken: address, amount: '10000000', depositor: address, recipient: address })
describe('Across server boundary', () => {
  it('uses only the official upstream and fixes slippage and refund policy', () => {
    const url = new URL(upstreamRequest('/quote', valid(), '0xabcd'))
    expect(url.origin).toBe('https://app.across.to')
    expect(url.pathname).toBe('/api/swap/approval')
    expect(url.searchParams.get('slippage')).toBe('0.005')
    expect(url.searchParams.get('refundAddress')).toBe(address)
    expect(url.searchParams.get('refundOnOrigin')).toBe('true')
  })
  it('rejects arbitrary targets, app fees, unsupported networks and duplicate fields', () => {
    expect(() => upstreamRequest('/https://evil.test', valid(), '0xabcd')).toThrow()
    for (const [key, value] of [['appFee', '0.5'], ['originChainId', '7565164'], ['recipient', 'bad'], ['amount', '-1']]) {
      const params = valid(); params.set(key, value); expect(() => upstreamRequest('/quote', params, '0xabcd')).toThrow()
    }
    const params = valid(); params.append('amount', '1'); expect(() => upstreamRequest('/quote', params, '0xabcd')).toThrow()
  })
  it('keeps credentials server-side and blocks other origins and methods', async () => {
    let calls = 0
    const server = createAcrossServer({ ALLOWED_ORIGINS: 'https://oslo.test', ACROSS_API_KEY: 'test-secret', ACROSS_INTEGRATOR_ID: '0xabcd' }, async (url, options) => {
      calls++; expect(options.headers.Authorization).toBe('Bearer test-secret'); expect(url).not.toContain('test-secret')
      return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
    })
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const url = `http://127.0.0.1:${server.address().port}/tokens`
    try {
      expect((await fetch(url, { headers: { Origin: 'https://evil.test' } })).status).toBe(403)
      expect((await fetch(url, { method: 'POST', headers: { Origin: 'https://oslo.test' } })).status).toBe(405)
      const result = await fetch(url, { headers: { Origin: 'https://oslo.test' } })
      expect(result.status).toBe(200); expect(await result.text()).toBe('[]'); expect(calls).toBe(1)
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
  })
})
