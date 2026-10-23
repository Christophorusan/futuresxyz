import { describe, expect, it } from 'vitest'
import { spotContextMap, spotValuationPrice } from '../src/lib/spotPricing'
describe('spot portfolio price matching', () => {
  it('matches USDHL by market ID even when the arrays have different positions', () => {
    const contexts = [{ coin:'@173',markPx:'40000',midPx:'31500' }, { coin:'@180',markPx:'0.998',midPx:'1.499' }]
    const prices = spotContextMap(contexts)
    expect(spotValuationPrice(prices.get('@180'))).toBe(0.998)
    expect(100 * spotValuationPrice(prices.get('@180'))!).toBeCloseTo(99.8)
  })
  it('does not borrow another market price if a context is missing', () => {
    expect(spotValuationPrice(spotContextMap([{coin:'@173',markPx:'40000'}]).get('@180'))).toBeNull()
  })
  it('does not substitute an illiquid midpoint or invalid mark for valuation', () => {
    for(const markPx of ['NaN','Infinity','0','-1']) expect(spotValuationPrice({markPx,midPx:'1'})).toBeNull()
    expect(spotValuationPrice({midPx:'1'})).toBeNull()
  })
})
