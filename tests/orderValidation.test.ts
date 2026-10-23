import { describe, it, expect } from 'vitest'
import { orderPrice, orderSize, orderOutcome } from '../src/lib/orderValidation'
describe('Hyperliquid order validation', () => {
  it('uses asset-specific decimal and significant-figure limits', () => {
    expect(orderPrice(0.00123456, 5, true)).toBe('0.001')
    expect(orderPrice(1234.567, 2)).toBe('1234.6')
    expect(orderPrice(123456, 2)).toBe('123456')
    expect(orderPrice(0.00000001, 0, true)).toBe('0.00000001')
    expect(orderSize(1.2399, 2)).toBe('1.23')
    expect(orderSize(120, 0)).toBe('120')
    expect(orderSize(1.2, 4)).toBe('1.2')
    expect(orderSize(0.00000001, 8)).toBe('0.00000001')
  })
  it('rejects invalid and below-increment orders', () => {
    for (const n of [NaN, Infinity, -1, 0]) {
      expect(() => orderPrice(n, 2)).toThrow()
      expect(() => orderSize(n, 2)).toThrow()
    }
    expect(() => orderSize(0.001, 2)).toThrow()
  })
  it('distinguishes resting, filled, rejected and unknown responses', () => {
    const response = (statuses: unknown[]) => ({status:'ok',response:{data:{statuses}}})
    expect(orderOutcome(response([{resting:{oid:123}}]))).toBe('Limit order placed (#123)')
    expect(orderOutcome(response([{filled:{totalSz:'2'}}]))).toBe('Filled 2')
    expect(() => orderOutcome(response([{error:'Insufficient margin'}]))).toThrow('Insufficient margin')
    expect(() => orderOutcome(response([{filled:{totalSz:'2'}},{error:'Invalid stop'}]))).toThrow('Check orders')
    expect(() => orderOutcome({})).toThrow('did not confirm')
  })
})
