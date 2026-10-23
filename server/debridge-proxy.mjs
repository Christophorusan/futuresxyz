import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

const chains = new Set(['1', '10', '8453', '42161', '100000022'])
const address = /^0x[\da-fA-F]{40}$/
export function upstreamRequest(path, params, apiKey) {
  if (!apiKey) throw new Error('Missing API key')
  const query = new URLSearchParams(params)
  if (path === '/supported-chains') {
    if (params.size) throw new Error('Unexpected parameters')
  } else if (path === '/token-list') {
    if (params.size !== 1 || !chains.has(params.get('chainId'))) throw new Error('Invalid network')
  } else if (path === '/dln/order/create-tx') {
    const required = ['srcChainId', 'dstChainId', 'srcChainTokenIn', 'dstChainTokenOut', 'srcChainTokenInAmount', 'dstChainTokenOutAmount', 'prependOperatingExpenses']
    const authorities = ['senderAddress', 'srcChainOrderAuthorityAddress', 'dstChainOrderAuthorityAddress', 'dstChainTokenOutRecipient', 'srcAllowedCancelBeneficiary']
    if ([...params.keys()].some(k => ![...required, ...authorities].includes(k)) || required.some(k => params.getAll(k).length !== 1)) throw new Error('Invalid parameters')
    if (!chains.has(params.get('srcChainId')) || !chains.has(params.get('dstChainId')) || params.get('srcChainId') === params.get('dstChainId')) throw new Error('Invalid route')
    for (const key of ['srcChainTokenIn', 'dstChainTokenOut']) if (!address.test(params.get(key) || '')) throw new Error('Invalid token')
    const amount = params.get('srcChainTokenInAmount') || ''
    if (!/^\d{1,78}$/.test(amount) || BigInt(amount) <= 0n || BigInt(amount) >= 2n ** 256n) throw new Error('Invalid amount')
    if (params.get('dstChainTokenOutAmount') !== 'auto' || params.get('prependOperatingExpenses') !== 'false') throw new Error('Invalid quote mode')
    if (authorities.some(k => params.has(k))) {
      if (authorities.some(k => params.getAll(k).length !== 1 || !address.test(params.get(k) || '') || params.get(k).toLowerCase() !== params.get('senderAddress')?.toLowerCase())) throw new Error('Authorities must match connected wallet')
    }
  } else if (/^\/dln\/order\/0x[\da-fA-F]{64}\/status$/.test(path)) {
    if (params.size) throw new Error('Unexpected parameters')
  } else throw new Error('Unsupported endpoint')
  // Documented DLN authentication parameter. Never expose/log this URL.
  query.set('accesstoken', apiKey)
  return `https://dln.debridge.finance/v1.0${path}?${query}`
}

export function createDeBridgeServer(env = process.env, fetcher = fetch) {
  const origins = new Set((env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean))
  const requests = new Map()
  return createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)) }
    const origin = req.headers.origin
    if (!origin || !origins.has(origin)) return send(403, { error: 'Origin not allowed' })
    res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin')
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); res.writeHead(204); res.end(); return }
    if (req.method !== 'GET') return send(405, { error: 'Method not allowed' })
    if ((req.url || '').length > 1800) return send(400, { error: 'Request too long' })
    if (!env.DEBRIDGE_API_KEY) return send(503, { error: 'deBridge is not configured' })
    const now = Date.now(), ip = req.socket.remoteAddress || 'unknown'
    if (requests.size >= 10000) for (const [key, value] of requests) if (now - value.start > 60000) requests.delete(key)
    if (requests.size >= 10000 && !requests.has(ip)) return send(429, { error: 'Rate limited' })
    let bucket = requests.get(ip)
    if (!bucket || now - bucket.start > 60000) { bucket = { start: now, count: 0 }; requests.set(ip, bucket) }
    if (++bucket.count > 60) return send(429, { error: 'Rate limited' })
    let upstream
    try { const url = new URL(req.url, 'http://localhost'); upstream = upstreamRequest(url.pathname, url.searchParams, env.DEBRIDGE_API_KEY) }
    catch { return send(400, { error: 'Invalid request' }) }
    try {
      const response = await fetcher(upstream, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000), redirect: 'error' })
      if (!response.ok) return send(response.status === 429 ? 429 : 502, { error: 'deBridge route unavailable' })
      const data = await response.json()
      send(200, data)
    } catch { send(502, { error: 'deBridge is temporarily unavailable' }) }
  })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createDeBridgeServer().listen(Number(process.env.PORT || 8788), process.env.HOST || '127.0.0.1', () => console.log('deBridge proxy listening'))
}
