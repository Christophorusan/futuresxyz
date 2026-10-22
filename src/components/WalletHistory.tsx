import { useEffect, useRef, useState } from 'react'
import { appendSnapshot, parseHistory, type BalancePoint } from '../lib/walletHistory'
const ranges = [{days:1/24,label:'1H'},{days:1,label:'1D'},{days:7,label:'1W'},{days:30,label:'1M'},{days:0,label:'ALL'}]
const previewValues = [100,101,100.4,103,105,104,106,105,104,106,109,108,112,115,114,116,115,114,116,118,117,121,120,119,122,123,122,124]
const amount = (n: number) => n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})
export function WalletHistory({ address, value, status }: { address?: string; value: number | null; status?: string }) {
  const key = `oslo-wallet-history:${address ?? 'disconnected'}`
  const [history, setHistory] = useState<{key:string;points:BalancePoint[]}>({key:'',points:[]})
  const current = useRef(value)
  current.current = value
  const [range, setRange] = useState(1)
  const [hover, setHover] = useState<number | null>(null)
  const [preview, setPreview] = useState(false)
  useEffect(() => {
    if (!address) return
    let points: BalancePoint[] = []
    try { points = parseHistory(localStorage.getItem(key)) } catch { /* Private browsing can disable storage. */ }
    setHistory({key,points})
    const record = () => {
      if (current.current === null) return
      points = appendSnapshot(points,{time:Date.now(),value:current.current})
      try { localStorage.setItem(key,JSON.stringify(points)) } catch { /* Keep session history in memory. */ }
      setHistory({key,points:[...points]})
    }
    record()
    const timer=window.setInterval(record,15000)
    return () => window.clearInterval(timer)
  }, [key,address,value])
  const recorded = history.key===key ? history.points.filter(p=>range===0 || p.time>=Date.now()-range*86400000) : []
  const isPreview = preview && !address
  const points = isPreview ? previewValues.map((v,i)=>({time:Date.now()-((previewValues.length-1-i)*3600000),value:v})) : recorded
  const first=points[0], last=points.at(-1)
  const min=points.length ? Math.min(...points.map(p=>p.value)) : 0
  const max=points.length ? Math.max(...points.map(p=>p.value)) : 1
  const padding=Math.max((max-min)*.15,max*.002,.01)
  const low=Math.max(0,min-padding), high=max+padding
  const x=(p:BalancePoint)=>first && last && first.time!==last.time ? 20+(p.time-first.time)/(last.time-first.time)*960 : 500
  const y=(p:BalancePoint)=>240-(p.value-low)/(high-low)*210
  const line=points.map(p=>`${x(p)},${y(p)}`).join(' ')
  const selected=hover!==null ? points[Math.min(hover,points.length-1)] : last
  const change=first && last ? last.value-first.value : null
  const pick=(clientX:number,rect:DOMRect)=> {
    const position=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width))
    const target=(first?.time??0)+position*((last?.time??0)-(first?.time??0))
    let nearest=0
    points.forEach((p,i)=>{if(Math.abs(p.time-target)<Math.abs(points[nearest].time-target)) nearest=i})
    setHover(nearest)
  }
  return <div className="wallet-history wallet-balance-chart">
    <div className="wallet-history-toolbar"><div><strong>Balance over time</strong><span className={change!==null&&change<0?'wallet-price-down':'wallet-price-up'}>{change===null?'':`${change>=0?'+':''}${amount(change)} USD${first?.value ? ` (${(change/first.value*100).toFixed(2)}%)` : ''}`}</span></div><div aria-label="History period">{ranges.map(r=><button key={r.label} disabled={isPreview} aria-pressed={range===r.days} onClick={()=>{setRange(r.days);setHover(null)}}>{r.label}</button>)}</div></div>
    {isPreview && <div className="wallet-chart-preview-label">Example chart · sample data, not your balance <button onClick={()=>{setPreview(false);setHover(null)}}>Close preview</button></div>}
    <div className="wallet-chart-stage">
      <svg viewBox="0 0 1000 270" preserveAspectRatio="none" role="img" aria-label={isPreview?'Example balance chart with sample data':'Wallet balance over time'} onPointerMove={e=>{if(points.length)pick(e.clientX,e.currentTarget.getBoundingClientRect())}} onPointerLeave={()=>setHover(null)}>
        <defs><linearGradient id="wallet-history-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#589bfa" stopOpacity=".3"/><stop offset="1" stopColor="#589bfa" stopOpacity="0"/></linearGradient><pattern id="wallet-chart-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#6a9bdf" opacity=".28"/></pattern></defs>
        {[30,100,170,240].map(v=><line key={v} x1="0" x2="1000" y1={v} y2={v} stroke="currentColor" opacity=".08" strokeDasharray="3 5"/>)}
        {points.length>1 && <><polygon points={`${x(first)},260 ${line} ${x(last!)},260`} fill="url(#wallet-history-fill)"/><polygon points={`${x(first)},260 ${line} ${x(last!)},260`} fill="url(#wallet-chart-dots)"/><polyline points={line} fill="none" stroke="#4a8fee" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></>}
        {selected && <><line x1={x(selected)} x2={x(selected)} y1="20" y2="250" stroke="#6c9be0" strokeDasharray="4 5" opacity=".5"/><circle cx={x(selected)} cy={y(selected)} r="4" fill="#4a8fee" stroke="white" strokeWidth="2"/></>}
      </svg>
      {selected && <output className="wallet-chart-value">{amount(selected.value)} <small>USD · {new Date(selected.time).toLocaleString()}</small></output>}
      {!points.length && <div className="wallet-chart-overlay"><strong>{address?'Waiting for your first balance snapshot':'Connect to track your balance'}</strong><p>{address ? status ?? 'Your chart starts when your balances load.' : 'Your portfolio value will update here over time.'}</p>{!address&&<button onClick={()=>setPreview(true)}>Preview the chart ↗</button>}</div>}
      {points.length===1 && <span className="wallet-chart-first">First snapshot recorded. The line grows as new balances arrive.</span>}
    </div>
    {first && last && <div className="wallet-history-dates"><span>{new Date(first.time).toLocaleString()}</span><span>{new Date(last.time).toLocaleString()}</span></div>}
    {points.length>1 && <input className="wallet-chart-scrubber" type="range" min="0" max={points.length-1} value={hover ?? points.length-1} onChange={e=>setHover(Number(e.target.value))} aria-label="Explore balance history" aria-valuetext={selected ? `${amount(selected.value)} USD at ${new Date(selected.time).toLocaleString()}` : undefined}/>}
    <small className="wallet-history-note">{isPreview?'Preview only. Connect your wallet to track real balances.':'Recorded in this browser while this wallet page is open, kept for 90 days. Values are in USD; deposits and withdrawals affect the change.'}</small>
  </div>
}
