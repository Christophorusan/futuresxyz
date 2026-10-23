import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DeBridgeSwap } from '../components/bridge/DeBridgeSwap'
import { AcrossSwap } from '../components/bridge/AcrossSwap'
import './BridgePage.css'

export function BridgePage() {
  const [provider, setProvider] = useState<'debridge' | 'across'>('debridge')
  return <main className="bridge-page"><header><div><h1>Bridge</h1><p>Move assets across networks.</p></div><Link to="/spot">Swap on Hyperliquid →</Link></header>
    <nav className="bridge-provider-tabs" aria-label="Cross-chain provider"><button aria-pressed={provider === 'debridge'} onClick={() => setProvider('debridge')}>deBridge</button><button aria-pressed={provider === 'across'} onClick={() => setProvider('across')}>Across</button></nav>
    <div hidden={provider !== 'debridge'}><DeBridgeSwap /></div>
    <div hidden={provider !== 'across'}><AcrossSwap /></div>
    <p className="bridge-bottom-note">Available routes depend on the provider, token and amount. For Hyperliquid trading deposits, choose a route that explicitly supports the trading account—not just HyperEVM. <a href="https://app.hyperunit.xyz/deposit" target="_blank" rel="noopener noreferrer">Hyperliquid deposit options ↗</a></p>
  </main>
}
