import { useRef, useState } from 'react'
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
import { ConnectButton } from './shared/ConnectButton'

export function PaymentForm({ hash, receive }: { hash: string; receive: boolean }) {
  const [request] = useState(() => { try { return { data: parsePaymentRequest(hash), error: '' } } catch (e) { return { data: undefined, error: (e as Error).message } } })
  const { address } = useAccount()
  const client = usePublicClient({ chainId: 999 })!
  const { switchChainAsync } = useSwitchChain()
  const queries = useQueryClient()
  const [asset, setAsset] = useState<PaymentAsset>(request.data?.asset || paymentAssets[0])
  const [recipient, setRecipient] = useState(request.data?.to || '')
  const [amount, setAmount] = useState(request.data?.amount || '')
  const [requestAmount, setRequestAmount] = useState('')
  const tab = receive ? 'receive' : 'send'
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
      setAmount(''); setMessage('Payment sent successfully.')
      await queries.invalidateQueries({ queryKey: ['payment-balance'] })
    } catch (e) { setMessage(record && getActivity().some(a => a.id === record?.id && a.status === 'pending') ? 'Payment submitted; confirmation is uncertain. Check activity before retrying.' : e instanceof Error && !e.message.includes('http') ? e.message.slice(0, 180) : 'Payment could not be completed. Check your wallet and activity.') }
    finally { lock.current = false; setBusy(false); setReview(undefined) }
  }
  let requestLink = ''; let requestError = ''
  if (account && balance.data) {
    try { requestLink = paymentRequest(window.location.href.split('?')[0].split('#')[0] + '?action=send', account, asset, requestAmount, balance.data.decimals) }
    catch (e) { requestError = (e as Error).message }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage('Copied.') }
    catch { setMessage('Clipboard unavailable. Select and copy the displayed text.') }
  }
  return <div className="payments-page payment-compact">
    <section className="payment-main">
      {!address && <ConnectButton />}
      <details className="payment-advanced"><summary>Advanced account options</summary>
      <div className="lending-actions payment-account"><button disabled={busy} className={!isSmart ? 'active' : ''} onClick={() => { setSmart(undefined); reset() }}>Connected wallet</button><button title={!alchemyApiKey ? 'Alchemy account setup required' : 'Separate account; compatibility must be verified'} disabled={busy || !address || !smartWalletsEnabled} className={isSmart ? 'active' : ''} onClick={smartAccount}>Alchemy smart account</button></div>
      </details>
      {isSmart && <p>This wallet has its own balance. Add funds on the HyperEVM network before sending. {gasPolicyId ? 'Network fees may be covered for eligible payments.' : 'Keep a little HYPE to pay network fees.'}</p>}
      {account && <p className="evm-address">{isSmart ? 'Smart account' : 'Your wallet'}: {account}</p>}
      <label className="payment-label">Asset<select disabled={busy} value={asset.symbol} onChange={e => { setAsset(paymentAssets.find(a => a.symbol === e.target.value)!); setAmount(''); setRequestAmount(''); reset() }}>{paymentAssets.map(a => <option key={a.symbol}>{a.symbol}</option>)}</select></label>
      <p>Available: {balance.data ? `${formatUnits(balance.data.balance, balance.data.decimals)} ${asset.symbol}` : address ? 'Loading…' : 'Connect your wallet to view balance'} {balance.isError && <button onClick={() => balance.refetch()}>Balance unavailable · Retry</button>}</p>
      {tab === 'send' ? <>
        {request.data && <p className="lending-notice">Payment request loaded. Verify the full recipient address and amount before paying.</p>}
        <label className="payment-label">Recipient address<input disabled={busy} value={recipient} placeholder="0x…" autoComplete="off" spellCheck={false} onChange={e => { setRecipient(e.target.value.trim()); reset() }} /></label>
        <label className="payment-label">Amount<input disabled={busy} value={amount} inputMode="decimal" placeholder="0.00" onChange={e => { setAmount(e.target.value); reset() }} /></label>
        <button className="payment-primary" disabled={busy || !address || !recipient || !amount} onClick={reviewPayment}>{busy ? 'Working…' : address ? 'Review payment' : 'Connect wallet to send'}</button>
        {validReview && <div className="lending-review"><h3>Confirm your payment</h3><p className="payment-total">{amount} {asset.symbol}</p><p className="evm-address">From: {account}<br />To: {validReview.to}</p><p>Network: HyperEVM<br />{validReview.fee !== undefined ? `Estimated network fee: ${formatEther(validReview.fee)} HYPE. Your wallet shows the final fee.` : 'The final network fee is calculated when you send. You may need to pay it.'}</p><p>Check the address carefully. This payment cannot be reversed.</p><button disabled={busy} onClick={send}>Confirm in wallet</button><button disabled={busy} onClick={() => setReview(undefined)}>Cancel</button></div>}
      </> : <>
        <p>Receive {asset.symbol} on HyperEVM only. This address does not receive funds into your Hyperliquid trading account.</p>
        <label className="payment-label">Requested amount (optional)<input disabled={busy} inputMode="decimal" placeholder="Any amount" value={requestAmount} onChange={e => setRequestAmount(e.target.value)} /></label>
        {requestError && <p role="alert">{requestError}</p>}
        {account && <div className="payment-receive"><div className="payment-qr"><QRCodeSVG value={account} size={176} marginSize={3} title="HyperEVM receiving address" /></div><strong>Wallet address QR</strong><p className="evm-address">{account}</p><button onClick={() => copy(account)}>Copy address</button></div>}
        {requestLink && <details className="payment-request"><summary>Share payment request</summary><div className="payment-qr"><QRCodeSVG value={requestLink} size={200} marginSize={3} title="Open payment request in Oslo" /></div><p>This QR opens a payment review in Oslo. It never sends automatically.</p><p className="evm-address">{requestLink}</p><button onClick={() => copy(requestLink)}>Copy request link</button></details>}
      </>}
      {message && <p role="status" className="payment-message">{message}</p>}
    </section>
  </div>
}
