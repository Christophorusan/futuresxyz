import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { HttpTransport, ExchangeClient } from '@nktkas/hyperliquid'
import { USE_TESTNET } from '../config/hyperliquid'

const AGENT_KEY_STORAGE = 'hl-agent-key-v3'
const AGENT_APPROVED_STORAGE = 'hl-agent-approved-v3'

const transport = new HttpTransport({ isTestnet: USE_TESTNET })

/**
 * Agent wallet pattern for Hyperliquid:
 * 1. Generate an ephemeral keypair (stored in localStorage)
 * 2. User signs approveAgent once with their browser wallet (chainId 42161)
 * 3. All trades signed by agent key (chainId 1337, no browser prompt)
 */
export function useAgentWallet() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [agentApproved, setAgentApproved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get or generate agent private key (per user address)
  const agentKey = useMemo(() => {
    if (!address) return null
    const storageKey = `${AGENT_KEY_STORAGE}-${address.toLowerCase()}`
    let key = localStorage.getItem(storageKey)
    if (!key) {
      key = generatePrivateKey()
      localStorage.setItem(storageKey, key)
    }
    return key as `0x${string}`
  }, [address])

  // Create agent account from private key
  const agentAccount = useMemo(() => {
    if (!agentKey) return null
    return privateKeyToAccount(agentKey)
  }, [agentKey])

  // Create ExchangeClient with agent wallet (signs with chainId 1337 - works!)
  const agentExchange = useMemo(() => {
    if (!agentAccount) return null
    try {
      return new ExchangeClient({ wallet: agentAccount, transport })
    } catch (e) {
      console.error('Failed to create agent ExchangeClient:', e)
      return null
    }
  }, [agentAccount])

  // Create ExchangeClient with browser wallet (only for approveAgent)
  const browserExchange = useMemo(() => {
    if (!walletClient) return null
    try {
      return new ExchangeClient({ wallet: walletClient, transport })
    } catch (e) {
      console.error('Failed to create browser ExchangeClient:', e)
      return null
    }
  }, [walletClient])

  // Check if agent is already approved — check on-chain, not just localStorage
  useEffect(() => {
    if (!address || !agentAccount) {
      setAgentApproved(false)
      return
    }

    // First check localStorage (fast)
    const key = `${AGENT_APPROVED_STORAGE}-${address.toLowerCase()}-${agentAccount.address.toLowerCase()}`
    if (localStorage.getItem(key) === 'true') {
      setAgentApproved(true)
      return
    }

    // Then check on-chain
    const checkOnChain = async () => {
      try {
        const info = new (await import('@nktkas/hyperliquid')).InfoClient({
          transport: new (await import('@nktkas/hyperliquid')).HttpTransport({ isTestnet: USE_TESTNET })
        })
        const agents = await info.extraAgents({ user: address as `0x${string}` }) as Array<{ address: string; name: string }>
        const found = agents.some(a => a.address.toLowerCase() === agentAccount.address.toLowerCase())
        if (found) {
          localStorage.setItem(key, 'true')
          setAgentApproved(true)
        }
      } catch {
        // Ignore — will show Enable Trading button
      }
    }
    checkOnChain()
  }, [address, agentAccount])

  // Approve agent — user signs once with browser wallet
  const approveAgent = useCallback(async () => {
    if (!browserExchange || !agentAccount || !address) {
      setError('Wallet not connected. Make sure you are on Arbitrum.')
      return
    }

    try {
      setApproving(true)
      setError(null)

      // Check if agent already approved on-chain
      const hl = await import('@nktkas/hyperliquid')
      const infoClient = new hl.InfoClient({ transport })
      const agents = await infoClient.extraAgents({ user: address as `0x${string}` }) as Array<{ address: string }>
      const alreadyApproved = agents.some(a => a.address.toLowerCase() === agentAccount.address.toLowerCase())

      if (!alreadyApproved) {
        await browserExchange.approveAgent({
          agentAddress: agentAccount.address,
          agentName: 'futuresxyz',
        })
      }

      // Approve builder fee if not approved or approved at lower rate
      try {
        const { BUILDER_ADDRESS, BUILDER_FEE } = await import('../config/hyperliquid')
        const maxFee = await infoClient.maxBuilderFee({ user: address as `0x${string}`, builder: BUILDER_ADDRESS })
        if (Number(maxFee) < BUILDER_FEE) {
          const feePercent = `${(BUILDER_FEE / 1000).toFixed(2)}%` as `${string}%`
          await browserExchange.approveBuilderFee({ maxFeeRate: feePercent, builder: BUILDER_ADDRESS })
        }
      } catch (e) {
        console.warn('Builder fee approval skipped:', e)
      }

      // Mark as approved
      const key = `${AGENT_APPROVED_STORAGE}-${address.toLowerCase()}-${agentAccount.address.toLowerCase()}`
      localStorage.setItem(key, 'true')
      setAgentApproved(true)
    } catch (e) {
      console.error('Failed to approve agent:', e)
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('rejected') || msg.includes('denied')) {
        setError('Signature rejected by wallet.')
      } else if (msg.includes('chainId')) {
        setError('Switch your wallet to Arbitrum One, then try again.')
      } else {
        setError(`Approval failed: ${msg.slice(0, 100)}`)
      }
    } finally {
      setApproving(false)
    }
  }, [browserExchange, agentAccount, address])

  return {
    // The exchange client to use for ALL trading (orders, cancels, etc.)
    exchange: agentApproved ? agentExchange : null,
    // For approving agent + builder fee
    browserExchange,
    agentAddress: agentAccount?.address ?? null,
    agentApproved,
    approving,
    error,
    approveAgent,
    isConnected,
    address,
  }
}
