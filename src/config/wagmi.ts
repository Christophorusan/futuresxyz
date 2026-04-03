import { http, createConfig } from 'wagmi'
import { mainnet, arbitrum } from 'wagmi/chains'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

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

export const config = createConfig({
  chains: [arbitrum, mainnet, hyperEVM],
  connectors: [
    injected(),
  ],
  transports: {
    [arbitrum.id]: http(),
    [mainnet.id]: http(),
    [hyperEVM.id]: http(),
  },
})
