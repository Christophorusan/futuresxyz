import { http, createConfig } from 'wagmi'
import { mainnet, arbitrum, base, optimism } from 'wagmi/chains'
import { defineChain } from 'viem'
import { alchemyTransport } from './alchemy'
import { injected, walletConnect } from 'wagmi/connectors'

export const hyperEVM = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: { name: 'HyperScan', url: 'https://hyperscan.xyz' },
  },
})

// Hyperliquid L1 signing chain — required for order signing
export const hyperliquidL1 = defineChain({
  id: 1337,
  name: 'Hyperliquid L1',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.hyperliquid.xyz/evm'] },
  },
})

export const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim() || ''
const appUrl = new URL(import.meta.env.BASE_URL, typeof window === 'undefined' ? 'https://christophorusan.github.io' : window.location.origin).href

export const config = createConfig({
  chains: [arbitrum, mainnet, base, optimism, hyperEVM, hyperliquidL1],
  multiInjectedProviderDiscovery: !import.meta.env.VITE_PRIVY_APP_ID?.trim(),
  connectors: import.meta.env.VITE_PRIVY_APP_ID?.trim() ? [] : [
    injected(),
    ...(walletConnectProjectId ? [walletConnect({ projectId: walletConnectProjectId, showQrModal: true,
      metadata: { name: 'Oslo', description: 'One place for your digital assets', url: appUrl, icons: [new URL('logo.svg', appUrl).href] },
    })] : []),
  ],
  transports: {
    [base.id]: alchemyTransport('base-mainnet', 'https://mainnet.base.org'),
    [optimism.id]: alchemyTransport('opt-mainnet', 'https://mainnet.optimism.io'),
    [arbitrum.id]: alchemyTransport('arb-mainnet', 'https://arb1.arbitrum.io/rpc'),
    [mainnet.id]: alchemyTransport('eth-mainnet', 'https://ethereum-rpc.publicnode.com'),
    [hyperEVM.id]: alchemyTransport('hyperliquid-mainnet', 'https://rpc.hyperliquid.xyz/evm'),
    [hyperliquidL1.id]: http('https://api.hyperliquid.xyz/evm'),
  },
})
