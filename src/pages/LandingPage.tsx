import { useEffect, useState } from 'react'
import './LandingPage.css'
import { TokenIcon } from '../components/TokenIcon'

const features = [
  { name: 'Wallet', eyebrow: 'Wallet', title: 'All your balances.\nOne clear view.', text: 'Track supported assets across networks in the same portfolio, with balances and allocation together.' },
  { name: 'Payments', eyebrow: 'Payments', title: 'The details,\nbefore you send.', text: 'Send supported tokens on HyperEVM. Review the recipient, token, and amount before approving with your wallet.' },
  { name: 'Perps', eyebrow: 'Perps', title: 'See the market.\nPlan your next move.', text: 'Explore Hyperliquid markets, review the chart, and manage orders and positions in one trading workspace.' },
]

function ProductPreview({ selected }: { selected: number }) {
  return <div className="oslo-product-preview" data-theme="dark" aria-label={`${features[selected].name} interface preview with sample data`}>
    <div className="oslo-product-top"><b>oslo.</b><span>{features[selected].name}</span><span className="oslo-sample">Sample data</span></div>
    {selected === 0 ? <><p>Estimated portfolio value</p><strong className="oslo-product-total">$12,480.50 <small>USD</small></strong><div className="oslo-product-tools"><span>↗ Send</span><span>↙ Receive</span><span>⇄ Swap</span></div><div className="oslo-product-table"><div><span>Asset</span><span>Balance</span><span>Value</span></div>{[['ETH','1.25','$3,060.00'],['SOL','24','$3,120.00'],['HYPE','60','$6,300.50']].map(([coin,balance,value])=><div key={coin}><span><TokenIcon symbol={coin} size={24}/>{coin}</span><span>{balance}</span><b>{value}</b></div>)}</div><p>Ethereum · Solana · HyperCore</p></> : selected === 1 ? <><div className="oslo-payment-title"><h4>Send</h4><span>HyperEVM</span></div><div className="oslo-preview-field"><span>Recipient</span><b>0x71C…a482</b></div><div className="oslo-preview-field"><span>Token</span><b><TokenIcon symbol="USDC" size={22}/> USDC</b></div><div className="oslo-preview-field"><span>Amount</span><b>125.00 <small>USDC</small></b></div><div className="oslo-preview-review">Review transfer <span>↗</span></div><p>You approve with your connected wallet.</p></> : <><div className="oslo-market-title"><h4>BTC / USD</h4><span>Perpetual</span></div><strong className="oslo-product-total">$67,240.00</strong><p className="oslo-positive">+2.41% <span>24h change</span></p><svg viewBox="0 0 360 100" className="oslo-market-chart" role="img" aria-label="Sample market price chart"><path d="M0 85H360M0 50H360M0 15H360" stroke="#ffffff12"/><path d="M0 80L15 72 28 77 44 55 60 64 75 42 92 53 110 48 127 62 145 39 163 43 181 22 198 31 216 20 234 35 250 25 271 30 289 13 305 19 323 7 341 17 360 5" fill="none" stroke="#60a5fa" strokeWidth="2"/></svg><div className="oslo-product-table"><div><span>Order type</span><span>Size</span><span>Leverage</span></div><div><b>Limit</b><b>0.01 BTC</b><b>2×</b></div></div><div className="oslo-preview-trade"><span>Buy / Long</span><span>Sell / Short</span></div></>}
  </div>
}

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [selected, setSelected] = useState(0)
  const feature = features[selected]
  useEffect(() => {
    document.body.classList.add('oslo-landing-active')
    return () => document.body.classList.remove('oslo-landing-active')
  }, [])

  return <div className="oslo-landing">
    <a className="oslo-skip" href="#oslo-main">Skip to content</a>
    <header className="oslo-header">
      <a href="#" className="oslo-wordmark" aria-label="Oslo home">oslo.</a>
      <nav aria-label="Landing page navigation"><a href="#possibilities">Explore Oslo</a><a href="#community">Our principles</a><a href="#questions">Questions</a></nav>
      <button className="oslo-button oslo-button-dark" onClick={onEnter}>Explore app <span aria-hidden="true">↗</span></button>
    </header>

    <main id="oslo-main">
      <section className="oslo-hero">
        <div className="oslo-hero-copy"><span className="oslo-eyebrow"><i /> Open finance. Shared possibilities.</span>
          <h1>Making finance<br /><span>accessible.</span></h1>
          <p>Your starting point for decentralized finance. Find apps across networks, track your crypto, and choose your next move—with your wallet in your control.</p>
          <div className="oslo-hero-actions"><button className="oslo-button oslo-button-dark" onClick={onEnter}>Explore app <span aria-hidden="true">↗</span></button><a href="#possibilities">See how it works <span aria-hidden="true">↓</span></a></div>
          <div className="oslo-hero-note"><span aria-hidden="true">◎</span> Explore first. Connect your wallet when you’re ready.</div>
        </div>
        <div className="oslo-visual" aria-label="Illustrative Oslo wallet preview, not live account data">
          <div className="oslo-orbit oslo-orbit-one" /><div className="oslo-orbit oslo-orbit-two" /><div className="oslo-orbit oslo-orbit-three" />
          <div className="oslo-floating-token oslo-token-top" aria-hidden="true">↗</div>
          <div className="oslo-wallet-demo" data-theme="dark">
            <div className="oslo-phone-status" aria-hidden="true"><span>9:41</span><i /><span>••• ▰</span></div>
            <div className="oslo-demo-head"><b>oslo</b><span>Portfolio</span><span className="oslo-demo-avatar">O</span></div>

            <div className="oslo-demo-summary">
              <div className="oslo-demo-balance"><span>Estimated portfolio value</span><strong>$12,480.50 <small>USD</small></strong><p>+$284.32 (2.33%) <span>today</span></p></div>
              <div className="oslo-demo-actions"><span>↗<small>Send</small></span><span>↙<small>Receive</small></span><span>⇄<small>Swap</small></span><span>＋<small>Lend</small></span></div>
              <div className="oslo-demo-chart-title"><span>Balance over time</span><span>1H <b>1D</b> 1W 1M</span></div>
              <svg className="oslo-demo-chart" viewBox="0 0 270 90" role="img" aria-label="Illustrative portfolio balance chart"><defs><linearGradient id="oslo-preview-chart" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--blue)" stopOpacity=".35"/><stop offset="1" stopColor="var(--blue)" stopOpacity="0"/></linearGradient></defs><path d="M0 70L12 66 22 71 34 58 43 62 56 50 66 57 78 45 90 51 102 37 115 46 126 40 137 49 149 31 159 37 170 25 181 30 193 18 204 25 216 15 228 19 239 9 250 14 270 5V90H0Z" fill="url(#oslo-preview-chart)"/><path d="M0 70L12 66 22 71 34 58 43 62 56 50 66 57 78 45 90 51 102 37 115 46 126 40 137 49 149 31 159 37 170 25 181 30 193 18 204 25 216 15 228 19 239 9 250 14 270 5" fill="none" stroke="var(--blue-hover)" strokeWidth="2"/></svg>
            </div>
            <div className="oslo-demo-assets"><div><span>Holdings</span><span>All networks</span></div>{[['ETH','Ethereum','1.25 ETH','$3,060.00'],['SOL','Solana','24 SOL','$3,120.00'],['HYPE','HyperCore','60 HYPE','$6,300.50']].map(([name, detail, balance, value]) => <div key={name}><TokenIcon symbol={name} size={25} /><span><b>{name}</b><small>{detail}</small></span><span className="oslo-demo-asset-value"><b>{value}</b><small>{balance}</small></span></div>)}</div>

            <div className="oslo-demo-foot">Illustrative preview · Sample balances</div>
            <div className="oslo-demo-nav"><b>◈<small>Wallet</small></b><span>⇄<small>Swap</small></span><span>≋<small>Trade</small></span><span>＋<small>Lend</small></span></div>

          </div>
          <div className="oslo-float-label"><span>↗</span><div>Less switching.<br /><b>More living.</b></div></div>
        </div>
      </section>

      <div className="oslo-capabilities"><span>ONE WALLET. OPEN POSSIBILITIES.</span><span>Hold <i>↗</i></span><span>Send <i>↗</i></span><span>Lend <i>↗</i></span><span>Trade <i>↗</i></span></div>

      <section className="oslo-possibilities" id="possibilities">
        <div className="oslo-section-heading"><span className="oslo-eyebrow">Inside Oslo</span><h2>A clearer way to<br />see, send, and trade.</h2><p>Start with your goal. Discover apps, explore markets, and keep your assets in view.</p></div>
        <div className="oslo-feature-layout"><div className="oslo-feature-menu" role="tablist" aria-label="Explore Oslo features">{features.map((item, i) => <button key={item.name} role="tab" id={`feature-tab-${i}`} aria-selected={selected === i} aria-controls="feature-panel" tabIndex={selected === i ? 0 : -1} onKeyDown={event => {
          const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (i + 1) % features.length : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (i + features.length - 1) % features.length : event.key === 'Home' ? 0 : event.key === 'End' ? features.length - 1 : null
          if (next !== null) { event.preventDefault(); setSelected(next); document.getElementById(`feature-tab-${next}`)?.focus() }
        }} onClick={() => setSelected(i)}><span>0{i + 1}</span>{item.name}<span aria-hidden="true">↗</span></button>)}</div>
          <div className="oslo-feature-panel" id="feature-panel" role="tabpanel" aria-labelledby={`feature-tab-${selected}`} tabIndex={0}><div><span className="oslo-eyebrow">{feature.eyebrow}</span><h3>{feature.title}</h3><p>{feature.text}</p><button className="oslo-text-button" onClick={onEnter}>Explore app <span aria-hidden="true">↗</span></button></div><ProductPreview selected={selected} /></div>
        </div>
      </section>

      <section className="oslo-community" id="community" aria-labelledby="oslo-community-title">
        <div className="oslo-section-heading"><span className="oslo-eyebrow">The ideas behind Oslo</span><h2 id="oslo-community-title">Open finance starts<br />with people.</h2><p>Our aim: make crypto easier to use while keeping ownership, transparency, and community at the center.</p></div>
        <div className="oslo-principles">
          <article><span>01</span><h3>Access with clarity.</h3><p>Understand what you hold and what you can do. Explore supported networks and markets from one interface.</p></article>
          <article><span>02</span><h3>Ownership with choice.</h3><p>Connect your own wallet. Review transaction details and approve the actions you choose to take.</p></article>
          <article><span>03</span><h3>Progress together.</h3><p>Better tools start with the people using them. Share an idea, report an issue, or contribute to Oslo’s code.</p><a href="https://github.com/christophorusan/futuresxyz" target="_blank" rel="noopener noreferrer">Explore the project ↗</a></article>
        </div>
      </section>

      <section className="oslo-how" id="how-it-works"><div><span className="oslo-eyebrow">Get started</span><h2>Your wallet.<br />Your decisions.</h2><p>Start by exploring. Connect when you’re ready, understand the details, and choose your next step.</p><button className="oslo-button oslo-button-mint" onClick={onEnter}>Explore app <span aria-hidden="true">↗</span></button></div>
        <ol><li><span>01</span><div><h3>Bring your wallet.</h3><p>Connect a supported wallet to access your account.</p></div></li><li><span>02</span><div><h3>Find your starting point.</h3><p>View supported assets, receive tokens, or explore a market.</p></div></li><li><span>03</span><div><h3>Make your move.</h3><p>Review transaction details and approve with your connected wallet.</p></div></li></ol>
      </section>

      <section className="oslo-faq" id="questions"><div><span className="oslo-eyebrow">Questions</span><h2>Good questions.<br />Straight answers.</h2></div><div>
        <details><summary>What is Oslo?<span aria-hidden="true">+</span></summary><p>Oslo is a wallet-centered finance interface bringing together supported balances, payments, lending, and trading. Previously Futures XYZ, Oslo aims to make decentralized finance more accessible, with community participation and individual ownership at its center.</p></details>
        <details><summary>Do I need a wallet to explore?<span aria-hidden="true">+</span></summary><p>You can enter the app and explore without connecting. Viewing your balances or approving transactions requires a supported wallet.</p></details>
        <details><summary>Which networks does Oslo support?<span aria-hidden="true">+</span></summary><p>Your portfolio brings together Ethereum, Base, Arbitrum, Optimism, Polygon, HyperEVM, Solana and HyperCore accounts. Add public addresses to track additional wallets. Payments currently use HyperEVM; NFTs and lending positions are not included in portfolio totals yet.</p></details>
        <details><summary>What should I know before using it?<span aria-hidden="true">+</span></summary><p>Oslo is not a bank. Network fees may apply. Lending and trading have risks, including loss of funds. Review each product and transaction before you approve.</p></details>
      </div></section>

      <section className="oslo-closing"><span className="oslo-eyebrow">Making finance accessible</span><h2>Finance for people.<br />Ownership for you.</h2><button className="oslo-button oslo-button-dark" onClick={onEnter}>Explore app <span aria-hidden="true">↗</span></button><div className="oslo-closing-word" aria-hidden="true">oslo.</div></section>
    </main>
    <footer className="oslo-footer"><a href="#" className="oslo-wordmark">oslo.</a><p>Making finance accessible.</p><span>© {new Date().getFullYear()} Oslo</span><a href="#questions">About Oslo ↗</a></footer>
  </div>
}
