import { describe, expect, it } from 'vitest'
import { visibleHoldings } from '../src/lib/visibleHoldings'

describe('visible wallet holdings', () => {
  it('counts only priced holdings worth at least one cent', () => {
    const assets = [
      { id: 'funded', value: 125 }, { id: 'cent', value: 0.01 },
      { id: 'zero', value: 0 }, { id: 'unpriced', value: null },
      { id: 'dust', value: 0.009 }, { id: 'invalid', value: NaN },
      { id: 'infinite', value: Infinity }, { id: 'debt', value: -20 },
    ]
    expect(visibleHoldings(assets).map(a => a.id)).toEqual(['funded', 'cent'])
    // Filtering the display must not discard equity or unknown prices from accounting.
    expect(assets).toHaveLength(8)
    expect(assets.find(a => a.id === 'debt')?.value).toBe(-20)
  })
  it('handles empty portfolios', () => {
    expect(visibleHoldings([])).toEqual([])
  })
})
