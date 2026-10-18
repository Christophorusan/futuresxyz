import { useEffect } from 'react'
import { createPublicClient, webSocket } from 'viem'
import { hyperEVM } from '../config/wagmi'
import { alchemyApiKey } from '../config/alchemy'

// Keep the HTTP polling path as recovery; subscriptions are a freshness enhancement.
export function useAlchemyBalanceUpdates(enabled: boolean, refresh: () => void) {
  useEffect(() => {
    if (!enabled || !alchemyApiKey) return
    const client = createPublicClient({ chain: hyperEVM, transport: webSocket(
      `wss://hyperliquid-mainnet.g.alchemy.com/v2/${encodeURIComponent(alchemyApiKey)}`,
      { retryCount: 2, reconnect: { attempts: 3, delay: 2000 } },
    ) })
    let stop: (() => void) | undefined
    let lastRefresh = 0
    function visibility() {
      stop?.(); stop = undefined
      if (document.visibilityState !== 'visible') return
      stop = client.watchBlockNumber({ onBlockNumber() {
        if (Date.now() - lastRefresh < 5000) return
        lastRefresh = Date.now(); refresh()
      }, onError() { /* Existing HTTP polling remains active. */ } })
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { stop?.(); document.removeEventListener('visibilitychange', visibility) }
  }, [enabled, refresh])
}
