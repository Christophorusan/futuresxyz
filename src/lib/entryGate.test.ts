import { describe, expect, it } from 'vitest'
import { entryDestination, hasEntered, rememberEntry } from './entryGate'

describe('Oslo entry', () => {
  it('opens the wallet from the homepage or an unknown route', () => {
    expect(entryDestination({ pathname: '/', search: '', hash: '' })).toBe('/wallet')
    expect(entryDestination({ pathname: '/missing', search: '?next=https://example.com', hash: '' })).toBe('/wallet')
  })
  it('preserves payment requests and bookmarked markets after entering', () => {
    expect(entryDestination({ pathname: '/payments', search: '?mode=receive&amount=20', hash: '#request' })).toBe('/payments?mode=receive&amount=20#request')
    expect(entryDestination({ pathname: '/swap', search: '', hash: '' })).toBe('/swap')
    expect(entryDestination({ pathname: '/perps', search: '?market=ETH', hash: '' })).toBe('/perps?market=ETH')
  })
  it('does not crash without browser storage', () => {
    expect(hasEntered()).toBe(false)
    expect(() => rememberEntry()).not.toThrow()
  })
})
