import { useEffect, useState } from 'react'
import './LandingPage.css'
import { TokenIcon } from '../components/TokenIcon'

const features = [
  { name: 'Wallet', eyebrow: 'A CLEARER PICTURE', title: 'Your assets.\nAll in view.', text: 'One place for your digital assets. Track balances across supported EVM networks, Solana and HyperCore.', symbol: '◉' },
  { name: 'Payments', eyebrow: 'MONEY IN MOTION', title: 'Send simply.\nReceive easily.', text: 'Send supported tokens, share payment requests, and review the details before approving in your wallet.', symbol: '↗' },
  { name: 'Lending', eyebrow: 'EXPLORE MORE', title: 'Put your assets\nto work.', text: 'Explore lending markets and review rates, collateral requirements, and risk before opening a position.', symbol: '+' },
  { name: 'Trading', eyebrow: 'WHEN OPPORTUNITY CALLS', title: 'Your next move.\nYour decision.', text: 'Move from your wallet overview to Hyperliquid markets, with tools for orders, positions, and portfolio monitoring.', symbol: '⌁' },
]

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
      <nav aria-label="Landing page navigation"><a href="#possibilities">Explore Oslo</a><a href="#how-it-works">How it works</a><a href="#questions">Questions</a></nav>
      <button className="oslo-button oslo-button-dark" onClick={onEnter}>Enter app <span aria-hidden="true">↗</span></button>
    </header>

    <main id="oslo-main">
      <section className="oslo-hero">
        <div className="oslo-hero-copy"><span className="oslo-eyebrow"><i /> MEET OSLO. YOUR EVERYDAY CRYPTO COMPANION</span>
          <h1>A wallet that<br /><span>feels like home.</span></h1>
          <p>Your assets, payments, and next possibilities. A simpler home for your onchain life, with your wallet at the center.</p>
          <div className="oslo-hero-actions"><button className="oslo-button oslo-button-dark" onClick={onEnter}>Enter Oslo <span aria-hidden="true">↗</span></button><a href="#possibilities">Find your possibilities <span aria-hidden="true">↓</span></a></div>
          <div className="oslo-hero-note"><span aria-hidden="true">◎</span> Connect your wallet. Make yourself at home.</div>
        </div>
        <div className="oslo-visual" aria-label="Illustrative Oslo wallet preview, not live account data">
          <div className="oslo-orbit oslo-orbit-one" /><div className="oslo-orbit oslo-orbit-two" /><div className="oslo-orbit oslo-orbit-three" />
          <div className="oslo-floating-token oslo-token-top" aria-hidden="true">↗</div>
          <div className="oslo-wallet-demo">
            <div className="oslo-phone-status" aria-hidden="true"><span>9:41</span><i /><span>••• ▰</span></div><div className="oslo-demo-head"><b>oslo.</b><span>WALLET PREVIEW</span><span className="oslo-demo-avatar">O</span></div>
            <div className="oslo-demo-balance"><span>Your wallet, connected</span><strong>$12,480.50</strong><p>Sample balance · Your assets in one place</p></div>
            <div className="oslo-demo-actions"><span>↗<small>Send</small></span><span>↙<small>Receive</small></span><span>⇄<small>Swap</small></span><span>+<small>Lend</small></span></div>
            <div className="oslo-demo-assets"><div><span>Assets</span><span>HyperEVM ↗</span></div>{[['HYPE','Hyperliquid'],['USDC','USD Coin'],['USDH','USDH']].map(([name, detail]) => <div key={name}><TokenIcon symbol={name} size={27} /><span><b>{name}</b><small>{detail}</small></span><span className="oslo-demo-dash">—</span></div>)}</div>
            <div className="oslo-demo-foot"><i /> Preview · Connect to see your balances</div><div className="oslo-demo-nav"><b>◉<small>Wallet</small></b><span>↗<small>Payments</small></span><span>+<small>Lending</small></span><span>⌁<small>Trade</small></span></div>
          </div>
          <div className="oslo-float-label"><span>↗</span><div>Less switching.<br /><b>More living.</b></div></div>
        </div>
      </section>

      <div className="oslo-capabilities"><span>ONE WALLET. OPEN POSSIBILITIES.</span><span>Hold <i>↗</i></span><span>Send <i>↗</i></span><span>Lend <i>↗</i></span><span>Trade <i>↗</i></span></div>

      <section className="oslo-possibilities" id="possibilities">
        <div className="oslo-section-heading"><span className="oslo-eyebrow">FINANCE, WITH ROOM TO MOVE</span><h2>Start with a wallet.<br />Go beyond it.</h2><p>The tools you need, connected by one familiar place.</p></div>
        <div className="oslo-feature-layout"><div className="oslo-feature-menu" role="tablist" aria-label="Explore Oslo features">{features.map((item, i) => <button key={item.name} role="tab" id={`feature-tab-${i}`} aria-selected={selected === i} aria-controls="feature-panel" tabIndex={selected === i ? 0 : -1} onKeyDown={event => {
          const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (i + 1) % features.length : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (i + features.length - 1) % features.length : event.key === 'Home' ? 0 : event.key === 'End' ? features.length - 1 : null
          if (next !== null) { event.preventDefault(); setSelected(next); document.getElementById(`feature-tab-${next}`)?.focus() }
        }} onClick={() => setSelected(i)}><span>0{i + 1}</span>{item.name}<span aria-hidden="true">↗</span></button>)}</div>
          <div className="oslo-feature-panel" id="feature-panel" role="tabpanel" aria-labelledby={`feature-tab-${selected}`} tabIndex={0}><div><span className="oslo-eyebrow">{feature.eyebrow}</span><h3>{feature.title}</h3><p>{feature.text}</p><button className="oslo-text-button" onClick={onEnter}>Explore in Oslo <span aria-hidden="true">↗</span></button></div><div className={`oslo-feature-art oslo-feature-art-${selected}`} aria-hidden="true"><div /><div /><span>{feature.symbol}</span></div></div>
        </div>
      </section>

      <section className="oslo-how" id="how-it-works"><div><span className="oslo-eyebrow">LESS BETWEEN YOU AND YOUR MONEY</span><h2>Make yourself<br /><em>at home.</em></h2><p>No maze of tabs to get started. Just a clear path from your wallet to what you want to do.</p><button className="oslo-button oslo-button-mint" onClick={onEnter}>Open Oslo <span aria-hidden="true">↗</span></button></div>
        <ol><li><span>01</span><div><h3>Bring your wallet.</h3><p>Connect a supported wallet to access your account.</p></div></li><li><span>02</span><div><h3>Find your starting point.</h3><p>View supported assets, receive tokens, or explore a market.</p></div></li><li><span>03</span><div><h3>Make your move.</h3><p>Review transaction details and approve with your connected wallet.</p></div></li></ol>
      </section>

      <section className="oslo-faq" id="questions"><div><span className="oslo-eyebrow">A LITTLE CLARITY</span><h2>Good questions.<br />Straight answers.</h2></div><div>
        <details><summary>What is Oslo?<span aria-hidden="true">+</span></summary><p>Oslo is a wallet-centered finance interface bringing together supported balances, payments, lending, and trading. It’s the new home of Futures XYZ.</p></details>
        <details><summary>Do I need a wallet to explore?<span aria-hidden="true">+</span></summary><p>You can enter the app and explore without connecting. Viewing your balances or approving transactions requires a supported wallet.</p></details>
        <details><summary>Which networks does Oslo support?<span aria-hidden="true">+</span></summary><p>Your portfolio brings together Ethereum, Base, Arbitrum, Optimism, Polygon, HyperEVM, Solana and HyperCore accounts. Add public addresses to track additional wallets. Payments currently use HyperEVM; NFTs and lending positions are not included in portfolio totals yet.</p></details>
        <details><summary>What should I know before using it?<span aria-hidden="true">+</span></summary><p>Oslo is not a bank. Network fees may apply. Lending and trading have risks, including loss of funds. Review each product and transaction before you approve.</p></details>
      </div></section>

      <section className="oslo-closing"><span className="oslo-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>A little more freedom.<br />A lot more possibility.</h2><button className="oslo-button oslo-button-dark" onClick={onEnter}>Enter Oslo <span aria-hidden="true">↗</span></button><div className="oslo-closing-word" aria-hidden="true">oslo.</div></section>
    </main>
    <footer className="oslo-footer"><a href="#" className="oslo-wordmark">oslo.</a><p>Your wallet. Your next move.</p><span>© {new Date().getFullYear()} Oslo</span><a href="#questions">About Oslo ↗</a></footer>
  </div>
}
