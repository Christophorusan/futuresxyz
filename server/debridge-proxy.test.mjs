import { describe, it, expect } from 'vitest'
import { once } from 'node:events'
import { createDeBridgeServer, upstreamRequest } from './debridge-proxy.mjs'
const account = '0x1111111111111111111111111111111111111111'
const valid = () => new URLSearchParams({ srcChainId: '42161', dstChainId: '100000022', srcChainTokenIn: account, dstChainTokenOut: account, srcChainTokenInAmount: '1000000', dstChainTokenOutAmount: 'auto', prependOperatingExpenses: 'false', senderAddress: account, srcChainOrderAuthorityAddress: account, dstChainOrderAuthorityAddress: account, dstChainTokenOutRecipient: account, srcAllowedCancelBeneficiary: account })
describe('deBridge backend boundary', () => {
  it('authenticates only against the official API and accepts internal HyperEVM ID', () => {
    const url = new URL(upstreamRequest('/dln/order/create-tx', valid(), 'test-secret'))
    expect(url.origin).toBe('https://dln.debridge.finance'); expect(url.searchParams.get('accesstoken')).toBe('test-secret')
    expect(url.searchParams.get('dstChainId')).toBe('100000022')
  })
  it('rejects injected fees, credentials, duplicate fields and different cancellation authorities', () => {
    for (const [key, value] of [['affiliateFeePercent', '10'], ['accesstoken', 'evil'], ['dstChainId', '999'], ['srcAllowedCancelBeneficiary', `0x${'2'.repeat(40)}`], ['srcChainTokenInAmount', '-1'], ['prependOperatingExpenses', 'true']]) {
      const params = valid(); params.set(key, value); expect(() => upstreamRequest('/dln/order/create-tx', params, 'test')).toThrow()
    }
    const params = valid(); params.append('senderAddress', account)
    expect(() => upstreamRequest('/dln/order/create-tx', params, 'test')).toThrow()
    expect(() => upstreamRequest('/token-list', new URLSearchParams('chainId=42161&chainId=42161'), 'test')).toThrow()
    expect(() => upstreamRequest('/https://evil.test', new URLSearchParams(), 'test')).toThrow()
  })
  it('allows anonymous estimates without inserting a fake wallet', () => {
    const params = valid()
    for (const k of ['senderAddress', 'srcChainOrderAuthorityAddress', 'dstChainOrderAuthorityAddress', 'dstChainTokenOutRecipient', 'srcAllowedCancelBeneficiary']) params.delete(k)
    expect(new URL(upstreamRequest('/dln/order/create-tx', params, 'test')).searchParams.has('senderAddress')).toBe(false)
  })
  it('blocks other origins/methods and never returns the private key', async () => {
    let calls = 0
    const server = createDeBridgeServer({ ALLOWED_ORIGINS: 'https://oslo.test', DEBRIDGE_API_KEY: 'test-secret' }, async url => {
      calls++; expect(new URL(url).searchParams.get('accesstoken')).toBe('test-secret')
      return new Response(JSON.stringify({ chains: [42161, 8453] }))
    })
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const url = `http://127.0.0.1:${server.address().port}/supported-chains`
    try {
      expect((await fetch(url, { headers: { Origin: 'https://evil.test' } })).status).toBe(403)
      expect((await fetch(url, { method: 'POST', headers: { Origin: 'https://oslo.test' } })).status).toBe(405)
      const result = await fetch(url, { headers: { Origin: 'https://oslo.test' } })
      expect(await result.text()).not.toContain('test-secret'); expect(calls).toBe(1)
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
  })
})
