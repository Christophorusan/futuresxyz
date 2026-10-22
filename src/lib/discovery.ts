export type FinanceCategory = 'lending' | 'perps' | 'swap'
export interface FinanceApp {
  id: string
  name: string
  category: FinanceCategory
  networks: string[]
  description: string
  destination: string
  integrated: boolean
  requirements: string
  keywords: string
}

// Curated destinations, not an exhaustive market ranking or live rate feed.
export const financeApps: FinanceApp[] = [
  { id: 'hyperliquid', name: 'Hyperliquid', category: 'perps', networks: ['Hyperliquid'], description: 'Oslo’s default trading workspace. Explore perpetual markets, orders, and positions.', destination: '/perps', integrated: true, requirements: 'A connected EVM wallet and funds in your Hyperliquid trading account are required to trade.', keywords: 'trade trading btc eth hype bitcoin ethereum long short futures' },
  { id: 'hyperlend', name: 'HyperLend', category: 'lending', networks: ['HyperEVM'], description: 'Supply supported assets or borrow against collateral through Oslo’s lending interface.', destination: '/lending', integrated: true, requirements: 'Requires assets on HyperEVM and HYPE for network fees. Borrowing can lead to liquidation.', keywords: 'lend earn yield borrow usdc usdt hype eth ethereum' },
  { id: 'aave', name: 'Aave', category: 'lending', networks: ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Polygon'], description: 'Explore supply and borrowing markets across supported EVM networks.', destination: 'https://app.aave.com/', integrated: false, requirements: 'Use an EVM wallet on the selected market’s network. Funding or a network switch may be needed. Borrowing can lead to liquidation.', keywords: 'lend earn yield borrow usdc usdt eth ethereum' },
  { id: 'kamino', name: 'Kamino', category: 'lending', networks: ['Solana'], description: 'Explore lending and collateralized borrowing markets on Solana.', destination: 'https://kamino.com/lending', integrated: false, requirements: 'Requires a Solana-compatible wallet, assets on Solana, and SOL for fees. Borrowing can lead to liquidation.', keywords: 'lend earn yield borrow usdc usdt sol' },
  { id: 'gmx', name: 'GMX', category: 'perps', networks: ['Arbitrum', 'Avalanche', 'MegaETH', 'Solana'], description: 'Discover an alternative perpetual exchange and its available trading markets.', destination: 'https://gmx.io/', integrated: false, requirements: 'Review the provider’s supported market, wallet, funding route, and fees. Leveraged positions can be liquidated.', keywords: 'trade trading btc eth bitcoin ethereum long short futures' },
  { id: 'jupiter-perps', name: 'Jupiter Perps', category: 'perps', networks: ['Solana'], description: 'Explore perpetual markets in the Jupiter ecosystem.', destination: 'https://jup.ag/perps', integrated: false, requirements: 'Requires a Solana-compatible wallet and supported collateral. Leveraged positions can be liquidated.', keywords: 'trade trading btc eth sol bitcoin ethereum long short futures' },
  { id: 'jupiter-swap', name: 'Jupiter Swap', category: 'swap', networks: ['Solana'], description: 'Find token swap routes on Solana through Jupiter.', destination: 'https://jup.ag/', integrated: false, requirements: 'Requires a Solana-compatible wallet and tokens on Solana. Review the quote, fees, and minimum received.', keywords: 'exchange buy sell usdc usdt sol eth bitcoin tokens' },
]

const aliases: Record<string, string> = { lend: 'lending', lending: 'lending', borrowing: 'borrow', trading: 'trade', swaps: 'swap', etherum: 'ethereum', eth: 'ethereum', arb: 'arbitrum', sol: 'solana', futures: 'perps' }
const stopWords = new Set(['i', 'want', 'to', 'a', 'an', 'the', 'on', 'with', 'my', 'for', 'in', 'find', 'apps', 'app', 'can', 'where', 'how', 'do', 'crypto', 'finance'])
export function searchFinanceApps(query: string, category = 'all', network = 'all') {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !stopWords.has(t)).map(t => aliases[t] ?? t)
  return financeApps.filter(app => {
    const words = `${app.name} ${app.category} ${app.networks.join(' ')} ${app.description} ${app.keywords}`.toLowerCase()
    return (category === 'all' || category === app.category) && (network === 'all' || app.networks.includes(network)) && terms.every(term => words.includes(term))
  })
}
