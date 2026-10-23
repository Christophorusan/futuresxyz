import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { useUnifiedPortfolio, normalizeAccount, validAccount } from '../hooks/useUnifiedPortfolio'

function usePortfolioState() {
  const { address } = useAccount()
  const [tracked, setTracked] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('oslo-tracked-accounts') ?? '[]')
      return Array.isArray(saved) ? saved.filter((a): a is string => typeof a === 'string' && validAccount(a)) : []
    } catch { return [] }
  })
  const accounts = [...new Set([...(address ? [normalizeAccount(address)] : []), ...tracked.map(normalizeAccount)])].sort()
  const query = useUnifiedPortfolio(accounts)
  const assets = query.data?.assets ?? []
  const incomplete = query.isError || !!query.data?.errors.length
  const unpriced = assets.filter(a => a.value === null).length
  const total = accounts.length && !query.isLoading && query.data && !incomplete ? assets.reduce((sum, a) => sum + (a.value ?? 0), 0) : null
  function saveAccounts(next: string[]) {
    setTracked(next)
    try { localStorage.setItem('oslo-tracked-accounts', JSON.stringify(next)); return true } catch { return false }
  }
  return { ...query, accounts, tracked, saveAccounts, assets, incomplete, unpriced, total }
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
