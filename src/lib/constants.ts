// HyperEVM Protocol Registry
export interface Protocol {
  name: string
  category: 'lending' | 'dex' | 'staking' | 'stablecoin' | 'vault'
  description: string
  url: string
  tvl?: string
}

export const PROTOCOLS: Protocol[] = [
  { name: 'HyperLend', category: 'lending', description: 'Aave V3 fork — largest lending market on HyperEVM', url: 'https://hyperlend.finance' },
  { name: 'HypurrFi', category: 'lending', description: 'Aave V3 fork with competitive rates', url: 'https://hypurr.fi' },
  { name: 'Felix', category: 'lending', description: 'Morpho Blue fork — isolated lending markets', url: 'https://usefelix.xyz' },
  { name: 'Keiko Finance', category: 'lending', description: 'Lending and borrowing protocol', url: 'https://keiko.finance' },
  { name: 'Sentiment', category: 'lending', description: 'Under-collateralized lending', url: 'https://sentiment.xyz' },
  { name: 'HyperSwap', category: 'dex', description: 'Native DEX of HyperEVM', url: 'https://hyperswap.exchange' },
  { name: 'KittenSwap', category: 'dex', description: 'AMM DEX on HyperEVM', url: 'https://kittenswap.finance' },
  { name: 'Timeswap', category: 'lending', description: 'Oracle-free, fixed-rate lending', url: 'https://timeswap.io' },
  { name: 'Hyperstable', category: 'stablecoin', description: 'Stablecoin protocol on HyperEVM', url: 'https://hyperstable.xyz' },
]
