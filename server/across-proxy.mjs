import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

const chains = new Set(['1', '10', '8453', '42161', '999'])
const address = /^0x[\da-fA-F]{40}$/
export function upstreamRequest(path, params, integratorId) {
  if (!/^0x[\da-fA-F]{4}$/.test(integratorId || '')) throw new Error('Invalid integrator configuration')
  const query = new URLSearchParams({ integratorId })
  const paths = { '/chains': '/swap/chains', '/tokens': '/swap/tokens', '/quote': '/swap/approval', '/status': '/deposit/status' }
  if (!paths[path]) throw new Error('Unsupported endpoint')
  if (path === '/quote') {
    const keys = ['originChainId', 'destinationChainId', 'inputToken', 'outputToken', 'amount', 'depositor', 'recipient']
    if ([...params.keys()].some(key => !keys.includes(key)) || keys.some(key => params.getAll(key).length !== 1)) throw new Error('Invalid quote parameters')
    if (!chains.has(params.get('originChainId')) || !chains.has(params.get('destinationChainId')) || params.get('originChainId') === params.get('destinationChainId')) throw new Error('Unsupported route')
    for (const key of ['inputToken', 'outputToken', 'depositor', 'recipient']) if (!address.test(params.get(key) || '')) throw new Error('Invalid address')
    const amount = params.get('amount') || ''
    if (!/^\d{1,78}$/.test(amount) || BigInt(amount) <= 0n || BigInt(amount) >= 2n ** 256n) throw new Error('Invalid amount')
    for (const key of keys) query.set(key, params.get(key))
    query.set('tradeType', 'exactInput'); query.set('slippage', '0.005')
    query.set('refundOnOrigin', 'true'); query.set('refundAddress', params.get('depositor'))
  } else if (path === '/status') {
    if ([...params.keys()].some(key => key !== 'depositTxnRef') || params.getAll('depositTxnRef').length !== 1 || !/^0x[\da-fA-F]{64}$/.test(params.get('depositTxnRef') || '')) throw new Error('Invalid transaction hash')
    query.set('depositTxnRef', params.get('depositTxnRef'))
  } else if (params.size) throw new Error('Unexpected parameters')
  return `https://app.across.to/api${paths[path]}?${query}`
}

export function createAcrossServer(env = process.env, fetcher = fetch) {
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
    if (!env.ACROSS_API_KEY || !env.ACROSS_INTEGRATOR_ID) return send(503, { error: 'Across is not configured' })
    const now = Date.now(), ip = req.socket.remoteAddress || 'unknown'
    if (requests.size >= 10000) for (const [key, value] of requests) if (now - value.start > 60000) requests.delete(key)
    if (requests.size >= 10000 && !requests.has(ip)) return send(429, { error: 'Rate limited' })
    let bucket = requests.get(ip)
    if (!bucket || now - bucket.start > 60000) { bucket = { start: now, count: 0 }; requests.set(ip, bucket) }
    if (++bucket.count > 60) return send(429, { error: 'Rate limited' })
    let upstream
    try { const url = new URL(req.url, 'http://localhost'); upstream = upstreamRequest(url.pathname, url.searchParams, env.ACROSS_INTEGRATOR_ID) }
    catch { return send(400, { error: 'Invalid request' }) }
    try {
      const response = await fetcher(upstream, { headers: { Authorization: `Bearer ${env.ACROSS_API_KEY}`, Accept: 'application/json' }, signal: AbortSignal.timeout(20000), redirect: 'error' })
      if (!response.ok) return send(response.status === 429 ? 429 : 502, { error: 'Across route unavailable' })
      const data = await response.json()
      send(200, data)
    } catch { send(502, { error: 'Across is temporarily unavailable' }) }
  })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAcrossServer().listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log('Across proxy listening'))
}
