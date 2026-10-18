import { afterEach, expect, test, vi } from 'vitest'
import { parseTransfers } from '../src/lib/alchemyData'
const address = '0x1111111111111111111111111111111111111111'
const hash = `0x${'a'.repeat(64)}`
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })
test('parses indexed history without treating missing amounts as zero', () => {
  const result = parseTransfers({ transfers: [{ hash, uniqueId: 'id', from: address, to: address, value: null }], pageKey: 'next' })
  expect(result.transfers[0].amount).toBe('Amount unavailable')
  expect(result.pageKey).toBe('next')
})
test('rejects malformed hashes and missing transfer arrays', () => {
  expect(() => parseTransfers({ transfers: [{ hash: 'javascript:bad', from: address, to: address, uniqueId: 'x' }] })).toThrow()
  expect(() => parseTransfers({})).toThrow()
})
test('unconfigured data client does not call the network', async () => {
  vi.stubEnv('VITE_ALCHEMY_API_KEY', '')
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
  vi.resetModules()
  const { alchemyRead } = await import('../src/lib/alchemyData')
  await expect(alchemyRead('eth_chainId', [])).rejects.toThrow('not configured')
  expect(fetcher).not.toHaveBeenCalled()
})
test('redacts provider errors and refuses write methods', async () => {
  vi.stubEnv('VITE_ALCHEMY_API_KEY', 'test-key')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret endpoint')))
  vi.resetModules()
  const { alchemyRead } = await import('../src/lib/alchemyData')
  await expect(alchemyRead('eth_chainId', [])).rejects.toThrow('Alchemy data is unavailable')
  await expect(alchemyRead('eth_sendRawTransaction', [])).rejects.toThrow('Unsupported read method')
})
test('incoming pagination stays scoped to the selected account', async () => {
  vi.stubEnv('VITE_ALCHEMY_API_KEY', 'test-key')
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: { transfers: [] } }) }); vi.stubGlobal('fetch', fetcher)
  vi.resetModules()
  const { getTransfers } = await import('../src/lib/alchemyData')
  await getTransfers(address, 'incoming', 'cursor')
  const params = JSON.parse(fetcher.mock.calls[0][1].body).params[0]
  expect(params.toAddress).toBe(address); expect(params.fromAddress).toBeUndefined()
  expect(params.pageKey).toBe('cursor'); expect(params.maxCount).toBe('0x14')
})
