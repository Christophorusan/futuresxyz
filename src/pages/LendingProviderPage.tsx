import { ProviderMarkets } from '../components/ProviderMarkets'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { financeApps } from '../lib/discovery'
import { AppDiscovery } from '../components/AppDiscovery'

const guides: Record<string, { supply: string; borrow: string; check: string }> = {
  aave: { supply: 'Supply to a lending pool. Available assets and variable earning rates depend on the market you choose.', borrow: 'Use eligible supplied assets as collateral to borrow. Your borrowing capacity depends on collateral and market settings.', check: 'Review the reserve’s liquidity, collateral settings, supply limits, and health factor.' },
  morpho: { supply: 'Explore curated lending vaults. Each vault allocates deposits to markets according to its curator’s strategy.', borrow: 'Choose an isolated market with a specific loan asset, collateral asset, and liquidation threshold.', check: 'Review the vault curator, market collateral, oracle, withdrawal liquidity, and liquidation threshold.' },
  kamino: { supply: 'Explore lending reserves on Solana. The chosen market determines supported assets and earning rates.', borrow: 'Supply eligible collateral and borrow within the market’s limits. Monitor the position as asset prices and rates change.', check: 'Review the reserve, available liquidity, loan-to-value limits, and liquidation conditions.' },
}

export function LendingProviderPage() {
  const { provider } = useParams()
  const app = financeApps.find(item => item.id === provider && item.detailPath)
  const [intent, setIntent] = useState<'supply' | 'borrow'>('supply')
  if (!app || !guides[app.id]) return <main className="finance-discover-page"><h1>Lending app not found</h1><Link to="/lending">Back to lending</Link></main>
  const guide = guides[app.id]
  return <main className="finance-discover-page finance-provider-page">
    <Link className="finance-back" to="/lending">← Lending</Link>
    <header className="finance-provider-heading"><span className="finance-app-monogram" aria-hidden="true">{app.name[0]}</span><div><p>Discover / Lending</p><h1>{app.name} lending</h1><p>{app.description}</p></div></header>
    <div className="finance-network-tags" aria-label="Networks">{app.networks.map(network => <span key={network}>{network}</span>)}</div>
    {(app.id === 'aave' || app.id === 'morpho') && <ProviderMarkets key={app.id} provider={app.id} />}
    <div className="finance-provider-layout">
      <section className="finance-app-card">
        <div className="finance-intent-tabs" aria-label="Lending activity"><button aria-pressed={intent === 'supply'} onClick={() => setIntent('supply')}>Supply & earn</button><button aria-pressed={intent === 'borrow'} onClick={() => setIntent('borrow')}>Borrow</button></div>
        <h2>{intent === 'supply' ? 'Put your assets to work' : 'Borrow against your assets'}</h2>
        <p>{guide[intent]}</p>
        <h3>Before you choose a market</h3><p>{guide.check}</p>
        <div className="finance-provider-status"><strong>{app.id === 'kamino' ? 'Lending guide' : 'Explore here, transact with the provider'}</strong><p>{app.id === 'kamino' ? 'Live market data for Kamino is not connected yet. ' : ''}Account balances and transactions for {app.name} are not connected to Oslo yet. Continue to {app.name} to choose a market and review current terms.</p></div>
        <a className="finance-app-action" data-external="true" href={app.destination} target="_blank" rel="noopener noreferrer">Continue to {app.name} lending ↗<small>Opens the official app in a new tab</small></a>
      </section>
      <aside className="finance-app-card"><h2>What you’ll need</h2><p>{app.requirements}</p><h3>Your wallet, your approval</h3><p>Browsing here does not move funds or change your wallet’s network. Funding and transaction approvals happen in the provider’s app.</p><Link className="finance-app-action" to="/wallet">View your wallet →</Link></aside>
    </div>
    <AppDiscovery category="lending" exclude={app.id} />
  </main>
}
