import { acrossGet, acrossProxy, parseTokens } from '../../lib/across'
import { AcrossSwap } from './AcrossSwap'
import { getSwapRoutes, type SwapRoute } from '../../lib/swapRouting'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { getAccount, getPublicClient, getWalletClient, switchChain } from 'wagmi/actions'
import { erc20Abi, formatUnits } from 'viem'
import { BridgeTokenPicker } from './BridgeTokenPicker'
import { ConnectButton } from '../shared/ConnectButton'
import { availableDlnRoute, restoreDlnTransfer, type DlnTransfer, assertDlnFresh, debridgeProxy, dlnChain, dlnChains, dlnGet, dlnNative, dlnStatus, dlnTokens, type DlnQuote, type DlnToken } from '../../lib/debridge'

export function DeBridgeSwap() {
  const config = useConfig(), { address } = useAccount()
  const [from, setFrom] = useState(42161), [to, setTo] = useState(8453)
  const [chains, setChains] = useState<number[]>([]), [tokens, setTokens] = useState<DlnToken[]>([])
  const [input, setInput] = useState(''), [output, setOutput] = useState(''), [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [message, setMessage] = useState('')
  const [quote, setQuote] = useState<DlnQuote | null>(null), [needsApproval, setNeedsApproval] = useState(false)
  const [sent, setSent] = useState<DlnTransfer | null>(null), [now, setNow] = useState(Date.now())
  const [routes, setRoutes] = useState<SwapRoute[]>([]), [selectedRoute, setSelectedRoute] = useState(0)
  const [routeBusy, setRouteBusy] = useState(false)
  const generation = useRef(0), lock = useRef(false)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { generation.current++; setQuote(null); setRoutes([]); setError(''); setMessage('') }, [from, to, input, output, amount, address])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    void (async () => {
      const sources = await Promise.allSettled([
        (async () => {
          const supported = await dlnGet('supported-chains', undefined, controller.signal) as { chains?: number[] }
          if (!Array.isArray(supported.chains)) throw new Error('Networks unavailable.')
          const available = dlnChains.filter(c => supported.chains!.includes(c.apiId))
          const results = await Promise.allSettled(available.map(async c => dlnTokens(await dlnGet('token-list', new URLSearchParams({ chainId: String(c.apiId) }), controller.signal), c.id)))
          return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        })(),
        acrossProxy ? acrossGet('tokens', undefined, controller.signal).then(parseTokens) : Promise.resolve([]),
      ])
      const list = [...new Map(sources.flatMap(r => r.status === 'fulfilled' ? r.value : []).map(t => [`${t.chainId}:${t.address.toLowerCase()}`, t])).values()]
      const usable = dlnChains.filter(c => list.some(t => t.chainId === c.id)).map(c => c.id)
      if (usable.length < 2) throw new Error('Could not load swap assets. Retry in a moment.')
      if (controller.signal.aborted) return
      setTokens(list); setChains(usable)
      const route = availableDlnRoute(usable, from, to)
      setFrom(route.from); setTo(route.to)
    })().catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load swaps.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    try {
      setSent(restoreDlnTransfer(localStorage.getItem('oslo-last-debridge-transfer')))
    } catch { /* Ignore invalid saved history. */ }
  }, [])
  function updateTransfer(transfer: DlnTransfer) {
    setSent(transfer)
    try { localStorage.setItem('oslo-last-debridge-transfer', JSON.stringify(transfer)) } catch { /* Session tracking remains available. */ }
  }
  const inputTokens = tokens.filter(t => t.chainId === from), outputTokens = tokens.filter(t => t.chainId === to)
  const inToken = inputTokens.find(t => t.address === input) ?? inputTokens.find(t => t.symbol === 'USDC') ?? inputTokens[0]
  const outToken = outputTokens.find(t => t.address === output) ?? outputTokens.find(t => t.symbol === 'USDC') ?? outputTokens[0]
  async function requestQuote() {
    if (lock.current || !inToken || !outToken) return
    lock.current = true; setBusy(true); setError(''); setMessage(''); setQuote(null); setRoutes([])
    const version = ++generation.current
    try {
      const available = await getSwapRoutes({ from, to, input: inToken, output: outToken, amount, account: address })
      if (version !== generation.current) return
      setRoutes(available); setSelectedRoute(0)
      const chosen = available[0]
      if (chosen.provider === 'across') return
      const result = chosen.quote
      let approvalRequired = false
      if (result.tx && address && !dlnNative(inToken.address)) {
        const client = getPublicClient(config, { chainId: from })
        if (!client) throw new Error('Source network is unavailable.')
        const allowance = await client.readContract({ address: inToken.address, abi: erc20Abi, functionName: 'allowance', args: [address, result.tx.to] })
        approvalRequired = allowance < BigInt(result.amount)
      }
      if (version !== generation.current) return
      if (result.request.account) assertDlnFresh(result, getAccount(config).address)
      setQuote(result); setNeedsApproval(approvalRequired)
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message.slice(0, 240) : 'Quote unavailable.') }
    finally { lock.current = false; setBusy(false) }
  }
  async function execute() {
    if (!debridgeProxy || !quote?.tx || !quote.orderId || lock.current) return
    lock.current = true; setBusy(true); setError(''); setMessage('')
    const reviewed = quote, tx = quote.tx, orderId = quote.orderId
    try {
      assertDlnFresh(reviewed, getAccount(config).address)
      if (getAccount(config).chainId !== reviewed.request.from) await switchChain(config, { chainId: reviewed.request.from })
      const wallet = await getWalletClient(config, { chainId: reviewed.request.from })
      const client = getPublicClient(config, { chainId: reviewed.request.from })
      if (!client || await wallet.getChainId() !== reviewed.request.from) throw new Error('Switch to the sending network to continue.')
      assertDlnFresh(reviewed, wallet.account.address)
      if (needsApproval && !dlnNative(reviewed.request.input.address)) {
        assertDlnFresh(reviewed, getAccount(config).address)
        setQuote(null)
        const hash = await wallet.writeContract({ address: reviewed.request.input.address, abi: erc20Abi, functionName: 'approve', args: [tx.to, BigInt(reviewed.amount)] })
        setMessage(`Approval submitted: ${hash}. Waiting for confirmation…`)
        const receipt = await client.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error('Approval reverted. No swap submitted.')
        setMessage('Approval confirmed. Get a fresh quote, then confirm the swap.')
      } else {
        if (!dlnNative(reviewed.request.input.address)) {
          const allowance = await client.readContract({ address: reviewed.request.input.address, abi: erc20Abi, functionName: 'allowance', args: [wallet.account.address, tx.to] })
          if (allowance < BigInt(reviewed.amount)) throw new Error('Allowance changed. Get a new quote.')
        }
        await client.call({ account: wallet.account.address, to: tx.to, data: tx.data, value: tx.value })
        assertDlnFresh(reviewed, getAccount(config).address)
        if (await wallet.getChainId() !== reviewed.request.from) throw new Error('Network changed. Get a new quote.')
        setQuote(null) // A wallet/RPC error does not prove that nothing was broadcast.
        const hash = await wallet.sendTransaction({ to: tx.to, data: tx.data, value: tx.value })
        const transfer: DlnTransfer = { sourceStatus: 'pending', hash, chain: reviewed.request.from, orderId, status: 'Submitted on source network. Destination delivery is pending.' }
        updateTransfer(transfer)
        const receipt = await client.waitForTransactionReceipt({ hash })
        updateTransfer({ ...transfer, sourceStatus: receipt.status === 'success' ? 'confirmed' : 'reverted', status: receipt.status === 'success' ? 'Source confirmed. Check destination delivery below.' : 'Source transaction reverted. No swap completed.' })
      }
    } catch (e) { setError(`${e instanceof Error ? e.message.slice(0, 200) : 'Transaction could not complete.'} Check wallet history before retrying.`) }
    finally { lock.current = false; setBusy(false) }
  }
  async function checkStatus() {
    if (!sent || sent.sourceStatus === 'reverted' || lock.current) return
    lock.current = true; setBusy(true)
    try {
      const result = await dlnGet(`dln/order/${sent.orderId}/status`) as { orderId?: string; status?: string }
      if (result.orderId?.toLowerCase() !== sent.orderId.toLowerCase()) throw new Error('Order mismatch')
      updateTransfer({ ...sent, status: dlnStatus(result.status) })
    } catch { updateTransfer({ ...sent, status: 'Delivery status is not available yet. Source confirmation does not confirm delivery.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="bridge-provider-panel oslo-swap">
    <div className="oslo-swap-title"><h2>Swap</h2><span>Automatic routing</span></div>
    <p className="bridge-description">Move your assets. Keep the same wallet.</p>
    {loading && <p role="status">Loading networks and assets…</p>}
    <fieldset disabled={busy || routeBusy || loading}><legend>Swap details</legend>
      <div className="bridge-fields"><label>From<select value={from} onChange={e => { setFrom(Number(e.target.value)); setInput('') }}>{chains.map(id => <option key={id} value={id}>{dlnChain(id).name}</option>)}</select></label><label>To<select value={to} onChange={e => { setTo(Number(e.target.value)); setOutput('') }}>{chains.map(id => <option key={id} value={id}>{dlnChain(id).name}</option>)}</select></label></div>
      <div className="oslo-swap-asset"><label>You send<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label><BridgeTokenPicker label="Send asset" token={inToken} tokens={inputTokens} onChange={setInput} /></div>
      <div className="oslo-swap-asset"><div><span className="oslo-swap-caption">You receive</span><p className="oslo-swap-output">{routes[selectedRoute] ? formatUnits(BigInt(routes[selectedRoute].quote.output), outToken?.decimals ?? 18) : '—'}</p></div><BridgeTokenPicker label="Receive asset" token={outToken} tokens={outputTokens} onChange={setOutput} /></div>
      <small>{to === 999 ? 'Receives in your HyperEVM wallet, not your Hyperliquid trading balance.' : 'Receives in the same wallet on your destination network.'}</small>
    </fieldset>
    <button className="bridge-primary oslo-swap-action" disabled={busy || routeBusy || loading || !inToken || !outToken || !amount} onClick={requestQuote}>{busy ? 'Please wait…' : quote ? 'Refresh quote' : 'Get quote'}</button>
    {!address && <div className="oslo-swap-connect"><ConnectButton /></div>}
    {error && <p role="alert" className="bridge-error">{error} {!tokens.length && <button onClick={() => setAttempt(n => n + 1)}>Retry</button>}</p>}
    {message && <p role="status" className="bridge-footnote">{message}</p>}
    {!!routes.length && <p className="bridge-footnote">Route: {routes[selectedRoute].provider === 'across' ? 'Across' : 'deBridge'} · {routes.length} available quote{routes.length === 1 ? '' : 's'}. {routes[selectedRoute].quote.tx ? 'Selected by expected receive amount among executable routes.' : 'Preview only; execution is not enabled.'} Additional gas and protocol fees may differ.</p>}
    {routes[selectedRoute]?.provider === 'across' && <AcrossSwap key={routes[selectedRoute].quote.expiresAt} preparedQuote={routes[selectedRoute].quote as import('../../lib/across').AcrossQuote} onBusy={setRouteBusy} />}
    {quote && <div className="bridge-review"><h2>Review swap</h2><dl>
      <dt>Route</dt><dd>{dlnChain(quote.request.from).name} → {dlnChain(quote.request.to).name}</dd>
      <dt>You send</dt><dd>{quote.request.amount} {quote.request.input.symbol}</dd>
      <dt>Receive on fulfillment</dt><dd>{formatUnits(BigInt(quote.output), quote.request.output.decimals)} {quote.request.output.symbol}</dd>
      <dt>Network protocol fee</dt><dd>{formatUnits(BigInt(quote.fixFee), 18)} {dlnChain(quote.request.from).native}</dd>
      <dt>Estimated source gas</dt><dd>{quote.gas ? `${formatUnits(BigInt(quote.gas), 18)} ${dlnChain(quote.request.from).native}` : 'Shown in wallet'}</dd>
      <dt>Estimated delivery</dt><dd>{quote.seconds ? `~${quote.seconds}s after source confirmation` : 'Unavailable'}</dd>
      {quote.priceImpact !== null && <><dt>Estimated value change</dt><dd>{quote.priceImpact.toFixed(2)}%</dd></>}
      <dt>Receive address</dt><dd>{quote.request.account || address || 'Connect your wallet to continue'}</dd>
      <dt>Quote expires</dt><dd>{now >= quote.expiresAt ? 'Expired — refresh quote' : `In ${Math.ceil((quote.expiresAt - now) / 1000)}s`}</dd>
    </dl>
      <p className="bridge-footnote">Routing costs are included in the receive amount. The native protocol fee and gas are additional. Oslo adds no fee.</p>
      {quote.tx && <details><summary>Transaction details</summary><p className="bridge-footnote">Source contract{needsApproval ? ' / approval spender' : ''}: {quote.tx.to}<br />Input token: {quote.request.input.address}<br />Receive token: {quote.request.output.address}<br />Cancellation authority and refund address: {quote.request.account}</p></details>}
      {quote.tx && debridgeProxy && <button className="bridge-primary oslo-swap-action" disabled={busy || now >= quote.expiresAt} onClick={execute}>{needsApproval ? `Approve ${quote.request.amount} ${quote.request.input.symbol}` : 'Confirm swap in wallet'}</button>}
      {needsApproval && debridgeProxy && <p className="bridge-footnote">Approval is limited to this amount. After confirmation, refresh your quote and approve the swap separately.</p>}
    </div>}
    {!debridgeProxy && <p className="bridge-footnote">Live quote preview. deBridge execution is awaiting activation. Across is included automatically when its connection is enabled and your wallet is connected.</p>}
    <details className="oslo-swap-other"><summary>Solana and Hyperliquid trading deposits</summary><p className="bridge-footnote">These routes are not yet available in Oslo’s native form. <a href="https://app.debridge.com/" target="_blank" rel="noopener noreferrer">Continue on deBridge ↗</a></p></details>
    {sent && <div className="bridge-review"><h2>Last transfer</h2><p role="status">{sent.status}</p><p className="bridge-footnote">Transaction: {sent.hash}<br />Order: {sent.orderId}</p><button disabled={busy || sent.sourceStatus === 'reverted'} onClick={checkStatus}>Check delivery</button> <a href={`${config.chains.find(c => c.id === sent.chain)?.blockExplorers?.default.url}/tx/${sent.hash}`} target="_blank" rel="noopener noreferrer">Source transaction ↗</a> <a href="https://app.debridge.com/orders" target="_blank" rel="noopener noreferrer">Order history / cancellation ↗</a></div>}
  </section>
}
