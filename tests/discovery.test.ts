import { describe, expect, it } from 'vitest'
import { financeApps, searchFinanceApps } from '../src/lib/discovery'
import { entryDestination } from '../src/lib/entryGate'

describe('finance discovery', () => {
  it('finds lending by intent, asset, and network', () => {
    expect(searchFinanceApps('I want to lend USDC on Solana').map(a => a.id)).toEqual(['kamino'])
    expect(searchFinanceApps('lend USDC', 'lending', 'Arbitrum').map(a => a.id)).toEqual(['aave'])
  })
  it('keeps Hyperliquid first for perps and applies network filters', () => {
    expect(searchFinanceApps('trade perps')[0].id).toBe('hyperliquid')
    expect(searchFinanceApps('', 'perps', 'Solana').map(a => a.id)).toEqual(['gmx', 'jupiter-perps'])
  })
  it('shows no invented results and allows empty search', () => {
    expect(searchFinanceApps('nonexistent provider')).toEqual([])
    expect(searchFinanceApps('')).toHaveLength(financeApps.length)
  })
  it('preserves discover deep links through the entry screen', () => {
    expect(entryDestination({pathname:'/discover',search:'?category=lending',hash:''})).toBe('/discover?category=lending')
  })
  it('opens provider lending guides through the entry screen', () => {
    for (const id of ['aave', 'morpho', 'kamino']) {
      const app = financeApps.find(app => app.id === id)!
      expect(app.detailPath).toBe(`/lending/${id}`)
      expect(entryDestination({ pathname: app.detailPath!, search: '', hash: '' })).toBe(app.detailPath)
      expect(app.integrated).toBe(false)
    }
    expect(entryDestination({ pathname: '/lending/unknown', search: '', hash: '' })).toBe('/wallet')
  })
  it('separates Oslo routes from HTTPS provider destinations', () => {
    for (const app of financeApps) {
      expect(app.destination.startsWith(app.integrated ? '/' : 'https://')).toBe(true)
      expect(app.requirements.length).toBeGreaterThan(0)
    }
  })
})
