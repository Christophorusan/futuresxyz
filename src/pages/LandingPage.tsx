import { AppLogo } from '../components/AppLogo'
import { financeApps } from '../lib/discovery'
import { AssetLabel } from '../components/AssetLabel'
import { useEffect } from 'react'
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
    {selected === 0 ? <><p>Estimated portfolio value</p><strong className="oslo-product-total">$12,480.50 <small>USD</small></strong><div className="oslo-product-tools"><span>↗ Send</span><span>↙ Receive</span><span>⇄ Swap</span></div><div className="oslo-product-table"><div><span>Asset</span><span>Balance</span><span>Value</span></div>{[['ETH','1.25','$3,060.00'],['SOL','24','$3,120.00'],['HYPE','60','$6,300.50']].map(([coin,balance,value])=><div key={coin}><span><TokenIcon symbol={coin} size={24}/>{coin}</span><span>{balance}</span><b>{value}</b></div>)}</div><p>Ethereum · Solana · HyperCore</p></> : selected === 1 ? <><div className="oslo-payment-title"><h4>Send</h4><span>HyperEVM</span></div><div className="oslo-preview-field"><span>Recipient</span><b>0x71C…a482</b></div><div className="oslo-preview-field"><span>Token</span><b><TokenIcon symbol="USDC" size={22}/> USDC</b></div><div className="oslo-preview-field"><span>Amount</span><b>125.00 <small>USDC</small></b></div><div className="oslo-preview-review">Review transfer <span>↗</span></div><p>You approve with your connected wallet.</p></> : <><div className="oslo-market-title"><h4><AssetLabel symbol="BTC" label="BTC / USD" size={24} /></h4><span>Perpetual</span></div><strong className="oslo-product-total">$67,240.00</strong><p className="oslo-positive">+2.41% <span>24h change</span></p><svg viewBox="0 0 360 100" className="oslo-market-chart" role="img" aria-label="Sample market price chart"><path d="M0 85H360M0 50H360M0 15H360" stroke="#ffffff12"/><path d="M0 80L15 72 28 77 44 55 60 64 75 42 92 53 110 48 127 62 145 39 163 43 181 22 198 31 216 20 234 35 250 25 271 30 289 13 305 19 323 7 341 17 360 5" fill="none" stroke="#d0d0ca" strokeWidth="2"/></svg><div className="oslo-product-table"><div><span>Order type</span><span>Size</span><span>Leverage</span></div><div><b>Limit</b><b>0.01 BTC</b><b>2×</b></div></div><div className="oslo-preview-trade"><span>Buy / Long</span><span>Sell / Short</span></div></>}
  </div>
}

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    document.body.classList.add('oslo-landing-active')
    return () => document.body.classList.remove('oslo-landing-active')
  }, [])
  const enter = <button className="oslo-button" onClick={onEnter}>Explore app <span aria-hidden="true">↗</span></button>
  return <div className="oslo-landing">
    <a className="oslo-skip" href="#oslo-main">Skip to content</a>
    <header className="oslo-header"><a href="#" className="oslo-wordmark" aria-label="Oslo home">oslo.</a><nav aria-label="Main navigation"><a href="#possibilities">The wallet</a><a href="#discover">Discover DeFi</a><a href="#community">Our principles</a></nav>{enter}</header>
    <main id="oslo-main">
      <section className="oslo-hero">
        <div className="oslo-hero-copy"><h1>Making finance accessible.</h1><p>Hold. Trade. Borrow. Earn. Explore crypto and tokenized stock markets from one place.</p>{enter}<small>Explore freely. Connect when you’re ready.</small></div>
        <div className="oslo-screen-stage" aria-label="Illustrative Oslo interfaces with sample data">
          <div className="oslo-hero-phone oslo-far-left" aria-hidden="true"><div className="oslo-phone-status"><span>9:41</span><i /><span>••• ▰</span></div><div className="oslo-phone-brand">oslo.<small>Open finance.<br />Your decisions.</small></div></div>
          <div className="oslo-side-screen oslo-side-left oslo-hero-phone"><div className="oslo-phone-status" aria-hidden="true"><span>9:41</span><i /><span>••• ▰</span></div><ProductPreview selected={1}/></div>          <div className="oslo-wallet-demo" data-theme="dark">
            <div className="oslo-phone-status" aria-hidden="true"><span>9:41</span><i /><span>••• ▰</span></div>
            <div className="oslo-demo-head"><b>oslo</b><span>Wallet</span><span className="oslo-demo-avatar">O</span></div>

            <div className="oslo-demo-summary">
              <div className="oslo-demo-balance"><span>Estimated portfolio value</span><strong>$12,480.50 <small>USD</small></strong><p>+$284.32 (2.33%) <span>today</span></p></div>
              <div className="oslo-demo-actions"><span>↗<small>Send</small></span><span>↙<small>Receive</small></span><span>⇄<small>Swap</small></span><span>＋<small>Lend</small></span></div>
              <div className="oslo-demo-chart-title"><span>Balance over time</span><span>1H <b>1D</b> 1W 1M</span></div>
              <svg className="oslo-demo-chart" viewBox="0 0 270 90" role="img" aria-label="Illustrative portfolio balance chart"><defs><linearGradient id="oslo-preview-chart" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--blue)" stopOpacity=".35"/><stop offset="1" stopColor="var(--blue)" stopOpacity="0"/></linearGradient></defs><path d="M0 70L12 66 22 71 34 58 43 62 56 50 66 57 78 45 90 51 102 37 115 46 126 40 137 49 149 31 159 37 170 25 181 30 193 18 204 25 216 15 228 19 239 9 250 14 270 5V90H0Z" fill="url(#oslo-preview-chart)"/><path d="M0 70L12 66 22 71 34 58 43 62 56 50 66 57 78 45 90 51 102 37 115 46 126 40 137 49 149 31 159 37 170 25 181 30 193 18 204 25 216 15 228 19 239 9 250 14 270 5" fill="none" stroke="var(--blue-hover)" strokeWidth="2"/></svg>
            </div>
            <div className="oslo-demo-assets"><div><span>Holdings</span><span>All networks</span></div>{[['ETH','Ethereum','1.25 ETH','$3,060.00'],['SOL','Solana','24 SOL','$3,120.00'],['HYPE','HyperCore','60 HYPE','$6,300.50']].map(([name, detail, balance, value]) => <div key={name}><TokenIcon symbol={name} size={25} /><span><b>{name}</b><small>{detail}</small></span><span className="oslo-demo-asset-value"><b>{value}</b><small>{balance}</small></span></div>)}</div>

            <div className="oslo-demo-foot">Illustrative preview · Sample balances</div>
            <div className="oslo-demo-nav"><b>◈<small>Wallet</small></b><span>⇄<small>Swap</small></span><span>≋<small>Perps</small></span><span>＋<small>Lend</small></span></div>

          </div>
<div className="oslo-side-screen oslo-side-right oslo-hero-phone"><div className="oslo-phone-status" aria-hidden="true"><span>9:41</span><i /><span>••• ▰</span></div><ProductPreview selected={2}/></div>
          <div className="oslo-hero-phone oslo-far-right" aria-label="Illustrative Discover screen"><div className="oslo-phone-status" aria-hidden="true"><span>9:41</span><i /><span>••• ▰</span></div><div className="oslo-phone-discover"><b>Discover</b><p>Find your next move.</p><div className="oslo-phone-search">⌕ Search DeFi apps</div>{['Trade crypto & stock markets', 'Borrow against assets', 'Explore ways to earn'].map((goal)=><div className="oslo-phone-goal" key={goal}>{goal}<span>↗</span></div>)}<small>Illustrative preview</small></div></div>
        </div>
        <p className="oslo-stage-caption">One familiar interface. More possibilities. · Illustrative screens</p>
      </section>
      <nav className="oslo-section-nav" aria-label="On this page"><a href="#possibilities">Overview</a><a href="#discover">Discover</a><a href="#community">Ownership</a><a href="#networks">Networks</a><a href="#questions">Questions</a></nav>
      <section className="oslo-overview" id="possibilities"><div className="oslo-section-heading"><span className="oslo-eyebrow">Less scattered. More connected.</span><h2>Your financial world.<br /><span>In one place.</span></h2><p>Put your assets to work, with a clear view of what each market supports.</p></div>
        <div className="oslo-finance-actions" aria-label="What you can do with Oslo">{[
          ['Hold', 'Track supported tokens across your wallets and networks.'],
          ['Trade', 'Buy and sell crypto on Hyperliquid Spot. Explore crypto and stock-linked perpetual markets.'],
          ['Borrow', 'Explore loans against eligible collateral in supported lending markets.'],
          ['Earn', 'Explore lending and staking opportunities for supported assets.'],
        ].map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div><p className="oslo-asset-scope">Stocks here means tokenized stocks or stock-linked markets, not a brokerage account. Ownership rights, collateral eligibility and earning options depend on the asset and provider.</p><div className="oslo-product-grid">{features.map((feature,i)=><article key={feature.name}><div className="oslo-feature-copy"><span className="oslo-eyebrow">0{i+1} / {feature.name}</span><h3>{feature.title}</h3><p>{feature.text}</p></div><ProductPreview selected={i}/></article>)}</div>
      </section>
      <section className="oslo-discover-section" id="discover"><div className="oslo-discover-copy"><span className="oslo-eyebrow">An open door to DeFi</span><h2>Start with a goal.<br /><span>Find your next app.</span></h2><p>Find ways to trade, borrow against eligible assets, or earn. Discover crypto and tokenized-asset apps across networks.</p>{enter}<p className="oslo-fine-print">Aave and Morpho market views are read-only in Oslo. Other apps open their official sites. Transactions and funding may require a network change.</p></div><div className="oslo-discovery-preview" aria-label="Illustrative Discover interface"><header><b>oslo.</b><span>Discover</span></header><div className="oslo-search-preview">⌕ <span>What do you want to do?</span><span>↗</span></div><div className="oslo-search-pills"><span>Lending</span><span>Trading</span><span>All networks</span></div>{[['aave','Aave','Lending · Ethereum, Arbitrum & more'],['morpho','Morpho','Lending · Ethereum & Base'],['hyperliquid','Hyperliquid','Perpetual trading · Hyperliquid']].map(([id,name,detail])=><div className="oslo-discovery-row" key={name}><AppLogo name={name} src={financeApps.find(app => app.id === id)?.logo} /><div><strong>{name}</strong><small>{detail}</small></div><span>↗</span></div>)}<footer>Listings: $20M+ TVL or $2K+ daily revenue<br /><span>Data from DeFiLlama. Activity filters are not a safety endorsement.</span></footer></div></section>
      <section className="oslo-ownership" id="community"><div className="oslo-section-heading"><span className="oslo-eyebrow">Built around you</span><h2>Open finance.<br /><span>Your decisions.</span></h2><p>Accessibility, ownership, and community belong together.</p></div><div className="oslo-principles"><article><span aria-hidden="true">↗</span><h3>Bring your own wallet.</h3><p>Connect a supported wallet or add a public address to follow your assets. Oslo does not ask you to import a recovery phrase.</p></article><article><span aria-hidden="true">◎</span><h3>See it. Then approve it.</h3><p>Review the recipient, asset, and amount before sending. You choose which transactions to approve with your wallet.</p></article><article><span aria-hidden="true">＋</span><h3>Build it together.</h3><p>Useful tools start with the people using them. Share ideas, report issues, or contribute to Oslo’s code.</p><a href="https://github.com/christophorusan/futuresxyz" target="_blank" rel="noopener noreferrer">Explore the project ↗</a></article></div></section>
      <section className="oslo-networks" id="networks"><div className="oslo-section-heading"><span className="oslo-eyebrow">Connected perspectives</span><h2>Many networks.<br /><span>One wallet view.</span></h2><p>Track supported balances across these networks. Add public addresses to keep more of your crypto in view.</p></div><div className="oslo-network-grid">{[['ETH','Ethereum'],['SOL','Solana'],['ARB','Arbitrum'],['HYPE','HyperEVM'],['HYPE','HyperCore'],['BASE','Base'],['OP','Optimism'],['POL','Polygon']].map(([symbol,name])=><div key={name}><TokenIcon symbol={symbol} size={32}/><span>{name}</span></div>)}</div><p className="oslo-network-note">Support varies by action. Payments currently use HyperEVM. Preview cross-chain quotes in Oslo through deBridge; in-app swaps are awaiting activation. NFTs and lending positions in wallet totals are not supported yet.</p></section>
      <section className="oslo-faq" id="questions"><div><span className="oslo-eyebrow">A little clarity</span><h2>Good questions.<br /><span>Straight answers.</span></h2></div><div>{[
        ['What is Oslo?','Oslo brings wallet balances, payments, lending, trading, and DeFi discovery into one interface. Our aim is to make open finance easier to access while keeping your choices in your hands.'],
        ['Do I need to connect a wallet?','You can browse apps and markets without connecting. Add public addresses to track balances, or connect a supported wallet when you want to approve transactions.'],
        ['Can I use every app directly in Oslo?','Hyperliquid trading and HyperLend lending have native interfaces. Aave and Morpho offer read-only market views. Most Discover listings open the provider’s official site. Cross-network transfers are not automatically routed.'],
        ['How are Discover apps selected?','Apps qualify with at least $20 million in TVL or $2,000 in reported daily protocol revenue from DeFiLlama. Known rugged, inactive, or dead-site entries flagged in the feed are excluded. These filters do not guarantee an app is safe.'],
        ['What should I know before using Oslo?','Oslo is not a bank. Network fees may apply, and lending and trading can result in loss of funds. Review each product and transaction before approving.'],
      ].map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
      <section className="oslo-closing"><span className="oslo-wordmark" aria-hidden="true">oslo.</span><h2>More possibility.<br /><span>On your terms.</span></h2><p>Explore open finance with more clarity.</p>{enter}</section>
    </main><footer className="oslo-footer"><a href="#" className="oslo-wordmark">oslo.</a><p>Making finance accessible.</p><a href="#questions">Questions</a><span>© {new Date().getFullYear()} Oslo</span></footer>
  </div>
}
