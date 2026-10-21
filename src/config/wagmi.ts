import { http, createConfig } from 'wagmi'
import { mainnet, arbitrum } from 'wagmi/chains'
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
  chains: [arbitrum, mainnet, hyperEVM, hyperliquidL1],
  connectors: [
    injected(),
    ...(walletConnectProjectId ? [walletConnect({ projectId: walletConnectProjectId, showQrModal: true,
      metadata: { name: 'Oslo', description: 'HyperEVM payments, lending and trading', url: appUrl, icons: [new URL('logo.svg', appUrl).href] },
    })] : []),
  ],
  transports: {
    [arbitrum.id]: alchemyTransport('arb-mainnet', 'https://arb1.arbitrum.io/rpc'),
    [mainnet.id]: alchemyTransport('eth-mainnet', 'https://ethereum-rpc.publicnode.com'),
    [hyperEVM.id]: alchemyTransport('hyperliquid-mainnet', 'https://rpc.hyperliquid.xyz/evm'),
    [hyperliquidL1.id]: http('https://api.hyperliquid.xyz/evm'),
  },
})
