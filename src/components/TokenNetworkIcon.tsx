import { TokenIcon } from './TokenIcon'
import './TokenNetworkIcon.css'

const chainIcons: Record<string, { name: string; symbol: string; logo?: string }> = {
  'eth-mainnet': { name: 'Ethereum', symbol: 'ETH' },
  'arb-mainnet': { name: 'Arbitrum', symbol: 'ARB' },
  'base-mainnet': { name: 'Base', symbol: 'BASE', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' },
  'opt-mainnet': { name: 'Optimism', symbol: 'OP' },
  'matic-mainnet': { name: 'Polygon', symbol: 'POL' },
  'hyperliquid-mainnet': { name: 'HyperEVM', symbol: 'HYPE' },
  'solana-mainnet': { name: 'Solana', symbol: 'SOL' },
  HyperCore: { name: 'HyperCore', symbol: 'HYPE' },
}

export function TokenNetworkIcon({ symbol, logo, network }: { symbol: string; logo?: string; network: string }) {
  const chain = chainIcons[network]
  return <span className="token-network-icon">
    <TokenIcon symbol={symbol} logo={logo} preferLogo fallback="icon" size={40}/>
    {chain && <span className="token-network-badge" role="img" aria-label={`${chain.name} network`} title={chain.name}>
      <span aria-hidden="true"><TokenIcon symbol={chain.symbol} logo={chain.logo} preferLogo fallback="icon" size={16}/></span>
    </span>}
  </span>
}
