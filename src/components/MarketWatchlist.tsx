import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useFavorites } from '../hooks/useFavorites'
import { useMarketMeta } from '../hooks/useMarketMeta'
import { useMarket } from '../contexts/MarketContext'
import { useHyperliquid } from '../contexts/HyperliquidContext'
import { TokenIcon } from './TokenIcon'
import './MarketWatchlist.css'
const defaults = ['BTC','ETH','HYPE','SOL','xyz:SP500']
export function MarketWatchlist() {
  const { markets, loading, error } = useMarketMeta()
  const { info } = useHyperliquid()
  const { favorites, toggleFav } = useFavorites()
  const { setSelectedMarket } = useMarket()
  const [search,setSearch] = useState('')
  const caps = useQuery({queryKey:['oslo-market-cap-leaders'],enabled:!favorites.size,queryFn:async()=>{
    const response=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false',{signal:AbortSignal.timeout(10000)})
    if(!response.ok)throw new Error('Market-cap rankings unavailable')
    const data:unknown=await response.json()
    if(!Array.isArray(data))throw new Error('Invalid rankings')
    return data.filter((c):c is {symbol:string;market_cap_rank:number}=>c && typeof c.symbol==='string' && Number.isFinite(c.market_cap_rank)).sort((a,b)=>a.market_cap_rank-b.market_cap_rank).map(c=>c.symbol.toUpperCase())
  },staleTime:600000,refetchInterval:600000,retry:1})
  const index = useQuery({queryKey:['oslo-index-market'],queryFn:async()=>{
    const [meta,contexts]=await info.metaAndAssetCtxs({dex:'xyz'})
    const i=meta.universe.findIndex(m=>m.name==='xyz:SP500')
    if(i<0)throw new Error('Index market unavailable')
    const ctx=contexts[i], price=Number(ctx.midPx??ctx.markPx), previous=Number(ctx.prevDayPx)
    return {name:'xyz:SP500',midPrice:String(price),change24h:previous>0?(price/previous-1)*100:0}
  },refetchInterval:30000,staleTime:15000})
  const all=[...markets,...(index.data?[index.data]:[])]
  const normalizedSearch=search.trim().toLowerCase()
  const searching=normalizedSearch.length>0
  const leaders=caps.data?.filter(symbol=>markets.some(m=>m.name===symbol)).slice(0,3) ?? []
  const names=favorites.size?[...favorites]:leaders.length?[...new Set([...leaders,'HYPE','xyz:SP500'])]:defaults
  const rows=searching?all.filter(m=>(m.name==='xyz:SP500'?'S&P 500 SP500':m.name).toLowerCase().includes(normalizedSearch)).slice(0,20):names.map(name=>all.find(m=>m.name===name)??{name,midPrice:'',change24h:NaN})
  const price=(value:string)=>Number(value)>0?Number(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:Number(value)<1?6:2}):'—'
  return <section className="lending-card market-watchlist"><div className="market-watchlist-heading"><div><h2>{favorites.size?'Favorites':'Market overview'} <span>★</span></h2><p>{favorites.size?'The markets you follow.':leaders.length?'Top available crypto markets by market cap, plus HYPE and the S&P 500.':'Major crypto markets, HYPE and the S&P 500. Star any market to make this your own.'}</p></div><input aria-label="Find a market" placeholder="Search BTC, ETH, S&P 500…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="market-watchlist-scroll"><table><thead><tr><th>Market</th><th>Price</th><th>24h change</th><th>Favorite</th></tr></thead><tbody>{rows.map(m=><tr key={m.name}><td>{m.name==='xyz:SP500'?<a className="market-watchlist-coin" href="https://app.hyperliquid.xyz/trade/xyz:SP500" target="_blank" rel="noopener noreferrer"><span className="market-index-logo"><img src={`${import.meta.env.BASE_URL}tokens/SP500.svg`} alt="S&P 500" width="64" height="24" /></span><span>S&P 500<small>SP500 · Index-linked perpetual ↗</small></span></a>:<Link className="market-watchlist-coin" to="/perps" onClick={()=>setSelectedMarket(m.name)}><TokenIcon symbol={m.name} size={34}/><span>{m.name}<small>Crypto perpetual</small></span></Link>}</td><td>{price(m.midPrice)}</td><td className={m.change24h>=0?'market-up':'market-down'}>{Number.isFinite(m.change24h)?`${m.change24h>=0?'+':''}${m.change24h.toFixed(2)}%`:'—'}</td><td><button aria-label={`${favorites.has(m.name)?'Unfavorite':'Favorite'} ${m.name}`} aria-pressed={favorites.has(m.name)} onClick={()=>toggleFav(m.name)}>{favorites.has(m.name)?'★':'☆'}</button></td></tr>)}</tbody></table></div>
    {searching&&!rows.length&&<p>{loading?'Loading markets…':error?'Market data is unavailable. Please try again shortly.':'No matching markets.'}</p>}
    <p className="market-watchlist-note">Hyperliquid market quotes · refreshed every 30 seconds. S&P 500 is an index-linked perpetual, not the cash index.{!favorites.size ? leaders.length ? ' Crypto selection ranked by CoinGecko market cap; HYPE and S&P 500 are featured separately.' : ' Showing default markets while market-cap rankings are unavailable.' : ''}{error||index.isError?' Some quotes are temporarily unavailable.':''}</p>
  </section>
}
