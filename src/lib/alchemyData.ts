import { isAddress, type Address } from 'viem'
import { alchemyApiKey } from '../config/alchemy'

export async function alchemyRead<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
  if (!alchemyApiKey) throw new Error('Alchemy is not configured.')
  // Only read methods belong in this client. Wallet submission uses the reviewed wallet flow.
  if (!['eth_chainId', 'eth_blockNumber', 'alchemy_getAssetTransfers'].includes(method)) throw new Error('Unsupported read method.')
  try {
    const response = await fetch(`https://hyperliquid-mainnet.g.alchemy.com/v2/${encodeURIComponent(alchemyApiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error('Request failed')
    const data = await response.json()
    if (data.error || data.result === undefined) throw new Error('Unavailable')
    return data.result as T
  } catch {
    // Never surface provider errors containing endpoint credentials.
    throw new Error('Alchemy data is unavailable. Check network access, app permissions and usage limits.')
  }
}

export type Transfer = { id: string; hash: string; from: string; to: string; asset: string; amount: string; contract: string | null }
export function parseTransfers(data: unknown): { transfers: Transfer[]; pageKey?: string } {
  if (!data || typeof data !== 'object' || !('transfers' in data) || !Array.isArray(data.transfers)) throw new Error('Invalid transfer response.')
  const transfers: Transfer[] = data.transfers.map((t: unknown) => {
    if (!t || typeof t !== 'object') throw new Error('Invalid transfer.')
    const v = t as Record<string, unknown>
    if (typeof v.hash !== 'string' || !/^0x[\da-f]{64}$/i.test(v.hash) || typeof v.uniqueId !== 'string' || typeof v.from !== 'string' || !isAddress(v.from) || typeof v.to !== 'string' || !isAddress(v.to)) throw new Error('Invalid transfer.')
    const raw = v.rawContract as Record<string, unknown> | undefined
    const contract = typeof raw?.address === 'string' && isAddress(raw.address) ? raw.address : null
    return { id: v.uniqueId, hash: v.hash, from: v.from, to: v.to, asset: typeof v.asset === 'string' ? v.asset.slice(0, 32) : 'Unknown token', amount: typeof v.value === 'number' && Number.isFinite(v.value) ? `≈ ${v.value}` : 'Amount unavailable', contract }
  })
  const pageKey = 'pageKey' in data && typeof data.pageKey === 'string' && data.pageKey ? data.pageKey : undefined
  return { transfers, pageKey }
}
export async function getTransfers(address: Address, direction: 'incoming' | 'outgoing', pageKey?: string, signal?: AbortSignal) {
  if (!isAddress(address)) throw new Error('Invalid account.')
  return parseTransfers(await alchemyRead('alchemy_getAssetTransfers', [{ fromBlock: '0x0', toBlock: 'latest',
    [direction === 'incoming' ? 'toAddress' : 'fromAddress']: address,
    category: ['external', 'erc20'], order: 'desc', maxCount: '0x14', excludeZeroValue: true,
    ...(pageKey ? { pageKey } : {}),
  }], signal))
}
