import { describe, expect, it } from 'vitest'
import { portfolioValue } from '../src/lib/portfolioValue'
describe('portfolio value during partial network failures', () => {
  it('keeps priced holdings visible when a network or token fails', () => {
    expect(portfolioValue(true, [{value:120}, {value:35.5}, {value:null}], true)).toBe(155.5)
  })
  it('does not turn unavailable balances into a zero-dollar wallet', () => {
    expect(portfolioValue(true, [], true)).toBeNull()
    expect(portfolioValue(true, [{value:null}], false)).toBeNull()
    expect(portfolioValue(true, undefined, false)).toBeNull()
    expect(portfolioValue(false, [{value:10}], false)).toBeNull()
  })
  it('shows zero only for a successfully loaded empty wallet', () => {
    expect(portfolioValue(true, [], false)).toBe(0)
  })
  it('ignores invalid values and preserves negative trading equity', () => {
    expect(portfolioValue(true, [{value:100}, {value:-5}, {value:NaN}], true)).toBe(95)
  })
})
