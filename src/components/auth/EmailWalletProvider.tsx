import type { ReactNode } from 'react'
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth'
import { WagmiProvider, useSetActiveWallet } from '@privy-io/wagmi'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { arbitrum, mainnet, base, optimism } from 'wagmi/chains'
import { config, hyperEVM } from '../../config/wagmi'
import { EmailWalletContext, privyAppId, xLoginEnabled } from '../../contexts/EmailWalletContext'

function Session({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, connectWallet } = usePrivy()
  const { wallets } = useWallets()
  const { setActiveWallet } = useSetActiveWallet()
  return <EmailWalletContext.Provider value={{ ready, authenticated, login: method => login({ loginMethods: [method] }), logout, connectWallet,
    restore: async () => {
      const wallet = wallets.find(wallet => wallet.walletClientType === 'privy')
      if (!wallet) throw new Error('Your wallet is still loading. Please try again shortly.')
      await setActiveWallet(wallet)
    },
  }}>{children}</EmailWalletContext.Provider>
}

export default function EmailWalletProvider({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }) {
  return <PrivyProvider appId={privyAppId} config={{
    loginMethods: xLoginEnabled ? ['email', 'twitter'] : ['email'],
    appearance: { theme: 'dark', accentColor: '#4c80f1', walletChainType: 'ethereum-only' },
    defaultChain: hyperEVM,
    supportedChains: [hyperEVM, arbitrum, mainnet, base, optimism],
    embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
  }}><QueryClientProvider client={queryClient}><WagmiProvider config={config}><Session>{children}</Session></WagmiProvider></QueryClientProvider></PrivyProvider>
}
