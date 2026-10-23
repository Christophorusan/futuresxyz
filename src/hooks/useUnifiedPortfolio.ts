import { spotContextMap, spotValuationPrice } from '../lib/spotPricing'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, isAddress } from 'viem'
import { alchemyApiKey } from '../config/alchemy'
import { useHyperliquid } from '../contexts/HyperliquidContext'
export const networks = { 'eth-mainnet':'Ethereum', 'arb-mainnet':'Arbitrum', 'base-mainnet':'Base', 'opt-mainnet':'Optimism', 'matic-mainnet':'Polygon', 'hyperliquid-mainnet':'HyperEVM', 'solana-mainnet':'Solana' }
export function validAccount(value:string) {
  if (isAddress(value)) return true
  const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false
  let n=0n
  for(const c of value) n=n*58n+BigInt(alphabet.indexOf(c))
  let bytes=0; while(n>0n){bytes++;n>>=8n}
  return bytes+(value.match(/^1*/)?.[0].length??0)===32
}
export const normalizeAccount=(value:string)=>isAddress(value)?value.toLowerCase():value
export interface Holding { id:string; symbol:string; name:string; network:string; account:string; balance:string; price:number|null; value:number|null; logo?:string }
export interface Token { tokenAddress:string|null; tokenBalance:string; tokenMetadata?:{ decimals?:number; symbol?:string; name?:string; logo?:string }; tokenPrices?:{currency:string;value:string}[]; error?:unknown }
export function parseToken(token:Token, network:string, account:string):Holding|null {
  if (typeof token.tokenBalance !== 'string' || !/^(0x[0-9a-f]+|[0-9]+)$/i.test(token.tokenBalance)) throw new Error('Token balance unavailable')
  const raw=BigInt(token.tokenBalance)
  if(raw===0n) return null
  const decimals=token.tokenMetadata?.decimals
  if(!Number.isInteger(decimals)||decimals!<0||decimals!>255) throw new Error('Token metadata unavailable')
  const balance=formatUnits(raw,decimals!)
  const quoted=Array.isArray(token.tokenPrices)?token.tokenPrices.find(p=>p?.currency==='usd')?.value:undefined
  const number=quoted===undefined?NaN:Number(quoted)
  const price=Number.isFinite(number)&&number>=0?number:null
  const value=price===null?null:Number(balance)*price
  if(value!==null&&!Number.isFinite(value)) throw new Error('Invalid valuation')
  return {id:`${network}:${account}:${token.tokenAddress??'native'}`,symbol:token.tokenMetadata?.symbol??'Token',name:token.tokenMetadata?.name??token.tokenAddress??'Native asset',network,account,balance,price,value,logo:typeof token.tokenMetadata?.logo==='string'&&token.tokenMetadata.logo.startsWith('https://')?token.tokenMetadata.logo:undefined}
}
export async function recoverPortfolioToken(token: Token, network: string, account: string, readDecimals: (address: string) => Promise<number>): Promise<Holding | null> {
  try { return parseToken(token, network, account) } catch (error) {
    const decimals = token.tokenMetadata?.decimals
    // Repair missing precision only. Never guess decimals for an ERC-20.
    if (Number.isInteger(decimals) && decimals! >= 0 && decimals! <= 255) throw error
    const recovered = token.tokenAddress === null && network !== 'solana-mainnet' ? 18 :
      typeof token.tokenAddress === 'string' && isAddress(token.tokenAddress) ? await readDecimals(token.tokenAddress) : undefined
    return parseToken({ ...token, tokenMetadata: { ...token.tokenMetadata, decimals: recovered } }, network, account)
  }
}
export function useUnifiedPortfolio(accounts:string[]) {
  const {info}=useHyperliquid()
  return useQuery({queryKey:['unified-portfolio-v3',accounts],enabled:accounts.length>0,refetchInterval:60000,queryFn:async()=>{
    const assets:Holding[]=[], errors:string[]=[], tokenWarnings:string[]=[]
    await Promise.all(accounts.map(async account=>{
      const chains=isAddress(account)?Object.keys(networks).filter(n=>n!=='solana-mainnet'):['solana-mainnet']
      await Promise.all(chains.map(async network=>{
        try {
          if(!alchemyApiKey) throw new Error('Portfolio service is not configured')
          let pageKey:string|undefined
          const seen=new Set<string>()
          do {
            const response=await fetch(`https://api.g.alchemy.com/data/v1/${encodeURIComponent(alchemyApiKey)}/assets/tokens/by-address`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({addresses:[{address:account,networks:[network]}],withMetadata:true,withPrices:true,includeNativeTokens:true,includeErc20Tokens:true,...(pageKey?{pageKey}:{})}),signal:AbortSignal.timeout(20000)})
            if(!response.ok) throw new Error('Network request failed')
            const body=await response.json()
            if(!Array.isArray(body.data?.tokens)) throw new Error('Invalid response')
            for(let offset=0;offset<body.data.tokens.length;offset+=4) {
              await Promise.all(body.data.tokens.slice(offset,offset+4).map(async (token: Token)=>{
              try {
                const asset=await recoverPortfolioToken(token,network,account,async address=>{
                  const rpc=await fetch(`https://${network}.g.alchemy.com/v2/${encodeURIComponent(alchemyApiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:address,data:'0x313ce567'},'latest']}),signal:AbortSignal.timeout(8000)})
                  if(!rpc.ok)throw new Error('Metadata unavailable')
                  const result=await rpc.json()
                  if(typeof result.result!=='string'||!/^0x[0-9a-f]{64}$/i.test(result.result))throw new Error('Invalid token decimals')
                  const decimals=Number(BigInt(result.result))
                  if(!Number.isInteger(decimals)||decimals<0||decimals>255)throw new Error('Invalid token decimals')
                  return decimals
                })
                if(asset)assets.push(asset)
              } catch { tokenWarnings.push(`${networks[network as keyof typeof networks]}: ${typeof token?.tokenAddress==='string'?token.tokenAddress:'native token'} could not be valued`) }
              }))
            }
            if(body.error) errors.push(`${networks[network as keyof typeof networks]}: incomplete network response`)
            pageKey=body.data.pageKey??body.pageKey
            if(pageKey){if(seen.has(pageKey)||seen.size>=100)throw new Error('Incomplete pagination');seen.add(pageKey)}
          } while(pageKey)
        } catch { errors.push(`${networks[network as keyof typeof networks]}: balances unavailable (${account.slice(0,6)}…)`) }
      }))
      if(isAddress(account)) {
        try {
          const [mode,spot,[meta,contexts]]=await Promise.all([info.userAbstraction({user:account}),info.spotClearinghouseState({user:account}),info.spotMetaAndAssetCtxs()])
          const prices:Record<number,number>={}
          const usdc=meta.tokens.find(t=>t.name==='USDC')
          if(usdc)prices[usdc.index]=1
          const byMarket = spotContextMap(contexts)
          meta.universe.forEach(pair=>{const price=spotValuationPrice(byMarket.get(pair.name));if(pair.tokens[1]===usdc?.index&&price!==null)prices[pair.tokens[0]]=price})
          for(const b of spot.balances){if(Number(b.total)===0)continue;const price=prices[b.token]??null;assets.push({id:`hypercore:${account}:${b.token}`,account,network:'HyperCore',symbol:b.coin,name:b.coin,balance:b.total,price,value:price===null?null:Number(b.total)*price})}
          if(mode!=='unifiedAccount'&&mode!=='portfolioMargin') {
            const dexes=await info.perpDexs()
            await Promise.all(dexes.map(async dex=>{
              const state=await info.clearinghouseState({user:account,...(dex?{dex:dex.name}:{})})
              const value=Number(state.marginSummary.accountValue)
              if(!Number.isFinite(value))throw new Error('Invalid account equity')
              if(value!==0)assets.push({id:`core-equity:${account}:${dex?.name??''}`,account,network:'HyperCore',symbol:'Equity',name:`${dex?.name??'Perps'} account equity`,balance:'1',price:value,value})
            }))
          }
        } catch {errors.push(`HyperCore: account data incomplete (${account.slice(0,6)}…)`)}
      }
    }))
    return {assets:[...new Map(assets.map(a=>[a.id,a])).values()].sort((a,b)=>(b.value??0)-(a.value??0)),errors:[...new Set(errors)],tokenWarnings:[...new Set(tokenWarnings)]}
  }})
}
