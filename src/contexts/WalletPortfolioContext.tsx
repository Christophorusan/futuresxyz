import { portfolioValue } from '../lib/portfolioValue'
import { createContext, useContext, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { useUnifiedPortfolio, normalizeAccount } from '../hooks/useUnifiedPortfolio'

function usePortfolioState() {
  const { address } = useAccount()
  const accounts = address ? [normalizeAccount(address)] : []
  const query = useUnifiedPortfolio(accounts)
  const assets = query.data?.assets ?? []
  const incomplete = query.isError || !!query.data?.errors.length
  const unpriced = assets.filter(a => a.value === null).length
  const total = portfolioValue(accounts.length > 0, query.data?.assets, incomplete)
  return { ...query, accounts, assets, incomplete, unpriced, total }
}
const WalletPortfolioContext = createContext<ReturnType<typeof usePortfolioState> | null>(null)
export function WalletPortfolioProvider({ children }: { children: ReactNode }) {
  return <WalletPortfolioContext.Provider value={usePortfolioState()}>{children}</WalletPortfolioContext.Provider>
}
export function useWalletPortfolio() {
  const value = useContext(WalletPortfolioContext)
  if (!value) throw new Error('WalletPortfolioProvider is required')
  return value
}
