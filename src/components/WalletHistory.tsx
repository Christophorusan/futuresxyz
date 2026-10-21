import { useEffect, useState } from 'react'
type Point = { time: number; value: number }
function read(key: string): Point[] {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(parsed) ? parsed.filter((p): p is Point => p && Number.isFinite(p.time) && Number.isFinite(p.value) && p.value >= 0).slice(-2000) : [] } catch { return [] }
}
export function WalletHistory({ address, value }: { address?: string; value: number | null }) {
  const key = `oslo-wallet-history:${address?.toLowerCase() ?? 'disconnected'}`
  const [history, setHistory] = useState<{key:string;points:Point[]}>({key:'',points:[]})
  const [range, setRange] = useState(1)
  useEffect(() => {
    if (!address || value === null) return
    const record = () => {
    const points = read(key)
    const now = Date.now()
    if (!points.length || now - points[points.length-1].time >= 60000) points.push({time:now,value})
    const trimmed = points.slice(-2000)
    try { localStorage.setItem(key, JSON.stringify(trimmed)) } catch { /* Storage may be unavailable. */ }
    setHistory({key,points:trimmed})
    }
    record()
    const timer = window.setInterval(record, 60000)
    return () => window.clearInterval(timer)
  }, [key, address, value])
  const points = history.key === key ? history.points.filter(p => range === 0 || p.time >= Date.now()-range*86400000) : []
  const min = Math.min(...points.map(p=>p.value)), max = Math.max(...points.map(p=>p.value))
  const line = points.map(p => `${((p.time-points[0].time)/Math.max(1,points[points.length-1].time-points[0].time))*1000},${180-((p.value-min)/Math.max(max-min,1))*140}`).join(' ')
  return <div className="wallet-history">
    <div className="wallet-history-toolbar"><span>Portfolio history</span><div aria-label="History period">{[[1,'1D'],[7,'1W'],[30,'1M'],[0,'ALL']].map(([days,label])=><button key={label} aria-pressed={range===days} onClick={()=>setRange(Number(days))}>{label}</button>)}</div></div>
    {points.length > 1 ? <><svg viewBox="0 0 1000 210" preserveAspectRatio="none" role="img" aria-label="Recorded portfolio value over time"><defs><linearGradient id="wallet-history-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#589bfa" stopOpacity=".3"/><stop offset="1" stopColor="#589bfa" stopOpacity="0"/></linearGradient></defs><polygon points={`0,210 ${line} 1000,210`} fill="url(#wallet-history-fill)"/><polyline points={line} fill="none" stroke="#4a8fee" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></svg><div className="wallet-history-dates"><span>{new Date(points[0].time).toLocaleString()}</span><span>{new Date(points[points.length-1].time).toLocaleString()}</span></div></> : <div className="wallet-history-empty"><span aria-hidden="true">⌁</span><strong>{address ? 'Your portfolio story starts here' : 'Your portfolio, all in view'}</strong><p>{address ? 'History appears after two snapshots, at least one minute apart.' : 'Connect your wallet to see your holdings and start recording portfolio history.'}</p></div>}
    <small className="wallet-history-note">Snapshots recorded in this browser while this page is open. Values are estimated in USDC; deposits and withdrawals affect the chart.</small>
  </div>
}
