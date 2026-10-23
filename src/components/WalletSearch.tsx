import { SearchIcon } from './shared/SearchIcon'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './AppDiscovery.css'
export function WalletSearch() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  return <section className="wallet-finance-search"><div><span>One place to explore</span><h2>What do you want to do?</h2><p>Find apps across networks. Keep your assets in view.</p></div><form onSubmit={e => { e.preventDefault(); navigate(`/discover${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`) }}><label className="finance-search-label" htmlFor="wallet-search">Search crypto finance</label><div className="finance-search-box"><input id="wallet-search" type="search" placeholder="Search apps, assets, or “lend USDC”…" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit" aria-label="Search apps" title="Search apps"><SearchIcon /></button></div></form><div className="wallet-discover-shortcuts"><Link to="/discover?category=lending">Lend & borrow</Link><Link to="/perps">Trade on Hyperliquid</Link><Link to="/discover?network=Solana">Explore Solana</Link><Link to="/discover">Discover all apps →</Link></div></section>
}
