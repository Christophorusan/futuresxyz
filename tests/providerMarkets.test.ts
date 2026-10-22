import { afterEach, describe, expect, it, vi } from 'vitest'
import { annualRate, readProviderMarkets } from '../src/lib/lending/providerMarkets'
afterEach(() => vi.unstubAllGlobals())
describe('provider market reads', () => {
  it('converts fractional APY without treating absent rates as zero', () => {
    expect(annualRate('0.05')).toBe(5)
    expect(annualRate(0)).toBe(0)
    for (const value of [null, undefined, '', false, -1, 'invalid', Infinity]) expect(annualRate(value)).toBeNull()
  })
  it('rejects partial GraphQL results instead of presenting incomplete markets as current', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { markets: [] }, errors: [{ message: 'upstream' }] }) }))
    await expect(readProviderMarkets('aave')).rejects.toThrow('incomplete')
  })
  it('preserves paused reserves and unavailable borrowing rates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { markets: [{ name: 'Aave', address: 'pool', chain: { name: 'Ethereum' }, reserves: [{ underlyingToken: {address:'token',symbol:'USDC'}, supplyInfo:{apy:{value:'0.04'}}, borrowInfo:null,isPaused:true,isFrozen:false }] }] } }) }))
    expect(await readProviderMarkets('aave')).toEqual([{ id:'Ethereum:pool:token',asset:'USDC',network:'Ethereum',market:'Aave',supplyApy:4,borrowApy:null,status:'Paused' }])
  })
  it('does not invent rates for Morpho markets without state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { markets: { items: [{marketId:'market',loanAsset:{symbol:'USDC'},collateralAsset:{symbol:'ETH'},morphoBlue:{chain:{id:8453}},state:null}] } } }) }))
    expect((await readProviderMarkets('morpho'))[0]).toMatchObject({ network:'Base',collateral:'ETH',supplyApy:null,borrowApy:null,status:'Data unavailable' })
  })
})
