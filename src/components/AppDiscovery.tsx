import { AppLogo } from './AppLogo'
import { Link } from 'react-router-dom'
import { financeApps, type FinanceApp, type FinanceCategory } from '../lib/discovery'
import './AppDiscovery.css'

export function FinanceAppCard({ app }: { app: FinanceApp }) {
  return <article className="finance-app-card">
    <div className="finance-app-card-top"><AppLogo name={app.name} src={app.logo} /><div><h3>{app.name}</h3><span>{app.integrated ? 'Available in Oslo' : app.detailPath ? 'Explore in Oslo' : 'External app'}{app.id === 'hyperliquid' ? ' · Default for perps' : ''}</span></div></div>
    <p>{app.description}</p><div className="finance-network-tags">{app.networks.map(network => <span key={network}>{network}</span>)}</div>
    <details><summary>What you’ll need</summary><p>{app.requirements}</p></details>
    {app.detailPath ? <Link className="finance-app-action" to={app.detailPath}>Explore lending →<small>{app.id === 'kamino' ? 'View the lending guide in Oslo' : 'View live markets in Oslo'}</small></Link> : app.integrated ? <Link className="finance-app-action" to={app.destination}>Open {app.name} →</Link> : <a className="finance-app-action" data-external="true" href={app.destination} target="_blank" rel="noopener noreferrer">Visit {app.name} ↗<small>Opens the official site in a new tab</small></a>}
  </article>
}

export function AppDiscovery({ category, exclude }: { category: FinanceCategory; exclude?: string }) {
  const apps = financeApps.filter(app => app.category === category && app.id !== exclude)
  return <section className="finance-discovery-section" aria-label={`Discover ${category} apps`}><header><div><h2>Discover other apps</h2><p>Explore across networks. No wallet connection needed to browse.</p></div><Link to={`/discover?category=${category}`}>Search apps →</Link></header><div className="finance-app-grid">{apps.filter(app => !app.integrated).map(app => <FinanceAppCard key={app.id} app={app} />)}</div></section>
}
