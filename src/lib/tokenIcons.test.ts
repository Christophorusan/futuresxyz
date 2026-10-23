import { describe, expect, it } from 'vitest'
import { tokenIconUrls } from './tokenIcons'

describe('Hyperliquid token logos', () => {
  it('prefers verified official assets to provider logos', () => {
    expect(tokenIconUrls('HYPE', '/futuresxyz/', 'provider.svg')[0]).toBe('/futuresxyz/tokens/hyperliquid/HYPE.svg')
  })
  it('resolves wallet symbols and lending assets to cached logos', () => {
    expect(tokenIconUrls('eth', '/')[0]).toBe('/tokens/hyperliquid/ETH.svg')
    expect(tokenIconUrls('USD₮0', '/')[0]).toBe('/tokens/hyperlend/USDT0.svg')
    expect(tokenIconUrls('kHYPE', '/')[0]).toBe('/tokens/hyperlend/kHYPE.svg')
    expect(tokenIconUrls('stHYPE', '/')[0]).toBe('/tokens/hyperlend/wstHYPE.svg')
    expect(tokenIconUrls('USDe', '/')[0]).toBe('/tokens/hyperlend/USDe.svg')
    expect(tokenIconUrls('ARB', '/')[0]).toBe('/tokens/networks/ARB.png')
  })
  it('preserves HIP-3 namespaces and case', () => {
    expect(tokenIconUrls('xyz:TSLA', '/')[0]).toBe('https://app.hyperliquid.xyz/coins/xyz%3ATSLA.svg')
  })
  it('tries the underlying token for multiplier markets without stripping KAS', () => {
    expect(tokenIconUrls('kPEPE', '/')).toContain('https://app.hyperliquid.xyz/coins/PEPE.svg')
    expect(tokenIconUrls('KAS', '/')).not.toContain('https://app.hyperliquid.xyz/coins/AS.svg')
  })
  it('maps wrapped native tokens and keeps provider fallbacks', () => {
    expect(tokenIconUrls('UBTC', '/')[0]).toBe('/tokens/hyperliquid/BTC.svg')
    expect(tokenIconUrls('unknown', '/', 'provider.svg').at(-1)).toBe('provider.svg')
  })
})
