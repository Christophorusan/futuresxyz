import { describe, test, expect } from 'vitest'
import { decodeFunctionData, erc20Abi } from 'viem'
import { parseAmount, buildLendingCalls, validateAction } from '../src/lib/lending/transactions'
import { poolAbi, protocols } from '../src/lib/lending/contracts'
import type { LendingMarket, LendingPosition } from '../src/lib/lending/markets'
const account = '0x1111111111111111111111111111111111111111'
const market: LendingMarket = { protocol: 'hyperlend', asset: '0x2222222222222222222222222222222222222222', symbol: 'USDC', decimals: 6, supply: 1000000000n, debt: 100000000n, supplyRate: 0n, borrowRate: 0n, active: true, frozen: false, paused: false, borrowing: true, collateral: true, ltv: 8000n, liquidationThreshold: 8500n, supplyCap: 0n, borrowCap: 0n, aToken: '0x3333333333333333333333333333333333333333' }
const position: LendingPosition = { supplied: 100000000n, debt: 10000000n, stableDebt: 0n, collateralEnabled: true, collateralBase: 10000000000n, debtBase: 1000000000n, availableBorrowsBase: 7000000000n, liquidationThreshold: 8500n, healthFactor: 8500000000000000000n, balance: 100000000n, allowance: 0n, liquidity: 900000000n, price: 100000000n, priceUnit: 100000000n, blockNumber: 1n }
describe('amount precision', () => {
  for (const value of ['0', '-1', '1e6', 'NaN', '1.0000001', '', 'Infinity']) test(`rejects ${value}`, () => expect(() => parseAmount(value, 6)).toThrow())
  test('preserves large decimal amounts exactly', () => expect(parseAmount('9007199254.740993', 6)).toBe(9007199254740993n))
})
test('approval is exact, zero-reset when needed, and supply receiver is selected account', () => {
  const calls = buildLendingCalls(market, { ...position, allowance: 1n }, account, 'supply', 2000000n)
  expect(calls).toHaveLength(3)
  const reset = decodeFunctionData({ abi: erc20Abi, data: calls[0].data })
  expect(String(reset.args?.[0]).toLowerCase()).toBe(protocols.hyperlend.pool)
  expect(reset.args?.[1]).toBe(0n)
  const approval = decodeFunctionData({ abi: erc20Abi, data: calls[1].data })
  expect(approval.functionName).toBe('approve')
  expect(approval.args?.[1]).toBe(2000000n)
  const supply = decodeFunctionData({ abi: poolAbi, data: calls[2].data })
  expect(supply.functionName).toBe('supply')
  expect(supply.args?.[2]).toBe(account)
})
test('borrow uses variable rate and no token approval', () => {
  const calls = buildLendingCalls(market, position, account, 'borrow', 1000000n)
  expect(calls).toHaveLength(1)
  const decoded = decodeFunctionData({ abi: poolAbi, data: calls[0].data })
  expect(decoded.functionName).toBe('borrow')
  expect(decoded.args?.slice(1)).toEqual([1000000n, 2n, 0, account])
})
test('repay uses selected account and variable rate', () => {
  const calls = buildLendingCalls(market, { ...position, allowance: 100000000n }, account, 'repay', 1000000n)
  const decoded = decodeFunctionData({ abi: poolAbi, data: calls[0].data })
  expect(decoded.functionName).toBe('repay')
  expect(decoded.args?.slice(1)).toEqual([1000000n, 2n, account])
})
test('blocks paused reserve and capped borrowing', () => {
  expect(() => validateAction({ ...market, paused: true }, position, 'repay', 1n)).toThrow('paused')
  expect(() => validateAction({ ...market, borrowCap: 100n }, position, 'borrow', 1n)).toThrow('cap')
})
test('frozen market permits repay and withdraw but blocks additional risk', () => {
  const frozen = { ...market, frozen: true }
  expect(() => validateAction(frozen, position, 'repay', 1n)).not.toThrow()
  expect(() => validateAction(frozen, position, 'withdraw', 1n)).not.toThrow()
  expect(() => validateAction(frozen, position, 'supply', 1n)).toThrow('frozen')
  expect(() => validateAction(frozen, position, 'borrow', 1n)).toThrow('frozen')
})
test('checks balance, liquidity, oracle, collateral and supplied balance', () => {
  expect(() => validateAction(market, { ...position, balance: 0n }, 'supply', 1n)).toThrow('balance')
  expect(() => validateAction(market, { ...position, liquidity: 0n }, 'withdraw', 1n)).toThrow('liquidity')
  expect(() => validateAction(market, { ...position, price: 0n }, 'borrow', 1n)).toThrow('oracle')
  expect(() => validateAction(market, { ...position, availableBorrowsBase: 0n }, 'borrow', 1n)).toThrow('collateral')
  expect(() => validateAction(market, { ...position, supplied: 0n }, 'withdraw', 1n)).toThrow('supplied')
})
