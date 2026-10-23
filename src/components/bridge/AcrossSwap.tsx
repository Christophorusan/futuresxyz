import { useEffect, useRef, useState } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { getAccount, getPublicClient, getWalletClient, switchChain } from 'wagmi/actions'
import { erc20Abi, formatUnits, type Address } from 'viem'
import { acrossGet, acrossProxy, assertFresh, bridgeChains, getAcrossQuote, inputAmount, parseTokens, type AcrossQuote, type BridgeToken, type SwapRequest } from '../../lib/across'
import { ConnectButton } from '../shared/ConnectButton'

const chainNames: Record<number, string> = { 1: 'Ethereum', 10: 'Optimism', 8453: 'Base', 42161: 'Arbitrum', 999: 'HyperEVM' }
export function AcrossSwap() {
  const { address } = useAccount()
  const config = useConfig()
  const [tokens, setTokens] = useState<BridgeToken[]>([])
  const [chains, setChains] = useState<number[]>([])
  const [from, setFrom] = useState(42161), [to, setTo] = useState(8453)
  const [input, setInput] = useState(''), [output, setOutput] = useState('')
  const [amount, setAmount] = useState(''), [recipient, setRecipient] = useState('')
  const [quote, setQuote] = useState<AcrossQuote | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true)
  const [error, setError] = useState(''), [message, setMessage] = useState('')
  const [now, setNow] = useState(Date.now())
  const [sent, setSent] = useState<{ hash: string; chain: number; status: string } | null>(null)
  const lock = useRef(false), generation = useRef(0)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    generation.current++; setQuote(null); setError(''); setMessage('')
  }, [from, to, input, output, amount, recipient, address])
  useEffect(() => {
    if (!acrossProxy) { setLoading(false); return }
    const controller = new AbortController()
    Promise.all([acrossGet('tokens', undefined, controller.signal), acrossGet('chains', undefined, controller.signal)]).then(([t, c]) => {
      if (controller.signal.aborted) return
      const list = parseTokens(t)
      if (!Array.isArray(c)) throw new Error('Could not load Across networks.')
      const available = bridgeChains.filter(id => c.some(chain => chain?.chainId === id) && list.some(token => token.chainId === id))
      setTokens(list); setChains([...available])
      if (available.length < 2) throw new Error('Across has no supported routes available in Oslo right now.')
      setFrom(available.includes(42161) ? 42161 : available[0]); setTo(available.includes(8453) ? 8453 : available.find(id => id !== (available.includes(42161) ? 42161 : available[0]))!)
    }).catch(() => { if (!controller.signal.aborted) setError('Across could not load its networks and tokens. Reload to retry.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
  const inputTokens = tokens.filter(t => t.chainId === from), outputTokens = tokens.filter(t => t.chainId === to)
  const inToken = inputTokens.find(t => t.address === input) ?? inputTokens.find(t => t.symbol === 'USDC') ?? inputTokens[0]
  const outToken = outputTokens.find(t => t.address === output) ?? outputTokens.find(t => t.symbol === 'USDC') ?? outputTokens[0]
  async function requestQuote() {
    if (lock.current || !address || !inToken || !outToken) return
    lock.current = true; setBusy(true); setError(''); setMessage(''); setQuote(null)
    const version = ++generation.current
    try {
      const request: SwapRequest = { originChainId: from, destinationChainId: to, inputToken: inToken, outputToken: outToken, amount, depositor: address, recipient: (recipient.trim() || address) as Address }
      inputAmount(request)
      const result = await getAcrossQuote(request)
      let approvalRequired = false
      if (result.approval) {
        const client = getPublicClient(config, { chainId: from })
        if (!client) throw new Error('Network unavailable.')
        const allowance = await client.readContract({ address: result.approval.token, abi: erc20Abi, functionName: 'allowance', args: [address, result.approval.spender] })
        approvalRequired = allowance < result.approval.amount
      }
      if (!result.simulationSuccess && !approvalRequired) throw new Error('Route simulation failed. Check your balance and request a new quote.')
      if (version !== generation.current) return
      assertFresh(result, getAccount(config).address)
      setNeedsApproval(approvalRequired); setQuote(result)
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : 'Quote unavailable.') }
    finally { lock.current = false; setBusy(false) }
  }
  async function execute() {
    if (!quote || lock.current) return
    lock.current = true; setBusy(true); setError(''); setMessage('')
    const reviewed = quote
    try {
      assertFresh(reviewed, getAccount(config).address)
      if (getAccount(config).chainId !== reviewed.tx.chainId) await switchChain(config, { chainId: reviewed.tx.chainId })
      const wallet = await getWalletClient(config, { chainId: reviewed.tx.chainId })
      const client = getPublicClient(config, { chainId: reviewed.tx.chainId })
      if (!client || await wallet.getChainId() !== reviewed.tx.chainId) throw new Error('Switch to the source network to continue.')
      assertFresh(reviewed, wallet.account.address)
      if (needsApproval && reviewed.approval) {
        setQuote(null) // A wallet/RPC timeout may still mean the transaction was broadcast.
        const hash = await wallet.writeContract({ address: reviewed.approval.token, abi: erc20Abi, functionName: 'approve', args: [reviewed.approval.spender, reviewed.approval.amount] })
        setQuote(null); setMessage(`Approval submitted: ${hash}. Waiting for confirmation…`)
        const receipt = await client.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error('Approval reverted. No swap was submitted.')
        setMessage('Approval confirmed. Request a fresh quote to review and submit your swap.')
      } else {
        if (!reviewed.simulationSuccess) throw new Error('Request a fresh, simulated quote before swapping.')
        if (reviewed.approval) {
          const allowance = await client.readContract({ address: reviewed.approval.token, abi: erc20Abi, functionName: 'allowance', args: [reviewed.request.depositor, reviewed.approval.spender] })
          if (allowance < reviewed.approval.amount) throw new Error('Token allowance changed. Request a new quote.')
        }
        await client.call({ account: wallet.account.address, to: reviewed.tx.to, data: reviewed.tx.data, value: reviewed.tx.value })
        assertFresh(reviewed, getAccount(config).address)
        setQuote(null) // Require a fresh review after any submission attempt.
        const hash = await wallet.sendTransaction({ to: reviewed.tx.to, data: reviewed.tx.data, value: reviewed.tx.value })
        setQuote(null); setSent({ hash, chain: reviewed.tx.chainId, status: 'Submitted on source network. Destination delivery is not confirmed yet.' })
        try { localStorage.setItem('oslo-last-across-transfer', JSON.stringify({ hash, chain: reviewed.tx.chainId })) } catch { /* Tracking still available in this session. */ }
        const receipt = await client.waitForTransactionReceipt({ hash })
        setSent({ hash, chain: reviewed.tx.chainId, status: receipt.status === 'success' ? 'Source confirmed. Check destination delivery below.' : 'Source transaction reverted. No bridge deposit completed.' })
      }
    } catch (e) { setError(e instanceof Error ? e.message.slice(0, 240) : 'Transaction could not complete. Check your wallet and transaction history before retrying.') }
    finally { lock.current = false; setBusy(false) }
  }
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('oslo-last-across-transfer') || 'null'); if (saved && /^0x[\da-f]{64}$/i.test(saved.hash) && bridgeChains.includes(saved.chain)) setSent({ ...saved, status: 'Saved transfer. Check its current delivery status.' }) } catch { /* Ignore malformed saved data. */ }
  }, [])
  async function checkStatus() {
    if (!sent || lock.current) return
    lock.current = true; setBusy(true)
    try {
      const result = await acrossGet('status', new URLSearchParams({ depositTxnRef: sent.hash })) as { status?: string }
      setSent({ ...sent, status: result.status === 'filled' ? 'Delivered — Across reports this transfer is filled.' : `Delivery status: ${result.status || 'not yet available'}. Check Across for transfer details.` })
    } catch { setSent({ ...sent, status: 'Delivery status is not available yet. Source confirmation does not confirm destination delivery.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  if (!acrossProxy) return <section className="bridge-provider-panel"><h2>Across</h2><p>Across swaps inside Oslo are not enabled yet. You can use the official Across app in the meantime.</p><a className="bridge-primary" href="https://app.across.to/bridge-and-swap?from=42161&to=8453&inputToken=USDC&outputToken=USDC" target="_blank" rel="noopener noreferrer">Continue on Across ↗</a><p className="bridge-footnote">Opens Across with Arbitrum → Base selected. Connect and review the current route there.</p></section>
  return <section className="bridge-provider-panel"><p className="bridge-description">Choose what to send and where to receive it. Across finds the route; your wallet approves each step.</p>
    {loading && <p role="status">Loading supported networks and tokens…</p>}
    <fieldset disabled={busy || loading}><legend>Transfer details</legend>
      <div className="bridge-fields"><label>From network<select value={from} onChange={e => { setFrom(Number(e.target.value)); setInput('') }}>{chains.map(id => <option key={id} value={id}>{chainNames[id]}</option>)}</select></label><label>To network<select value={to} onChange={e => { setTo(Number(e.target.value)); setOutput('') }}>{chains.map(id => <option key={id} value={id}>{chainNames[id]}</option>)}</select></label></div>
      <div className="bridge-fields"><label>Send token<select value={inToken?.address || ''} onChange={e => setInput(e.target.value)}>{inputTokens.map(t => <option key={t.address} value={t.address}>{t.symbol} · {t.name} · {t.address.slice(0, 6)}…</option>)}</select></label><label>Receive token<select value={outToken?.address || ''} onChange={e => setOutput(e.target.value)}>{outputTokens.map(t => <option key={t.address} value={t.address}>{t.symbol} · {t.name} · {t.address.slice(0, 6)}…</option>)}</select></label></div>
      <label>Amount<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label>
      <label>Recipient<input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={address || 'Your connected wallet by default'} /></label>
      <small>Leave blank to receive in your connected wallet. Slippage: 0.5%. Refunds requested on the source network to your sending wallet.</small>
    </fieldset>
    {!address ? <ConnectButton /> : <button className="bridge-primary" disabled={busy || loading || !inToken || !outToken} onClick={requestQuote}>{busy ? 'Please wait…' : 'Get quote'}</button>}
    {error && <p role="alert" className="bridge-error">{error}</p>}{message && <p role="status" className="bridge-footnote">{message}</p>}
    {quote && <div className="bridge-review"><h2>Review your transfer</h2><dl>
      <dt>Route</dt><dd>{chainNames[quote.request.originChainId]} → {chainNames[quote.request.destinationChainId]}</dd>
      <dt>You send</dt><dd>{quote.request.amount} {quote.request.inputToken.symbol}</dd>
      <dt>Expected received</dt><dd>{formatUnits(BigInt(quote.output), quote.request.outputToken.decimals)} {quote.request.outputToken.symbol}</dd>
      <dt>Minimum received</dt><dd>{formatUnits(BigInt(quote.minimum), quote.request.outputToken.decimals)} {quote.request.outputToken.symbol}</dd>
      <dt>Estimated fees</dt><dd>{quote.feesUsd ? `$${quote.feesUsd}` : 'Unavailable'}</dd><dt>Source gas estimate</dt><dd>{quote.gasUsd ? `$${quote.gasUsd}` : 'Shown by your wallet'}</dd>
      <dt>Estimated delivery</dt><dd>{quote.seconds ? `~${quote.seconds} seconds after source confirmation` : 'Unavailable'}</dd>
      <dt>Recipient</dt><dd>{quote.request.recipient}</dd><dt>Source contract</dt><dd>{quote.tx.to}</dd>
      {quote.approval && <><dt>Token approval spender</dt><dd>{quote.approval.spender}</dd></>}
      <dt>Quote</dt><dd>{now >= quote.expiresAt ? 'Expired — get a new quote' : `${Math.ceil((quote.expiresAt - now) / 1000)} seconds remaining`}</dd>
    </dl><button className="bridge-primary" disabled={busy || now >= quote.expiresAt} onClick={execute}>{busy ? 'Waiting for wallet…' : needsApproval ? `Approve ${quote.request.amount} ${quote.request.inputToken.symbol}` : 'Confirm swap in wallet'}</button><p className="bridge-footnote">You approve in your wallet. A token approval does not submit the swap. Delivery is confirmed separately from the source transaction.</p></div>}
    {sent && <div className="bridge-review"><h2>Last transfer</h2><p role="status">{sent.status}</p><p className="bridge-footnote">{sent.hash}</p><button disabled={busy} onClick={checkStatus}>Check delivery</button> <a href={`${config.chains.find(c => c.id === sent.chain)?.blockExplorers?.default.url}/tx/${sent.hash}`} target="_blank" rel="noopener noreferrer">Source transaction ↗</a> <a href="https://app.across.to/" target="_blank" rel="noopener noreferrer">Across history ↗</a></div>}
  </section>
}
