import { AlchemyHistory } from '../components/shared/AlchemyHistory'
import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi'
import { getAccount, getWalletClient } from 'wagmi/actions'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatEther, formatUnits, type Address } from 'viem'
import { QRCodeSVG } from 'qrcode.react'
import { config, hyperEVM } from '../config/wagmi'
import { alchemyApiKey, gasPolicyId, smartWalletsEnabled } from '../config/alchemy'
import { paymentAssets, paymentRequest, parsePaymentRequest, preparePayment, readPaymentBalance, type PaymentAsset } from '../lib/payments'
import { getActivity, saveActivity, type EvmActivity as Activity } from '../lib/evmActivity'
import { trackTransaction } from '../lib/transactionReceipt'
import { EvmActivity } from '../components/shared/EvmActivity'

export function PaymentsPage() {
  const location = useLocation()
  return <PaymentWorkspace key={`${location.hash}-${location.search}`} hash={location.hash} receive={new URLSearchParams(location.search).get('mode') === 'receive'} />
}
function PaymentWorkspace({ hash, receive }: { hash: string; receive: boolean }) {
  const [request] = useState(() => { try { return { data: parsePaymentRequest(hash), error: '' } } catch (e) { return { data: undefined, error: (e as Error).message } } })
  const { address } = useAccount()
  const client = usePublicClient({ chainId: 999 })!
  const { switchChainAsync } = useSwitchChain()
  const queries = useQueryClient()
  const [asset, setAsset] = useState<PaymentAsset>(request.data?.asset || paymentAssets[0])
  const [recipient, setRecipient] = useState(request.data?.to || '')
  const [amount, setAmount] = useState(request.data?.amount || '')
  const [requestAmount, setRequestAmount] = useState('')
  const [tab, setTab] = useState<'send' | 'receive'>(receive ? 'receive' : 'send')
  const [smart, setSmart] = useState<{ owner: Address; address: Address }>()
  const account = smart && smart.owner === address ? smart.address : address
  const isSmart = !!smart && smart.owner === address
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(request.error)
  const [review, setReview] = useState<Awaited<ReturnType<typeof preparePayment>> & { owner: Address; account: Address }>()
  const lock = useRef(false)
  const balance = useQuery({ queryKey: ['payment-balance', account, asset.symbol], queryFn: () => readPaymentBalance(client, account!, asset), enabled: !!account, refetchInterval: 15000 })
  const validReview = review && review.owner === address && review.account === account ? review : undefined
  const reset = () => { setReview(undefined); setMessage('') }
  async function smartAccount() {
    if (!address || busy) return
    setBusy(true); reset()
    try {
      const signer = await getWalletClient(config)
      const { createHyperEvmSmartWallet } = await import('../lib/alchemyWallet')
      const result = await createHyperEvmSmartWallet(signer).requestAccount({ creationHint: { accountType: 'sma-b' } })
      if (getAccount(config).address !== address) throw new Error('Wallet changed. Try again.')
      setSmart({ owner: address, address: result.address })
    } catch { setMessage('Smart account unavailable. Use your connected wallet or verify Alchemy setup.') }
    finally { setBusy(false) }
  }
  async function reviewPayment() {
    if (!address || !account || busy) return
    setBusy(true); reset()
    try {
      const prepared = await preparePayment(client, account, recipient, asset, amount, isSmart)
      if (isSmart) {
        const { createHyperEvmSmartWallet } = await import('../lib/alchemyWallet')
        await createHyperEvmSmartWallet(await getWalletClient(config)).prepareCalls({ account, calls: [prepared.call] })
      }
      setReview({ ...prepared, owner: address, account })
    } catch (e) { setMessage(e instanceof Error && !e.message.includes('http') ? e.message.slice(0, 180) : 'Unable to prepare payment. Check balance, network and wallet.') }
    finally { setBusy(false) }
  }
  async function send() {
    if (!validReview || !address || !account || lock.current) return
    lock.current = true; setBusy(true); setMessage('')
    let record: Activity | undefined
    try {
      if (getActivity().some(e => e.owner.toLowerCase() === address.toLowerCase() && e.status === 'pending')) throw new Error('Resolve pending activity before sending another payment.')
      if (getAccount(config).chainId !== 999) await switchChainAsync({ chainId: 999 })
      if (getAccount(config).address !== validReview.owner) throw new Error('Wallet changed. Review the payment again.')
      const fresh = await preparePayment(client, account, validReview.to, asset, amount, isSmart)
      const signer = await getWalletClient(config, { chainId: 999 })
      if (signer.account.address !== validReview.owner) throw new Error('Wallet changed. Review again.')
      const submitted = (id: string, kind: Activity['kind']) => {
        record = { id, kind, owner: address, account, label: `Sent ${amount} ${asset.symbol} to ${fresh.to}`, status: 'pending', createdAt: Date.now() }
        saveActivity(record)
      }
      if (isSmart) {
        const { submitHyperEvmBatch } = await import('../lib/alchemyWallet')
        const result = await submitHyperEvmBatch(signer, account, [fresh.call], id => submitted(id, 'batch'))
        if (record) saveActivity({ ...record, status: result.status === 'success' ? 'confirmed' : 'failed' })
        record = undefined
        if (result.status !== 'success') throw new Error('Payment failed. Check activity.')
      } else {
        const tx = await signer.sendTransaction({ account: address, chain: hyperEVM, ...fresh.call })
        submitted(tx, 'transaction')
        if (record) await trackTransaction(client, record)
        record = undefined
      }
      setAmount(''); setMessage('Payment confirmed on HyperEVM.')
      await queries.invalidateQueries({ queryKey: ['payment-balance'] })
    } catch (e) { setMessage(record && getActivity().some(a => a.id === record?.id && a.status === 'pending') ? 'Payment submitted; confirmation is uncertain. Check activity before retrying.' : e instanceof Error && !e.message.includes('http') ? e.message.slice(0, 180) : 'Payment could not be completed. Check your wallet and activity.') }
    finally { lock.current = false; setBusy(false); setReview(undefined) }
  }
  let requestLink = ''; let requestError = ''
  if (account && balance.data) {
    try { requestLink = paymentRequest(window.location.href, account, asset, requestAmount, balance.data.decimals) }
    catch (e) { requestError = (e as Error).message }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage('Copied.') }
    catch { setMessage('Clipboard unavailable. Select and copy the displayed text.') }
  }
  return <main className="lending-page payments-page">
    <header className="payment-hero"><div><span className="payment-eyebrow">FUTURESXYZ PAY · HYPEREVM</span><h1>Your money. Your wallet.</h1><p>Send tokens directly. Share a request. Stay in control.</p></div><span className="payment-network">HyperEVM · Chain 999</span></header>
    <div className="payment-layout"><section className="lending-card payment-main">
      <div className="payment-tabs" role="tablist" aria-label="Payment mode">{(['send', 'receive'] as const).map(t => <button role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} disabled={busy} onClick={() => { setTab(t); reset() }} key={t}>{t === 'send' ? '↗ Send' : '↙ Receive & request'}</button>)}</div>
      <div className="lending-actions payment-account"><button disabled={busy} className={!isSmart ? 'active' : ''} onClick={() => { setSmart(undefined); reset() }}>Connected wallet</button><button title={!alchemyApiKey ? 'Alchemy account setup required' : 'Separate account; compatibility must be verified'} disabled={busy || !address || !smartWalletsEnabled} className={isSmart ? 'active' : ''} onClick={smartAccount}>Alchemy smart account</button></div>
      {isSmart && <p>Separate smart account. Fund this address on HyperEVM before sending. {gasPolicyId ? 'Gas sponsorship is subject to policy eligibility.' : 'HYPE is required for gas.'}</p>}
      {account && <p className="evm-address">{isSmart ? 'Smart account' : 'Your wallet'}: {account}</p>}
      <label className="payment-label">Asset<select disabled={busy} value={asset.symbol} onChange={e => { setAsset(paymentAssets.find(a => a.symbol === e.target.value)!); setAmount(''); setRequestAmount(''); reset() }}>{paymentAssets.map(a => <option key={a.symbol}>{a.symbol}</option>)}</select></label>
      <p>Available: {balance.data ? `${formatUnits(balance.data.balance, balance.data.decimals)} ${asset.symbol}` : address ? 'Loading…' : 'Connect your wallet to view balance'} {balance.isError && <button onClick={() => balance.refetch()}>Balance unavailable · Retry</button>}</p>
      {tab === 'send' ? <>
        {request.data && <p className="lending-notice">Payment request loaded. Verify the full recipient address and amount before paying.</p>}
        <label className="payment-label">Recipient address<input disabled={busy} value={recipient} placeholder="0x…" autoComplete="off" spellCheck={false} onChange={e => { setRecipient(e.target.value.trim()); reset() }} /></label>
        <label className="payment-label">Amount<input disabled={busy} value={amount} inputMode="decimal" placeholder="0.00" onChange={e => { setAmount(e.target.value); reset() }} /></label>
        <button className="payment-primary" disabled={busy || !address || !recipient || !amount} onClick={reviewPayment}>{busy ? 'Working…' : address ? 'Review payment' : 'Connect wallet to send'}</button>
        {validReview && <div className="lending-review"><h3>Confirm your payment</h3><p className="payment-total">{amount} {asset.symbol}</p><p className="evm-address">From: {account}<br />To: {validReview.to}</p><p>Network: HyperEVM (999)<br />{validReview.fee !== undefined ? `Estimated network fee: ${formatEther(validReview.fee)} HYPE. Your wallet shows the final fee.` : 'Smart-account gas is finalized during submission; sponsorship depends on policy.'}</p><p>This transfer cannot be reversed. No token approval is required.</p><button disabled={busy} onClick={send}>Confirm in wallet</button><button disabled={busy} onClick={() => setReview(undefined)}>Cancel</button></div>}
      </> : <>
        <p>Receive {asset.symbol} on HyperEVM only. HyperCore balances are separate.</p>
        <label className="payment-label">Requested amount (optional)<input disabled={busy} inputMode="decimal" placeholder="Any amount" value={requestAmount} onChange={e => setRequestAmount(e.target.value)} /></label>
        {requestError && <p role="alert">{requestError}</p>}
        {account && <div className="payment-receive"><div className="payment-qr"><QRCodeSVG value={account} size={176} marginSize={3} title="HyperEVM receiving address" /></div><strong>Wallet address QR</strong><p className="evm-address">{account}</p><button onClick={() => copy(account)}>Copy address</button></div>}
        {requestLink && <details className="payment-request"><summary>Share payment request</summary><div className="payment-qr"><QRCodeSVG value={requestLink} size={200} marginSize={3} title="Open payment request in Futuresxyz" /></div><p>This QR opens a payment review in Futuresxyz. It never sends automatically.</p><p className="evm-address">{requestLink}</p><button onClick={() => copy(requestLink)}>Copy request link</button></details>}
      </>}
      {message && <p role="status" className="payment-message">{message}</p>}
    </section><aside>
      <section className="lending-card"><h2>Simple by design</h2><div className="payment-step"><b>01</b><div><h3>Choose your asset</h3><p>USDC, USDT0, USDH, HYPE or WHYPE.</p></div></div><div className="payment-step"><b>02</b><div><h3>Review every detail</h3><p>Full addresses, network and estimated fee before your wallet signs.</p></div></div><div className="payment-step"><b>03</b><div><h3>Follow the confirmation</h3><p>Track payments made here and reopen their explorer receipts.</p></div></div></section>
      <section className="lending-card"><h3>Put your assets to work</h3><p>Explore live lending markets. Deposits carry protocol and liquidation risks.</p><Link to="/lending">Explore lending →</Link></section>
      <section className="lending-card"><h3>Connection status</h3><p>{alchemyApiKey ? 'Alchemy RPC configured with public fallback.' : 'Public HyperEVM RPC active. Alchemy setup pending.'}</p><p>{gasPolicyId ? 'Gas sponsorship policy configured; eligibility is checked per operation.' : 'Gas sponsorship is not enabled.'}</p><p>Smart-wallet compatibility is pending live verification. Standard wallet payments work independently.</p></section>
    </aside></div><EvmActivity /><AlchemyHistory address={account} />
    <p>Activity covers transactions initiated in this browser. For all incoming and outgoing transfers, {account ? <a href={`https://hyperevmscan.io/address/${account}`} target="_blank" rel="noreferrer">open your account on HyperEVM Scan ↗</a> : 'connect your wallet and open its explorer history'}.</p>
  </main>
}
