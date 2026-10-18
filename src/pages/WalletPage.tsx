import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useEvmBalances } from '../hooks/useEvmBalances'
import { ConnectButton } from '../components/shared/ConnectButton'
import { EvmActivity } from '../components/shared/EvmActivity'

export function WalletPage() {
  const { address, isConnected } = useAccount()
  const { balances, isLoading, isError } = useEvmBalances()
  return <main className="lending-page payments-page mobile-wallet-page">
    <header className="payment-hero"><div><span className="payment-eyebrow">FUTURESXYZ WALLET</span><h1>Your wallet, on the go.</h1><p>Payments, balances and lending in one mobile workspace.</p></div><span className="payment-network">HyperEVM · Chain 999</span></header>
    <section className="lending-card wallet-summary">
      <div className="lending-heading"><h2>{isConnected ? 'Connected account' : 'Bring your wallet'}</h2><ConnectButton /></div>
      {address ? <p className="evm-address">{address}</p> : <p>Connect a supported wallet to view your HyperEVM assets. Your keys stay in your wallet.</p>}
      <div className="wallet-quick-actions"><Link to="/payments"><span aria-hidden="true">↗</span>Send</Link><Link to="/payments?mode=receive"><span aria-hidden="true">↙</span>Receive</Link><Link to="/lending"><span aria-hidden="true">＋</span>Lending</Link></div>
    </section>
    <div className="payment-layout"><section className="lending-card"><h2>HyperEVM assets</h2><p>HYPE, WHYPE, USDC, USDT0 and USDH held by your connected wallet. Other tokens and protocol positions are not included.</p>
      {!isConnected ? <p>Connect your wallet to load balances.</p> : <>
        {isLoading && <p role="status">Loading balances…</p>}
        {isError && <p role="alert">Some balances could not refresh. Available results may be incomplete; retry by reloading the page.</p>}
        {!isLoading && !isError && balances.length === 0 && <p>No balance found for these supported assets on HyperEVM.</p>}
        <ul className="wallet-asset-list">{balances.map(asset => <li key={asset.symbol}><span className="wallet-asset-icon" aria-hidden="true">{asset.symbol.slice(0,1)}</span><strong>{asset.symbol}</strong><span title={asset.balance}>{asset.balance}</span></li>)}</ul>
        {address && <a href={`https://hyperevmscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">View all onchain activity ↗</a>}
      </>}
    </section><aside>
      <section className="lending-card"><h2>Explore</h2><div className="wallet-explore"><Link to="/perps"><strong>Perps</strong><span>Hyperliquid trading →</span></Link><Link to="/1000x-perps"><strong>1000x Perps</strong><span>Open Papertrade markets →</span></Link><Link to="/portfolio"><strong>Portfolio</strong><span>HyperCore account overview →</span></Link></div><p>HyperEVM wallet balances, lending positions and HyperCore trading balances are separate.</p></section>
      <section className="lending-card"><h3>Keep Futuresxyz on your home screen</h3><details><summary>Install on your phone</summary><p>On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open your browser menu and choose Install app or Add to Home screen when available.</p><p>Internet access is required for balances and transactions. In a standalone browser, mobile wallet pairing requires WalletConnect; you can also open this site in your wallet app’s built-in browser.</p></details></section>
    </aside></div><EvmActivity />
  </main>
}
