import { describe, expect, it } from 'vitest'
import { normalizeAccount, parseToken, validAccount } from './useUnifiedPortfolio'
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
