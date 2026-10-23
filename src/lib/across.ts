import { isAddress, isHex, parseUnits, type Address, type Hex } from 'viem'
export const acrossProxy = (import.meta.env.VITE_ACROSS_PROXY_URL || '').replace(/\/$/, '')
export const bridgeChains = [1, 10, 8453, 42161, 999] as const
export type BridgeToken = { chainId: number; address: Address; symbol: string; decimals: number; name: string }
export type SwapRequest = { originChainId: number; destinationChainId: number; inputToken: BridgeToken; outputToken: BridgeToken; amount: string; depositor: Address; recipient: Address }
export type AcrossQuote = {
  request: SwapRequest; fetchedAt: number; expiresAt: number; amount: string; output: string; minimum: string
  simulationSuccess: boolean; feesUsd: string | null; gasUsd: string | null; seconds: number | null
  tx: { to: Address; data: Hex; value: bigint; chainId: number }
  approval: { token: Address; spender: Address; amount: bigint } | null
}
const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const uint = (value: unknown): value is string => typeof value === 'string' && /^\d+$/.test(value)
const addr = (value: unknown): value is Address => typeof value === 'string' && isAddress(value)
export const isNative = (address: string) => /^(0x0{40}|0xe{40})$/i.test(address)
export function parseTokens(data: unknown): BridgeToken[] {
  if (!Array.isArray(data)) throw new Error('Token list is unavailable.')
  return data.filter((t): t is BridgeToken => !!t && bridgeChains.includes(t.chainId) && addr(t.address) && typeof t.symbol === 'string' && typeof t.name === 'string' && Number.isInteger(t.decimals) && t.decimals >= 0 && t.decimals <= 36)
}
export function inputAmount(request: SwapRequest) {
  if (request.originChainId === request.destinationChainId) throw new Error('Choose different source and destination networks.')
  if (!bridgeChains.includes(request.originChainId as typeof bridgeChains[number]) || !bridgeChains.includes(request.destinationChainId as typeof bridgeChains[number])) throw new Error('Unsupported network.')
  if (!addr(request.depositor) || !addr(request.recipient)) throw new Error('Enter a valid recipient address.')
  if (request.inputToken.chainId !== request.originChainId || request.outputToken.chainId !== request.destinationChainId) throw new Error('Choose tokens on the selected networks.')
  if (!/^\d+(\.\d+)?$/.test(request.amount) || (request.amount.split('.')[1]?.length || 0) > request.inputToken.decimals) throw new Error('Enter an amount within the token precision.')
  const value = parseUnits(request.amount, request.inputToken.decimals)
  if (value <= 0n) throw new Error('Enter an amount greater than zero.')
  return value.toString()
}
export function parseAcrossQuote(data: unknown, request: SwapRequest, now = Date.now()): AcrossQuote {
  const r = obj(data), tx = obj(r.swapTx), input = obj(r.inputToken), output = obj(r.outputToken)
  const amount = inputAmount(request)
  const mismatch = input.chainId !== request.originChainId || output.chainId !== request.destinationChainId || String(input.address).toLowerCase() !== request.inputToken.address.toLowerCase() || String(output.address).toLowerCase() !== request.outputToken.address.toLowerCase()
  if (mismatch || r.inputAmount !== amount || r.maxInputAmount !== amount || r.amountType !== 'exactInput') throw new Error('The quote does not match this transfer. Refresh it.')
  if (!uint(r.expectedOutputAmount) || !uint(r.minOutputAmount) || BigInt(r.minOutputAmount) <= 0n || BigInt(r.expectedOutputAmount) < BigInt(r.minOutputAmount)) throw new Error('No valid output amount was returned.')
  if (tx.chainId !== request.originChainId || !addr(tx.to) || !isHex(tx.data) || tx.data.length < 10 || tx.data.length % 2 !== 0 || typeof tx.simulationSuccess !== 'boolean') throw new Error('The route could not be safely simulated. Check your balance and refresh.')
  const value = tx.value === undefined ? 0n : uint(tx.value) || (typeof tx.value === 'string' && /^0x[\da-f]+$/i.test(tx.value)) ? BigInt(tx.value) : -1n
  if (value < 0n || value > (isNative(request.inputToken.address) ? BigInt(amount) : 0n)) throw new Error('Unexpected native-token value in the quote.')
  const expiry = typeof r.quoteExpiryTimestamp === 'number' ? r.quoteExpiryTimestamp * 1000 : now + 60000
  const expiresAt = Math.min(expiry, now + 60000)
  if (expiresAt <= now) throw new Error('Quote expired. Refresh it.')
  const allowance = obj(obj(r.checks).allowance)
  let approval: AcrossQuote['approval'] = null
  if (!isNative(request.inputToken.address)) {
    if (!addr(allowance.token) || allowance.token.toLowerCase() !== request.inputToken.address.toLowerCase() || !addr(allowance.spender) || !uint(allowance.expected) || allowance.expected !== amount) throw new Error('The token approval could not be verified.')
    approval = { token: allowance.token, spender: allowance.spender, amount: BigInt(amount) }
  }
  if (!tx.simulationSuccess && !(approval && uint(allowance.actual) && BigInt(allowance.actual) < approval.amount)) throw new Error('The route could not be safely simulated. Check your balance and refresh.')
  const fees = obj(r.fees)
  const usd = (v: unknown) => typeof v === 'string' && /^\d+(\.\d+)?$/.test(v) ? v : null
  return { request, simulationSuccess: tx.simulationSuccess, fetchedAt: now, expiresAt, amount, output: r.expectedOutputAmount, minimum: r.minOutputAmount,
    feesUsd: usd(obj(fees.total).amountUsd), gasUsd: usd(obj(fees.originGas).amountUsd), seconds: typeof r.expectedFillTime === 'number' && r.expectedFillTime > 0 ? r.expectedFillTime : null,
    tx: { to: tx.to, data: tx.data, value, chainId: request.originChainId }, approval }
}
export async function acrossGet(path: string, query = new URLSearchParams(), signal?: AbortSignal): Promise<unknown> {
  if (!acrossProxy) throw new Error('Across is not enabled in Oslo yet.')
  const base = new URL(acrossProxy)
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname))) throw new Error('Across server must use HTTPS.')
  const response = await fetch(`${acrossProxy}/${path}?${query}`, { signal: signal ?? AbortSignal.timeout(20000), credentials: 'omit' })
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many quote requests. Please wait and retry.' : 'Across could not return this route. Check the amount, balance, and networks.')
  return response.json()
}
export async function getAcrossQuote(request: SwapRequest, signal?: AbortSignal) {
  const query = new URLSearchParams({ originChainId: String(request.originChainId), destinationChainId: String(request.destinationChainId), inputToken: request.inputToken.address, outputToken: request.outputToken.address, amount: inputAmount(request), depositor: request.depositor, recipient: request.recipient })
  return parseAcrossQuote(await acrossGet('quote', query, signal), request)
}
export function assertFresh(quote: AcrossQuote, account: string | undefined, now = Date.now()) {
  if (!account || account.toLowerCase() !== quote.request.depositor.toLowerCase()) throw new Error('Wallet changed. Request a new quote.')
  if (now >= quote.expiresAt) throw new Error('Quote expired. Request a new quote.')
}
