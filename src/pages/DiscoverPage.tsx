import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FinanceAppCard } from '../components/AppDiscovery'
import { financeApps, searchFinanceApps } from '../lib/discovery'

export function DiscoverPage() {
  const [params, setParams] = useSearchParams()
  const savedQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(savedQuery)
  useEffect(() => { setQuery(savedQuery) }, [savedQuery])
  const category = params.get('category') ?? 'all'
  const network = params.get('network') ?? 'all'
  const apps = searchFinanceApps(query, category, network)
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (query.trim()) next.set('q', query.trim()); else next.delete('q'); if (!value || value === 'all') next.delete(key); else next.set(key, value); setParams(next, { replace: true }) }
  return <main className="finance-discover-page"><header className="finance-discover-hero"><span>Discover with Oslo</span><h1>What do you want<br />to do with your crypto?</h1><p>Search by app, asset, or goal. Explore Ethereum, Solana, Arbitrum, and Hyperliquid from one place.</p><label className="finance-search-label" htmlFor="finance-search">Search crypto finance</label><form className="finance-search-box" onSubmit={e => { e.preventDefault(); update('q', query) }}><span aria-hidden="true">⌕</span><input id="finance-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try “lend USDC on Solana”" /><button type="submit">Search →</button></form><div className="finance-search-suggestions">{['Lend USDC', 'Solana', 'Aave', 'Trade perps'].map(term => <button key={term} onClick={() => { setQuery(term); setParams({ q: term }, { replace: true }) }}>{term}</button>)}</div></header>
    <div className="finance-discovery-filters"><label>Activity<select value={category} onChange={e => update('category', e.target.value)}><option value="all">All activities</option><option value="lending">Lend & borrow</option><option value="perps">Trade perps</option><option value="swap">Swap tokens</option></select></label><label>Network<select value={network} onChange={e => update('network', e.target.value)}><option value="all">All networks</option>{[...new Set(financeApps.flatMap(app => app.networks))].sort().map(item => <option key={item}>{item}</option>)}</select></label><p role="status">{apps.length} {apps.length === 1 ? 'app' : 'apps'}</p></div>
    <div className="finance-app-grid">{apps.map(app => <FinanceAppCard key={app.id} app={app} />)}</div>
    {!apps.length && <div className="finance-discovery-empty"><h2>No matching apps yet</h2><p>This is a curated directory, not a search of every crypto app. Try another asset, network, or activity.</p><button onClick={() => { setQuery(''); setParams({}, { replace: true }) }}>Clear search and filters</button></div>}
    <p className="finance-discovery-note">Browsing works across networks without switching your wallet. Transactions still require the provider’s supported wallet, network, and funding. Oslo does not bridge funds automatically. Listings are not a safety rating; review each app’s terms, fees, and risks.</p>
  </main>
}
