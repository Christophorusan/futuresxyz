import { describe, expect, it, vi } from 'vitest'
import { decodeFunctionData, erc20Abi, type PublicClient } from 'viem'
import { parsePaymentRequest, paymentAssets, paymentRequest, preparePayment, recipientAddress } from '../src/lib/payments'
const owner = '0x1111111111111111111111111111111111111111'
const to = '0x2222222222222222222222222222222222222222'
function rpc(balance = 10000000n, native = 10n ** 18n) {
  return { getChainId: vi.fn().mockResolvedValue(999), getBalance: vi.fn().mockResolvedValue(native),
    readContract: vi.fn().mockImplementation(({ functionName }) => Promise.resolve(functionName === 'decimals' ? 6 : balance)),
    simulateContract: vi.fn().mockResolvedValue({ result: true }), estimateGas: vi.fn().mockResolvedValue(21000n), getGasPrice: vi.fn().mockResolvedValue(1000000000n) }
}
describe('payment requests', () => {
  it('roundtrips network, token, recipient and exact decimal amount', () => {
    const link = paymentRequest('https://example.com/payments#old', to, paymentAssets[0], '1.000001', 6)
    expect(parsePaymentRequest(new URL(link).hash)).toEqual({ to, asset: paymentAssets[0], amount: '1.000001' })
  })
  it('rejects foreign chains, arbitrary tokens, zero addresses and invalid amounts', () => {
    expect(() => parsePaymentRequest(`#chain=1&to=${to}&asset=USDC`)).toThrow('HyperEVM')
    expect(() => parsePaymentRequest(`#chain=999&to=${to}&asset=FAKE`)).toThrow('Unsupported')
    expect(() => recipientAddress('0x0000000000000000000000000000000000000000')).toThrow()
    expect(() => paymentRequest('https://example.com', to, paymentAssets[0], '0.0000001', 6)).toThrow()
    expect(() => parsePaymentRequest(`#chain=999&to=${to}&asset=USDC&amount=1e9`)).toThrow()
  })
})
describe('payment preflight', () => {
  it('encodes an exact ERC20 transfer without granting allowance', async () => {
    const result = await preparePayment(rpc() as unknown as PublicClient, owner, to, paymentAssets[0], '1.000001')
    expect(decodeFunctionData({ abi: erc20Abi, data: result.call.data })).toEqual({ functionName: 'transfer', args: [to, 1000001n] })
    expect(result.fee).toBe(21000000000000n)
  })
  it('blocks excess balance, self-send and transfers to the token contract', async () => {
    const client = rpc() as unknown as PublicClient
    await expect(preparePayment(client, owner, to, paymentAssets[0], '11')).rejects.toThrow('Insufficient')
    await expect(preparePayment(client, owner, owner, paymentAssets[0], '1')).rejects.toThrow('other than')
    await expect(preparePayment(client, owner, paymentAssets[0].address, paymentAssets[0], '1')).rejects.toThrow('token contract')
  })
  it('reserves HYPE for gas and rejects false-returning token transfers', async () => {
    await expect(preparePayment(rpc(1n, 10n ** 18n) as unknown as PublicClient, owner, to, paymentAssets[3], '1')).rejects.toThrow('network fee')
    const client = rpc(); client.simulateContract.mockResolvedValue({ result: false })
    await expect(preparePayment(client as unknown as PublicClient, owner, to, paymentAssets[0], '1')).rejects.toThrow('rejected')
  })
  it('refuses an RPC pointing to another chain', async () => {
    const client = rpc(); client.getChainId.mockResolvedValue(1)
    await expect(preparePayment(client as unknown as PublicClient, owner, to, paymentAssets[0], '1')).rejects.toThrow('network')
  })
  it('does not require EOA gas estimation for sponsored smart-account preparation', async () => {
    const client = rpc(10000000n, 0n)
    const result = await preparePayment(client as unknown as PublicClient, owner, to, paymentAssets[0], '1', true)
    expect(result.fee).toBeUndefined(); expect(client.estimateGas).not.toHaveBeenCalled()
  })
})
