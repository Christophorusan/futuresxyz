import { describe, expect, it } from 'vitest'
import { normalizeAccount, parseToken, validAccount, recoverPortfolioToken } from './useUnifiedPortfolio'
describe('cross-chain portfolio',()=>{
  it('validates Solana public keys without changing case',()=>{
    const sol='So11111111111111111111111111111111111111112'
    expect(validAccount(sol)).toBe(true)
    expect(normalizeAccount(sol)).toBe(sol)
    expect(validAccount('not-a-wallet')).toBe(false)
    expect(validAccount('1'.repeat(33))).toBe(false)
  })
  it('values raw balances using token decimals, never cost basis',()=>{
    const asset=parseToken({tokenAddress:null,tokenBalance:'0xf4240',tokenMetadata:{decimals:6,symbol:'USDC'},tokenPrices:[{currency:'usd',value:'0.99'}]},'base-mainnet','account')
    expect(asset?.balance).toBe('1')
    expect(asset?.value).toBe(.99)
  })
  it('keeps unpriced tokens and separates identical symbols on chains',()=>{
    const token={tokenAddress:'0x123',tokenBalance:'1',tokenMetadata:{decimals:0,symbol:'USDC'}}
    const a=parseToken(token,'eth-mainnet','a'),b=parseToken(token,'base-mainnet','a')
    expect(a?.value).toBeNull()
    expect(a?.id).not.toBe(b?.id)
    expect(()=>parseToken({...token,tokenMetadata:undefined},'base-mainnet','a')).toThrow()
  })
})

 describe('portfolio metadata recovery',()=>{
  const token={tokenAddress:'0x1111111111111111111111111111111111111111',tokenBalance:'1000000',tokenMetadata:{symbol:'USDC'},tokenPrices:[{currency:'usd',value:'1'}]}
  it('recovers contract decimals without guessing the balance',async()=>{
    expect((await recoverPortfolioToken(token,'base-mainnet','account',async()=>6))?.value).toBe(1)
  })
  it('handles nullable or malformed optional price and logo data',()=>{
    expect(parseToken({...token,tokenMetadata:{decimals:6,symbol:'USDC',logo:123},tokenPrices:{} } as unknown as Parameters<typeof parseToken>[0],'base-mainnet','account')?.value).toBeNull()
  })
  it('does not request metadata for zero holdings',async()=>{
    expect(await recoverPortfolioToken({...token,tokenBalance:'0'},'base-mainnet','account',async()=>{throw new Error('Should not call')})).toBeNull()
  })
  it('recovers native decimals but never assumes ERC20 precision',async()=>{
    expect((await recoverPortfolioToken({...token,tokenAddress:null,tokenBalance:'1000000000000000000'},'eth-mainnet','account',async()=>{throw new Error('Should not call')}))?.balance).toBe('1')
    await expect(recoverPortfolioToken(token,'base-mainnet','account',async()=>{throw new Error('Unavailable')})).rejects.toThrow()
    await expect(recoverPortfolioToken(token,'base-mainnet','account',async()=>256)).rejects.toThrow()
  })
  it('rejects missing balances instead of treating null as zero',()=>{
    expect(()=>parseToken({...token,tokenBalance:null} as unknown as Parameters<typeof parseToken>[0],'base-mainnet','account')).toThrow('Token balance unavailable')
  })
})
