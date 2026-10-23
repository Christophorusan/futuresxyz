import { isAddress, isHex, parseUnits, type Address, type Hex } from 'viem'
export const debridgeProxy = (import.meta.env.VITE_DEBRIDGE_PROXY_URL || '').replace(/\/$/, '')
// DLN internal IDs are not always the wallet's EVM chain ID.
export const dlnChains = [
  { id: 42161, apiId: 42161, name: 'Arbitrum', native: 'ETH' },
  { id: 1, apiId: 1, name: 'Ethereum', native: 'ETH' },
  { id: 8453, apiId: 8453, name: 'Base', native: 'ETH' },
  { id: 10, apiId: 10, name: 'Optimism', native: 'ETH' },
  { id: 999, apiId: 100000022, name: 'HyperEVM', native: 'HYPE' },
]
export type DlnToken = { chainId: number; address: Address; symbol: string; name: string; decimals: number; logo?: string }
export type DlnRequest = { from: number; to: number; input: DlnToken; output: DlnToken; amount: string; account?: Address }
export type DlnQuote = {
  request: DlnRequest; expiresAt: number; amount: string; output: string; fixFee: string; gas: string | null; seconds: number | null; priceImpact: number | null
  orderId: string | null; tx: { to: Address; data: Hex; value: bigint } | null
}
const obj = (x: unknown): Record<string, unknown> => x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : {}
const uint = (x: unknown): x is string => typeof x === 'string' && /^\d{1,78}$/.test(x) && BigInt(x) < 2n ** 256n
export const dlnNative = (address: string) => /^0x0{40}$/i.test(address)
export function dlnChain(id: number) { const chain = dlnChains.find(c => c.id === id); if (!chain) throw new Error('Unsupported network.'); return chain }
export function dlnTokens(data: unknown, chainId: number): DlnToken[] {
  dlnChain(chainId)
  return Object.values(obj(obj(data).tokens)).flatMap(value => {
    const t = obj(value)
    if (typeof t.address !== 'string' || !isAddress(t.address) || typeof t.symbol !== 'string' || typeof t.name !== 'string' || !Number.isInteger(t.decimals) || Number(t.decimals) < 0 || Number(t.decimals) > 36) return []
    return [{ chainId, address: t.address as Address, symbol: t.symbol, name: t.name, decimals: Number(t.decimals), logo: typeof t.logoURI === 'string' && t.logoURI.startsWith('https://') ? t.logoURI : undefined }]
  })
}
export function dlnAmount(r: DlnRequest) {
  dlnChain(r.from); dlnChain(r.to)
  if (r.from === r.to || r.input.chainId !== r.from || r.output.chainId !== r.to) throw new Error('Choose assets on different networks.')
  if (!isAddress(r.input.address) || !isAddress(r.output.address) || (r.account && !isAddress(r.account))) throw new Error('Invalid wallet or token address.')
  if (!/^\d+(\.\d+)?$/.test(r.amount) || (r.amount.split('.')[1]?.length || 0) > r.input.decimals) throw new Error('Enter a valid amount within the token precision.')
  const amount = parseUnits(r.amount, r.input.decimals)
  if (amount <= 0n || amount >= 2n ** 256n) throw new Error('Enter an amount greater than zero and within the token limit.')
  return amount.toString()
}
export function dlnQuery(r: DlnRequest) {
  const query = new URLSearchParams({ srcChainId: String(dlnChain(r.from).apiId), dstChainId: String(dlnChain(r.to).apiId), srcChainTokenIn: r.input.address, dstChainTokenOut: r.output.address, srcChainTokenInAmount: dlnAmount(r), dstChainTokenOutAmount: 'auto', prependOperatingExpenses: 'false' })
  if (r.account) for (const key of ['senderAddress', 'srcChainOrderAuthorityAddress', 'dstChainOrderAuthorityAddress', 'dstChainTokenOutRecipient', 'srcAllowedCancelBeneficiary']) query.set(key, r.account)
  return query
}
export async function dlnGet(path: string, query = new URLSearchParams(), signal?: AbortSignal): Promise<unknown> {
  const base = debridgeProxy || 'https://dln.debridge.finance/v1.0'
  const url = new URL(base)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Swap server must use HTTPS.')
  const response = await fetch(`${base}/${path}?${query}`, { credentials: 'omit', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many requests. Please wait and retry.' : 'This route is unavailable. Try another amount or asset.')
  return response.json()
}
export function parseDlnQuote(data: unknown, request: DlnRequest, startedAt = Date.now()): DlnQuote {
  const r = obj(data), estimation = obj(r.estimation), input = obj(estimation.srcChainTokenIn), output = obj(estimation.dstChainTokenOut), tx = obj(r.tx)
  const amount = dlnAmount(request)
  if (input.chainId !== dlnChain(request.from).apiId || output.chainId !== dlnChain(request.to).apiId || String(input.address).toLowerCase() !== request.input.address.toLowerCase() || String(output.address).toLowerCase() !== request.output.address.toLowerCase() || input.decimals !== request.input.decimals || output.decimals !== request.output.decimals || input.amount !== amount) throw new Error('Quote does not match your transfer. Refresh it.')
  if (!uint(output.amount) || BigInt(output.amount) <= 0n || !uint(r.fixFee)) throw new Error('Invalid quote amounts.')
  let transaction: DlnQuote['tx'] = null
  if (request.account) {
    // Published DLN source/router deployments on the supported EVM networks.
    const contracts = ['0xef4fb24ad0916217251f553c0596f8edc630eb66', '0x663dc15d3c1ac63ff12e45ab68fea3f0a883c251']
    if (typeof tx.to !== 'string' || !contracts.includes(tx.to.toLowerCase()) || !isHex(tx.data) || tx.data.length < 10 || tx.data.length % 2 !== 0 || !uint(tx.value) || !/^0x[\da-f]{64}$/i.test(String(r.orderId))) throw new Error('Invalid route transaction.')
    const expectedValue = BigInt(r.fixFee) + (dlnNative(request.input.address) ? BigInt(amount) : 0n)
    if (BigInt(tx.value) !== expectedValue) throw new Error('Unexpected native-token charge. Refresh your quote.')
    transaction = { to: tx.to as Address, data: tx.data, value: BigInt(tx.value) }
  }
  const seconds = obj(r.order).approximateFulfillmentDelay
  return { request, expiresAt: startedAt + 30000, amount, output: output.amount, fixFee: r.fixFee, gas: uint(obj(r.estimatedTransactionFee).total) ? String(obj(r.estimatedTransactionFee).total) : null,
    seconds: typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? seconds : null, priceImpact: typeof r.usdPriceImpact === 'number' && Number.isFinite(r.usdPriceImpact) ? r.usdPriceImpact : null,
    orderId: transaction ? String(r.orderId) : null, tx: transaction }
}
export async function getDlnQuote(request: DlnRequest) {
  const startedAt = Date.now()
  return parseDlnQuote(await dlnGet('dln/order/create-tx', dlnQuery(request)), request, startedAt)
}
export function assertDlnFresh(q: DlnQuote, account: string | undefined, now = Date.now()) {
  if (!q.request.account || !account || q.request.account.toLowerCase() !== account.toLowerCase()) throw new Error('Wallet changed. Get a new quote.')
  if (now >= q.expiresAt) throw new Error('Quote expired. Get a new quote.')
  if (!q.tx) throw new Error('Get a new quote with your wallet connected.')
}
export function dlnStatus(status: unknown) {
  if (['Fulfilled', 'SentUnlock', 'ClaimedUnlock'].includes(String(status))) return 'Delivered — deBridge confirms the destination transfer.'
  if (status === 'ClaimedOrderCancel') return 'Cancelled — deBridge reports source funds were returned.'
  if (['OrderCancelled', 'SentOrderCancel'].includes(String(status))) return 'Cancellation in progress. Source refund is not confirmed yet.'
  if (status === 'Created') return 'Source order created. Waiting for destination delivery.'
  return 'Delivery not confirmed yet. Check again or open order details.'
}

export function availableDlnRoute(chains: number[], from: number, to: number) {
  if (chains.length < 2) throw new Error('At least two networks are required.')
  const source = chains.includes(from) ? from : chains[0]
  const destination = chains.includes(to) && to !== source ? to : chains.find(id => id !== source)!
  return { from: source, to: destination }
}
export type DlnTransfer = { hash: string; chain: number; orderId: string; status: string; sourceStatus?: 'pending' | 'confirmed' | 'reverted' }
export function restoreDlnTransfer(raw: string | null): DlnTransfer | null {
  try {
    const saved = obj(JSON.parse(raw || 'null'))
    if (!/^0x[\da-f]{64}$/i.test(String(saved.hash)) || !/^0x[\da-f]{64}$/i.test(String(saved.orderId)) || !dlnChains.some(c => c.id === saved.chain)) return null
    const sourceStatus = saved.sourceStatus === 'reverted' ? 'reverted' : saved.sourceStatus === 'confirmed' ? 'confirmed' : 'pending'
    return { hash: String(saved.hash), chain: Number(saved.chain), orderId: String(saved.orderId), sourceStatus,
      status: sourceStatus === 'reverted' ? 'Source transaction reverted. No swap completed.' : 'Saved transfer. Check its delivery status below.' }
  } catch { return null }
}
