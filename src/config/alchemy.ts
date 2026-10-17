import { fallback, http } from 'viem'

// Vite variables are public. Use a domain-restricted browser key, never a management key.
export const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY?.trim() || ''
// Enable only after a successful HyperEVM signer/bundler integration test.
export const smartWalletsEnabled = !!alchemyApiKey && import.meta.env.VITE_ALCHEMY_SMART_WALLETS_ENABLED === 'true'
export const gasPolicyId = import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID?.trim() || ''

export function alchemyTransport(network: string, publicRpc: string) {
  return alchemyApiKey
    ? fallback([
        http(`https://${network}.g.alchemy.com/v2/${encodeURIComponent(alchemyApiKey)}`, { timeout: 8000, retryCount: 1, batch: true }),
        http(publicRpc, { timeout: 8000, retryCount: 1, batch: true }),
      ])
    : http(publicRpc, { batch: true })
}
