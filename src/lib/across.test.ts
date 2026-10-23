import { describe, expect, it } from 'vitest'
import { assertFresh, inputAmount, parseAcrossQuote, parseTokens, type SwapRequest } from './across'
import { entryDestination } from './entryGate'

const address = '0x1111111111111111111111111111111111111111'
const token = { chainId: 42161, address, symbol: 'USDC', name: 'USD Coin', decimals: 6 } as const
const request: SwapRequest = { originChainId: 42161, destinationChainId: 8453, inputToken: token, outputToken: { ...token, chainId: 8453 }, amount: '10', depositor: address, recipient: address }
const response = () => ({ inputToken: token, outputToken: { ...token, chainId: 8453 }, amountType: 'exactInput', inputAmount: '10000000', maxInputAmount: '10000000', expectedOutputAmount: '9900000', minOutputAmount: '9800000', quoteExpiryTimestamp: 200,
  swapTx: { to: address, chainId: 42161, data: '0x12345678', value: '0', simulationSuccess: true }, checks: { allowance: { token: address, spender: address, expected: '10000000', actual: '0' } } })
describe('Across transfer review', () => {
  it('keeps exact decimal amounts and rejects rounded or invalid inputs', () => {
    expect(inputAmount(request)).toBe('10000000')
    for (const amount of ['0', '-1', '1e6', '1.0000001', 'NaN']) expect(() => inputAmount({ ...request, amount })).toThrow()
    expect(() => inputAmount({ ...request, recipient: 'bad' as typeof address })).toThrow()
    expect(() => inputAmount({ ...request, destinationChainId: 42161 })).toThrow()
  })
  it('limits the approval to the reviewed input and bounds quote life', () => {
    const quote = parseAcrossQuote(response(), request, 100000)
    expect(quote.approval?.amount).toBe(10000000n)
    expect(quote.expiresAt).toBe(160000)
    expect(quote.feesUsd).toBeNull()
    expect(() => assertFresh(quote, address, 159999)).not.toThrow()
    expect(() => assertFresh(quote, address, 160000)).toThrow('expired')
    expect(() => assertFresh(quote, undefined, 110000)).toThrow('Wallet changed')
  })
  it('rejects route mismatches, failed simulation, and unexpected native value', () => {
    const wrongChain = response(); wrongChain.swapTx.chainId = 1
    const wrongToken = response(); wrongToken.outputToken = { ...wrongToken.outputToken, chainId: 1 }
    const badValue = response(); badValue.swapTx.value = '1'
    const failedSimulation = response(); failedSimulation.swapTx.simulationSuccess = false; failedSimulation.checks.allowance.actual = '10000000'
    const oversized = response(); oversized.maxInputAmount = '999999999999'
    const expired = response(); expired.quoteExpiryTimestamp = 99
    for (const payload of [wrongChain, wrongToken, badValue, failedSimulation, oversized, expired]) expect(() => parseAcrossQuote(payload, request, 100000)).toThrow()
  })
  it('allows an approval-only review before simulation can succeed', () => {
    const pending = response(); pending.swapTx.simulationSuccess = false
    const quote = parseAcrossQuote(pending, request, 100000)
    expect(quote.simulationSuccess).toBe(false)
    expect(quote.approval?.amount).toBe(10000000n)
  })
  it('rejects excess allowance requests and unsafe output amounts', () => {
    const allowance = response(); allowance.checks.allowance.expected = '999999999999'
    const output = response(); output.minOutputAmount = '0'
    expect(() => parseAcrossQuote(allowance, request, 100000)).toThrow()
    expect(() => parseAcrossQuote(output, request, 100000)).toThrow()
  })
  it('does not expose unsupported chain tokens or malformed metadata', () => {
    expect(parseTokens([token, { ...token, chainId: 7565164 }, { ...token, decimals: -1 }, { ...token, address: 'bad' }])).toEqual([token])
  })
  it('keeps bridge deep links after entering the app', () => {
    expect(entryDestination({ pathname: '/bridge', search: '', hash: '' })).toBe('/bridge')
  })
})

it('rejects partial calldata bytes from Across', () => {
  const data = response(); data.swapTx.data = '0x123456789'
  expect(() => parseAcrossQuote(data, request, 100000)).toThrow()
})
