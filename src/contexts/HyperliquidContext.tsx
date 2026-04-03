import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { HttpTransport, InfoClient, ExchangeClient } from '@nktkas/hyperliquid'
import { USE_TESTNET } from '../config/hyperliquid'
import { useAgentWallet } from '../hooks/useAgentWallet'
import { arbitrum } from 'wagmi/chains'

interface HyperliquidContextValue {
  info: InfoClient
  exchange: ExchangeClient | null       // Agent exchange for trading
  browserExchange: ExchangeClient | null // Browser wallet for approvals
  isConnected: boolean
  address: string | undefined
  agentApproved: boolean
  approving: boolean
  approvalError: string | null
  approveAgent: () => Promise<void>
  switchToArbitrum: () => void
}

const HyperliquidContext = createContext<HyperliquidContextValue | null>(null)

const transport = new HttpTransport({ isTestnet: USE_TESTNET })

export function HyperliquidProvider({ children }: { children: ReactNode }) {
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const agent = useAgentWallet()

  const info = useMemo(() => new InfoClient({ transport }), [])

  const switchToArbitrum = () => {
    if (chainId !== arbitrum.id) {
      switchChain({ chainId: arbitrum.id })
    }
  }

  return (
    <HyperliquidContext.Provider value={{
      info,
      exchange: agent.exchange,
      browserExchange: agent.browserExchange,
      isConnected: agent.isConnected,
      address: agent.address,
      agentApproved: agent.agentApproved,
      approving: agent.approving,
      approvalError: agent.error,
      approveAgent: agent.approveAgent,
      switchToArbitrum,
    }}>
      {children}
    </HyperliquidContext.Provider>
  )
}

export function useHyperliquid() {
  const ctx = useContext(HyperliquidContext)
  if (!ctx) throw new Error('useHyperliquid must be used within HyperliquidProvider')
  return ctx
}
