import { describe, expect, it } from 'vitest'
import { availableDlnRoute, restoreDlnTransfer, assertDlnFresh, dlnAmount, dlnQuery, dlnStatus, dlnTokens, parseDlnQuote, type DlnRequest } from './debridge'
const account = '0x1111111111111111111111111111111111111111'
const token = { chainId: 42161, address: account, symbol: 'USDC', name: 'USD Coin', decimals: 6 } as const
const request: DlnRequest = { from: 42161, to: 999, input: token, output: { ...token, chainId: 999 }, amount: '10', account }
const payload = () => ({ estimation: { srcChainTokenIn: { ...token, amount: '10000000' }, dstChainTokenOut: { ...token, chainId: 100000022, amount: '9900000' } }, fixFee: '1000000000000000', orderId: `0x${'a'.repeat(64)}`, tx: { to: '0xeF4fB24aD0916217251F553c0596F8Edc630EB66', data: '0x12345678', value: '1000000000000000' } })
describe('native deBridge swaps', () => {
  it('maps HyperEVM to DLN internal ID without switching the wallet to it', () => {
    expect(dlnQuery(request).get('dstChainId')).toBe('100000022')
    expect(parseDlnQuote(payload(), request).request.to).toBe(999)
    expect(dlnQuery({ ...request, from: 999, to: 42161, input: request.output, output: token }).get('srcChainId')).toBe('100000022')
  })
  it('keeps input exact and cancellation under the connected wallet', () => {
    const q = dlnQuery(request)
    expect(q.get('prependOperatingExpenses')).toBe('false')
    expect(q.get('srcChainTokenInAmount')).toBe('10000000')
    for (const key of ['senderAddress', 'srcChainOrderAuthorityAddress', 'dstChainOrderAuthorityAddress', 'dstChainTokenOutRecipient', 'srcAllowedCancelBeneficiary']) expect(q.get(key)).toBe(account)
    expect(dlnQuery({ ...request, account: undefined }).has('senderAddress')).toBe(false)
    for (const amount of ['0', '-1', '1e3', '1.0000001', '9'.repeat(79)]) expect(() => dlnAmount({ ...request, amount })).toThrow()
  })
  it('expires at 30 seconds from request start and invalidates changed wallets', () => {
    const quote = parseDlnQuote(payload(), request, 1000)
    expect(quote.expiresAt).toBe(31000)
    expect(() => assertDlnFresh(quote, account, 30999)).not.toThrow()
    expect(() => assertDlnFresh(quote, account, 31000)).toThrow('expired')
    expect(() => assertDlnFresh(quote, undefined, 2000)).toThrow('Wallet changed')
  })
  it('rejects token, chain, precision and input mismatches', () => {
    for (const patch of [{ amount: '10000001' }, { chainId: 1 }, { decimals: 18 }, { address: `0x${'2'.repeat(40)}` }]) {
      const data = payload(); Object.assign(data.estimation.srcChainTokenIn, patch)
      expect(() => parseDlnQuote(data, request)).toThrow('does not match')
    }
    const data = payload(); data.estimation.dstChainTokenOut.chainId = 999
    expect(() => parseDlnQuote(data, request)).toThrow()
  })
  it('rejects arbitrary spenders, invalid outputs and extra native charges', () => {
    const spender = payload(); spender.tx.to = account
    const extra = payload(); extra.tx.value = '1000000000000001'
    const zero = payload(); zero.estimation.dstChainTokenOut.amount = '0'
    const malformed = payload(); malformed.tx.data = '0x'
    for (const data of [spender, extra, zero, malformed]) expect(() => parseDlnQuote(data, request)).toThrow()
  })
  it('accounts for native input plus the protocol fixed fee', () => {
    const native = { ...request, input: { ...token, address: '0x0000000000000000000000000000000000000000' as const } }
    const data = payload(); data.estimation.srcChainTokenIn.address = native.input.address as typeof account; data.tx.value = '1000000010000000'
    expect(parseDlnQuote(data, native).tx?.value).toBe(1000000010000000n)
  })
  it('supports wallet-free estimates but never treats them as signable', () => {
    const quote = parseDlnQuote(payload(), { ...request, account: undefined })
    expect(quote.tx).toBeNull(); expect(quote.orderId).toBeNull()
    expect(() => assertDlnFresh(quote, account)).toThrow()
  })
  it('uses valid token metadata and HTTPS logos', () => {
    expect(dlnTokens({ tokens: { a: { ...token, logoURI: 'https://tokens.debridge.finance/logo.png' }, b: { ...token, decimals: -1 }, c: { ...token, address: 'bad' } } }, 42161)).toEqual([{ ...token, logo: 'https://tokens.debridge.finance/logo.png' }])
  })
  it('distinguishes source creation, delivery and refunds', () => {
    expect(dlnStatus('Created')).toContain('Waiting')
    expect(dlnStatus('Fulfilled')).toContain('Delivered')
    expect(dlnStatus('ClaimedUnlock')).toContain('Delivered')
    expect(dlnStatus('OrderCancelled')).toContain('not confirmed')
    expect(dlnStatus('ClaimedOrderCancel')).toContain('returned')
    expect(dlnStatus('Unknown')).toContain('not confirmed')
  })
})

describe('swap recovery regressions', () => {
  it('keeps source and destination distinct after a token-list failure', () => {
    expect(availableDlnRoute([8453, 999], 42161, 8453)).toEqual({ from: 8453, to: 999 })
    expect(availableDlnRoute([42161, 999], 42161, 8453)).toEqual({ from: 42161, to: 999 })
    expect(availableDlnRoute([42161, 8453, 999], 42161, 999)).toEqual({ from: 42161, to: 999 })
    expect(() => availableDlnRoute([42161], 42161, 8453)).toThrow()
  })
  it('preserves a reverted source transaction across reloads', () => {
    const saved = { hash: `0x${'b'.repeat(64)}`, chain: 42161, orderId: `0x${'a'.repeat(64)}`, sourceStatus: 'reverted', status: 'old status' }
    const restored = restoreDlnTransfer(JSON.stringify(saved))
    expect(restored?.sourceStatus).toBe('reverted')
    expect(restored?.status).toContain('reverted')
    expect(restored?.status).not.toContain('pending')
    expect(restoreDlnTransfer(JSON.stringify({ ...saved, sourceStatus: undefined }))?.sourceStatus).toBe('pending')
    expect(restoreDlnTransfer('{broken')).toBeNull()
    expect(restoreDlnTransfer(JSON.stringify({ ...saved, chain: 123 }))).toBeNull()
  })
  it('rejects odd-length calldata rather than passing partial bytes to the wallet', () => {
    const data = payload(); data.tx.data = '0x123456789'
    expect(() => parseDlnQuote(data, request)).toThrow('Invalid route transaction')
  })
  it('does not display an infinite delivery estimate', () => {
    expect(parseDlnQuote({ ...payload(), order: { approximateFulfillmentDelay: Infinity } }, request).seconds).toBeNull()
  })
})
