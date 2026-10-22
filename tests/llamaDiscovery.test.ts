import { describe, expect, it } from 'vitest'
import { buildListings, filterListings, officialUrl, qualifies, type LlamaProtocol } from '../src/lib/llamaDiscovery'
const protocol = (overrides: Partial<LlamaProtocol> = {}): LlamaProtocol => ({ id: '1', name: 'Example', slug: 'example', category: 'Lending', chains: ['Arbitrum'], tvl: 20_000_000, ...overrides })
describe('DeFiLlama listing eligibility', () => {
  it('uses inclusive TVL OR daily protocol revenue thresholds', () => {
    expect(qualifies(20_000_000, null)).toBe(true)
    expect(qualifies(0, 2_000)).toBe(true)
    expect(qualifies(19_999_999, 1_999)).toBe(false)
    expect(qualifies(null, null)).toBe(false)
    expect(qualifies(NaN, Infinity)).toBe(false)
  })
  it('joins exact IDs and never assigns parent revenue to a child', () => {
    const p = protocol({ tvl: 1, parentProtocol:'parent#example' })
    expect(buildListings([p], [{ defillamaId:'parent#example',total24h:100_000 }])).toEqual([])
    expect(buildListings([p], [{ defillamaId:'1',total24h:2000 }])[0]).toMatchObject({revenue:2000,tvl:1})
  })
  it('excludes flagged protocols even if revenue would qualify them', () => {
    for (const flags of [{rugged:true},{deadFrom:123},{deadUrl:true}]) {
      expect(buildListings([protocol(flags)], [{defillamaId:'1',total24h:999999}])).toEqual([])
    }
  })
  it('includes revenue-only protocols without inventing TVL', () => {
    expect(buildListings([], [{defillamaId:'2',name:'Revenue App',slug:'revenue-app',protocolType:'protocol',total24h:2500}])[0]).toMatchObject({id:'2',tvl:null,revenue:2500})
  })
  it('keeps missing revenue distinct from reported zero', () => {
    expect(buildListings([protocol()], [])[0].revenue).toBeNull()
    expect(buildListings([protocol()], [{defillamaId:'1',total24h:0}])[0].revenue).toBe(0)
  })
  it('filters activities and networks while preserving internal lending views', () => {
    const apps = buildListings([protocol({slug:'aave-v3',name:'Aave V3'})], [])
    expect(filterListings(apps,'lend on arb','lending','Arbitrum')[0].detailPath).toBe('/lending/aave')
    expect(filterListings(apps,'','all','Solana')).toEqual([])
    expect(buildListings([protocol({category:'CEX'})], [])).toEqual([])
  })
  it('rejects script, insecure, and credential-bearing destination URLs', () => {
    expect(officialUrl('https://app.aave.com')).toBe('https://app.aave.com/')
    for (const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com','broken']) expect(officialUrl(url)).toBeUndefined()
  })
})
