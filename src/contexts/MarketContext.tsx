import { createContext, useContext, useState, type ReactNode } from 'react'

interface MarketContextValue {
  selectedMarket: string
  setSelectedMarket: (market: string) => void
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [selectedMarket, setSelectedMarket] = useState('BTC')

  return (
    <MarketContext.Provider value={{ selectedMarket, setSelectedMarket }}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket must be used within MarketProvider')
  return ctx
}
