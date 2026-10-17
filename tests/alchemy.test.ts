import { beforeEach, expect, test, vi } from 'vitest'
import { createWalletClient, custom } from 'viem'
import { hyperEvm } from 'viem/chains'

const mocks = vi.hoisted(() => ({
  requestAccount: vi.fn(), sendCalls: vi.fn(), waitForCallsStatus: vi.fn(),
}))
vi.mock('@alchemy/wallet-apis', () => ({
  alchemyWalletTransport: vi.fn(),
  createSmartWalletClient: vi.fn(() => mocks),
}))
const owner = '0x1111111111111111111111111111111111111111'
const account = '0x2222222222222222222222222222222222222222'
const signer = createWalletClient({ account: owner, chain: hyperEvm, transport: custom({ request: vi.fn() }) })
const calls = [{ to: owner, data: '0x' }] as const
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('VITE_ALCHEMY_API_KEY', 'browser-test-key')
  mocks.requestAccount.mockResolvedValue({ address: account })
  mocks.sendCalls.mockResolvedValue({ id: 'operation-1' })
})

test('rejects unconfigured wallets before accessing Alchemy', async () => {
  vi.stubEnv('VITE_ALCHEMY_API_KEY', '')
  const { createHyperEvmSmartWallet } = await import('../src/lib/alchemyWallet')
  expect(() => createHyperEvmSmartWallet(signer)).toThrow('not configured')
  expect(mocks.requestAccount).not.toHaveBeenCalled()
})
test('blocks submission when the reviewed smart account differs', async () => {
  const { submitHyperEvmBatch } = await import('../src/lib/alchemyWallet')
  await expect(submitHyperEvmBatch(signer, owner, [...calls], vi.fn())).rejects.toThrow('Wallet changed')
  expect(mocks.sendCalls).not.toHaveBeenCalled()
})
test('records operation ID before polling and never resubmits on timeout', async () => {
  const { submitHyperEvmBatch } = await import('../src/lib/alchemyWallet')
  const submitted = vi.fn()
  mocks.waitForCallsStatus.mockRejectedValue(new Error('timeout'))
  await expect(submitHyperEvmBatch(signer, account, [...calls], submitted)).rejects.toThrow('timeout')
  expect(submitted).toHaveBeenCalledWith('operation-1')
  expect(mocks.sendCalls).toHaveBeenCalledTimes(1)
  expect(mocks.sendCalls).toHaveBeenCalledWith({ account, calls })
})
test('no key uses only the public RPC', async () => {
  vi.stubEnv('VITE_ALCHEMY_API_KEY', '')
  const { alchemyTransport } = await import('../src/config/alchemy')
  const transport = alchemyTransport('hyperliquid-mainnet', 'https://rpc.example')({})
  expect(transport.config.type).toBe('http')
  expect(transport.value?.url).toBe('https://rpc.example')
})
test('configured key selects Alchemy first with public fallback', async () => {
  const { alchemyTransport } = await import('../src/config/alchemy')
  const transport = alchemyTransport('hyperliquid-mainnet', 'https://rpc.example')({})
  expect(transport.config.type).toBe('fallback')
  expect(transport.value?.transports[0].value.url).toContain('hyperliquid-mainnet.g.alchemy.com')
  expect(transport.value?.transports[1].value.url).toBe('https://rpc.example')
})
