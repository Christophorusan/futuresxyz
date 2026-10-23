import { createContext, useContext } from 'react'

export const privyAppId = import.meta.env.VITE_PRIVY_APP_ID?.trim() || ''
export const xLoginEnabled = import.meta.env.VITE_PRIVY_X_ENABLED === 'true'
export const EmailWalletContext = createContext<{
  ready: boolean
  authenticated: boolean
  login: (method: 'email' | 'twitter') => void
  connectWallet: () => void
  logout: () => Promise<void>
  restore: () => Promise<void>
} | null>(null)
export const useEmailWallet = () => useContext(EmailWalletContext)
