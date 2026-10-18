// Read-only deployment check. Never print the key, endpoint or provider error bodies.
const key = process.env.ALCHEMY_BROWSER_API_KEY?.trim()
if (!key) {
  console.log('Alchemy not configured; public RPC remains active.')
} else {
  try {
    const response = await fetch(`https://hyperliquid-mainnet.g.alchemy.com/v2/${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://christophorusan.github.io' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await response.json()
    if (!response.ok || data.error || data.result !== '0x3e7') throw new Error('Invalid response')
    console.log('Alchemy RPC confirmed: HyperEVM chain 999. Signing and sponsorship are not verified by this check.')
  } catch {
    console.error('Alchemy RPC verification failed. Check HyperEVM enablement, browser origin permissions and usage limits. No credentials were logged.')
    process.exitCode = 1
  }
}
