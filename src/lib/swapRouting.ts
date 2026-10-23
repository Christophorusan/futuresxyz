import { acrossProxy, getAcrossQuote, type AcrossQuote } from './across'
import { debridgeProxy, getDlnQuote, type DlnQuote, type DlnRequest } from './debridge'
export type SwapRoute = { provider: 'debridge'; quote: DlnQuote } | { provider: 'across'; quote: AcrossQuote }
export function rankSwapRoutes(routes: SwapRoute[], now = Date.now()): SwapRoute[] {
  return routes.filter(r => r.quote.expiresAt > now).sort((a, b) => {
    const executable = (r: SwapRoute) => r.provider === 'across' || !!r.quote.tx
    if (executable(a) !== executable(b)) return executable(a) ? -1 : 1
    const left = BigInt(a.quote.output), right = BigInt(b.quote.output)
    return left === right ? 0 : left > right ? -1 : 1
  })
}
export async function getSwapRoutes(request: DlnRequest): Promise<SwapRoute[]> {
  const jobs: Promise<SwapRoute>[] = [getDlnQuote({ ...request, account: debridgeProxy ? request.account : undefined }).then(quote => ({ provider: 'debridge', quote }))]
  if (acrossProxy && request.account) jobs.push(getAcrossQuote({ originChainId: request.from, destinationChainId: request.to, inputToken: request.input, outputToken: request.output, amount: request.amount, depositor: request.account, recipient: request.account }).then(quote => ({ provider: 'across', quote })))
  const results = await Promise.allSettled(jobs)
  const routes = rankSwapRoutes(results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []))
  if (!routes.length) throw new Error('No route available for these assets and amount. Try another pair or amount.')
  return routes
}
