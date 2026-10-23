import { describe, expect, it, vi } from 'vitest'
vi.mock('./across', () => ({ acrossProxy: 'https://across.example', getAcrossQuote: vi.fn() }))
vi.mock('./debridge', () => ({ debridgeProxy: 'https://debridge.example', getDlnQuote: vi.fn() }))
import { rankSwapRoutes, getSwapRoutes, type SwapRoute } from './swapRouting'
import { getAcrossQuote } from './across'
import { getDlnQuote, type DlnRequest } from './debridge'
const request: DlnRequest = { account: '0x1111111111111111111111111111111111111111', from: 1, to: 8453, amount: '1', input: { chainId: 1, address: '0x2222222222222222222222222222222222222222', symbol: 'USDC', name: 'USDC', decimals: 6 }, output: { chainId: 8453, address: '0x3333333333333333333333333333333333333333', symbol: 'USDC', name: 'USDC', decimals: 6 } }
const route = (provider: 'across' | 'debridge', output: string, executable = true, expiresAt = 2000) => ({ provider, quote: { output, expiresAt, tx: executable ? {} : null } }) as SwapRoute

describe('automatic swap routing', () => {
  it('ranks identical output assets using exact integer amounts and excludes expired quotes', () => {
    expect(rankSwapRoutes([route('across', '9007199254740992'), route('debridge', '9007199254740993'), route('across', '99999999999999999', true, 999)],1000).map(r=>r.provider)).toEqual(['debridge','across'])
  })
  it('prefers an executable route over a read-only preview', () => {
    expect(rankSwapRoutes([route('debridge','200',false),route('across','100')],1000)[0].provider).toBe('across')
  })
  it('keeps an available route when the other provider fails', async () => {
    vi.mocked(getDlnQuote).mockRejectedValueOnce(new Error('Unavailable'))
    const quote = { output:'100',expiresAt:Date.now()+30000 } as Awaited<ReturnType<typeof getAcrossQuote>>
    vi.mocked(getAcrossQuote).mockResolvedValueOnce(quote)
    expect(await getSwapRoutes(request)).toEqual([{provider:'across',quote}])
  })
  it('does not fabricate a route if both providers fail', async () => {
    vi.mocked(getDlnQuote).mockRejectedValueOnce(new Error('Unavailable'))
    vi.mocked(getAcrossQuote).mockRejectedValueOnce(new Error('Unavailable'))
    await expect(getSwapRoutes(request)).rejects.toThrow('No route available')
  })
})
