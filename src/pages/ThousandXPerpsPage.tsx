import { AssetLabel } from '../components/AssetLabel'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const markets = [{ id: 'btc', symbol: 'BTC', name: 'Bitcoin' }, { id: 'eth', symbol: 'ETH', name: 'Ethereum' }] as const
const docs = 'https://docs.papertrade.xyz/'

export function ThousandXPerpsPage() {
  const [market, setMarket] = useState<(typeof markets)[number]>(markets[0])
  const exchange = `https://exchange.papertrade.xyz/trade/${market.id}`
  return <main className="lending-page payments-page thousandx-page">
    <header className="payment-hero">
      <div><span className="payment-eyebrow">PAPERTRADE EXCHANGE</span><h1>1000x Perps</h1><p>Synthetic perpetuals on HyperEVM, in a dedicated trading venue.</p></div>
      <span className="payment-network">HyperEVM · Chain 999</span>
    </header>
    <div className="payment-layout">
      <section className="lending-card thousandx-launch">
        <span className="thousandx-number" aria-hidden="true">1000<span>×</span></span>
        <h2>Trade with Papertrade</h2>
        <p>Open the official exchange to select a market, review leverage and manage your positions. Available leverage and execution depend on Papertrade’s current market limits.</p>
        <fieldset className="thousandx-markets"><legend>Choose your market</legend><div>{markets.map(item => <label key={item.id} className={market.id === item.id ? 'selected' : ''}><input type="radio" name="papertrade-market" value={item.id} checked={market.id === item.id} onChange={() => setMarket(item)} /><span><strong><AssetLabel symbol={item.symbol} size={28} /></strong><small>{item.name}</small></span></label>)}</div></fieldset>
        <a className="thousandx-primary" href={exchange} target="_blank" rel="noopener noreferrer">Open {market.symbol} in Papertrade ↗</a>
        <p className="thousandx-caption">exchange.papertrade.xyz · opens in a new tab. Connect your wallet there to trade.</p>
        <div className="thousandx-links">
          <a href="https://exchange.papertrade.xyz/portfolio?mode=pnl" target="_blank" rel="noopener noreferrer">Papertrade portfolio ↗</a>
          <a href={`${exchange}?tab=status`} target="_blank" rel="noopener noreferrer">Market status ↗</a>
          <a href={docs} target="_blank" rel="noopener noreferrer">Protocol docs ↗</a>
        </div>
      </section>
      <aside>
        <section className="lending-card"><h2>A separate account experience</h2>
          <p>Papertrade settles synthetic positions against its liquidity pool. Your regular Hyperliquid perpetual positions stay in the Perps section.</p>
          <p>Connecting here does not connect you to Papertrade. Deposits, withdrawals, signing and positions are managed in its official exchange.</p>
          <Link to="/perps">Go to regular Perps →</Link>
        </section>
        <section className="lending-card"><h3>Understand the position before opening it</h3>
          <p>High leverage makes small price moves significant. Liquidation can consume the full isolated margin, and profitable payouts can enter a queue when pool liquidity is insufficient.</p>
          <div className="thousandx-links"><a href={`${docs}#/learn/liquidations`} target="_blank" rel="noopener noreferrer">Liquidation rules ↗</a><a href={`${docs}#/learn/lp-queue`} target="_blank" rel="noopener noreferrer">Payout queue ↗</a></div>
        </section>
        <section className="lending-card"><h3>Getting started</h3>
          <p>Use Papertrade’s deposit instructions for its USDC collateral account. Sending funds to an exchange contract directly is not a substitute for its deposit flow.</p>
          <a href={`${docs}#/intro/quick-start`} target="_blank" rel="noopener noreferrer">Read the quick start ↗</a>
        </section>
      </aside>
    </div>
  </main>
}
