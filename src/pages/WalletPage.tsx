import './WalletPage.css'
import { TokenIcon } from '../components/TokenIcon'
import { AlchemyConnection } from '../components/shared/AlchemyConnection'
import { AlchemyHistory } from '../components/shared/AlchemyHistory'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useEvmBalances } from '../hooks/useEvmBalances'
import { ConnectButton } from '../components/shared/ConnectButton'
import { EvmActivity } from '../components/shared/EvmActivity'

const walletAssets = [{symbol:'HYPE',name:'Hyperliquid',type:'Native asset'}, {symbol:'USDC',name:'USD Coin',type:'Stablecoin'}, {symbol:'USDT0',name:'USDT0',type:'Stablecoin'}, {symbol:'USDH',name:'USDH',type:'Stablecoin'}, {symbol:'WHYPE',name:'Wrapped HYPE',type:'Wrapped'}]

export function WalletPage() {
  const { address, isConnected } = useAccount()
  const { balances, isLoading, isError } = useEvmBalances()
  return <main className="lending-page payments-page mobile-wallet-page oslo-wallet-home">
    <header className="payment-hero"><div><span className="payment-eyebrow">OSLO WALLET</span><h1>Your money, at home.</h1><p>A little clarity. A world of possibilities.</p></div><span className="payment-network">HyperEVM</span></header>
    <section className="lending-card wallet-summary">
      <div className="lending-heading"><h2>{isConnected ? 'Connected account' : 'Welcome to Oslo'}</h2><ConnectButton /></div>
      {address ? <p className="evm-address">{address}</p> : <p>Connect a supported wallet to view your HyperEVM assets. Your keys stay in your wallet.</p>}
      <div className="wallet-quick-actions"><Link to="/payments"><span aria-hidden="true">↗</span>Send</Link><Link to="/payments?mode=receive"><span aria-hidden="true">↙</span>Receive</Link><Link to="/spot"><span aria-hidden="true">⇄</span>Swap</Link><Link to="/lending"><span aria-hidden="true">＋</span>Lend</Link></div>
    </section>
    <div className="payment-layout"><section className="lending-card wallet-assets-card">
      <div className="wallet-assets-heading"><div><h2>Your assets</h2><p>One place for your HyperEVM tokens.</p></div><span className="wallet-chain-label">HyperEVM</span></div>
      <div className="wallet-table-heading"><span>Asset</span><span>Balance</span></div>
      {isConnected && isError && <p role="alert">Some balances could not refresh. Available results may be incomplete; reload to retry.</p>}
      <ul className="wallet-asset-list">{walletAssets.map(asset => {
        const balance = balances.find(item => item.symbol === asset.symbol)
        const value = !isConnected ? '—' : isLoading ? 'Loading…' : balance ? Number(balance.balance).toLocaleString(undefined, { maximumSignificantDigits: 8 }) : isError ? 'Unavailable' : '0'
        return <li key={asset.symbol}><TokenIcon symbol={asset.symbol} size={40} /><div className="wallet-token-name"><strong>{asset.name}</strong><small>{asset.symbol} <span>· {asset.type}</span></small></div><span className="wallet-token-balance" title={balance?.balance}>{value}<small>{isConnected ? asset.symbol : 'Not connected'}</small></span></li>
      })}</ul>
      <p className="wallet-assets-note">{isConnected ? 'Supported wallet tokens only. Lending positions and HyperCore balances are separate.' : 'Connect your wallet to see your balances. Your assets stay in your wallet.'}</p>
      {address && <a className="wallet-explorer-link" href={`https://hyperevmscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">View on explorer ↗</a>}
    </section><aside>
      <section className="lending-card"><h2>Explore</h2><div className="wallet-explore"><Link to="/perps"><strong>Perps</strong><span>Hyperliquid trading →</span></Link><Link to="/portfolio"><strong>Portfolio</strong><span>HyperCore account overview →</span></Link></div><p>HyperEVM wallet balances, lending positions and HyperCore trading balances are separate.</p></section>
      <section className="lending-card"><h3>Keep Oslo on your home screen</h3><details><summary>Install on your phone</summary><p>On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open your browser menu and choose Install app or Add to Home screen when available.</p><p>Internet access is required for balances and transactions. In a standalone browser, mobile wallet pairing requires WalletConnect; you can also open this site in your wallet app’s built-in browser.</p></details></section>
    </aside></div><details className="wallet-details"><summary>Activity and connection details</summary><AlchemyConnection /><EvmActivity /><AlchemyHistory address={address} /></details>
  </main>
}
