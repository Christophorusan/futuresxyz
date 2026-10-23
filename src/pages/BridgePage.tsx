import { Link } from 'react-router-dom'
import { DeBridgeSwap } from '../components/bridge/DeBridgeSwap'
import './BridgePage.css'

export function BridgePage() {
  return <main className="bridge-page"><header><div><h1>Swap</h1><p>Choose your assets. Move between networks in one place.</p></div></header>
    <DeBridgeSwap />
    <details className="bridge-bottom-note"><summary>Other swap options</summary><p><Link to="/spot">Hyperliquid Spot ↗</Link> — trade your Hyperliquid balance.</p><p>Same-chain Solana swaps and Solana cross-chain signing are not available inside Oslo yet. <a href="https://jup.ag/" target="_blank" rel="noopener noreferrer">Open Jupiter ↗</a></p><p>HyperEVM receipt is separate from a Hyperliquid trading deposit. <a href="https://app.hyperunit.xyz/deposit" target="_blank" rel="noopener noreferrer">Trading deposit options ↗</a></p></details>
  </main>
}
