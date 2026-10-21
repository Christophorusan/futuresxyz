import { useState, useRef } from 'react'
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi'
import { getAccount, getWalletClient } from 'wagmi/actions'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatUnits, type Address } from 'viem'
import { trackTransaction } from '../../lib/transactionReceipt'
import { config, hyperEVM } from '../../config/wagmi'
import { protocols, type LendingAction } from '../../lib/lending/contracts'
import { readPosition, type LendingMarket } from '../../lib/lending/markets'
import { prepareLending } from '../../lib/lending/transactions'
import { getActivity, saveActivity, type EvmActivity } from '../../lib/evmActivity'

function readableError(error: unknown) {
  if (error && typeof error === 'object' && 'shortMessage' in error && typeof error.shortMessage === 'string') return error.shortMessage.replace(/https?:\/\/\S+/g, '[RPC]').slice(0, 250)
  return error instanceof Error ? error.message.replace(/https?:\/\/\S+/g, '[RPC]').slice(0, 250) : 'Unable to complete this request.'
}
export function LendingTrade({ market, account, smart, disabled, onBusy }: { market: LendingMarket; account?: Address; smart: boolean; disabled: boolean; onBusy: (busy: boolean) => void }) {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: 999 })!
  const { switchChainAsync } = useSwitchChain()
  const queries = useQueryClient()
  const [action, setAction] = useState<LendingAction>('supply')
  const [amount, setAmount] = useState('')
  const [review, setReview] = useState<Awaited<ReturnType<typeof prepareLending>>>()
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [message, setMessage] = useState('')
  const position = useQuery({ queryKey: ['lending-position', market.protocol, market.asset, account],
    queryFn: () => readPosition(client, market, account!), enabled: !!account, refetchInterval: 15000 })
  const short = account ? `${account.slice(0, 8)}…${account.slice(-6)}` : 'Connect wallet'
  function assertOwner(owner: Address) {
    const current = getAccount(config)
    if (current.address?.toLowerCase() !== owner.toLowerCase()) throw new Error('Wallet changed. Review again.')
  }
  function start() { if (lock.current || disabled) return false; lock.current = true; setBusy(true); onBusy(true); setMessage(''); return true }
  function finish() { lock.current = false; setBusy(false); onBusy(false) }
  async function preview() {
    if (!account || !address || !start()) return
    setReview(undefined)
    try {
      if (getActivity().some(e => e.owner.toLowerCase() === address.toLowerCase() && e.status === 'pending')) throw new Error('Check pending HyperEVM activity before starting another transaction.')
      const next = await prepareLending(client, market, account, action, amount)
      assertOwner(address)
      if (smart) {
        const signer = await getWalletClient(config)
        const { createHyperEvmSmartWallet } = await import('../../lib/alchemyWallet')
        await createHyperEvmSmartWallet(signer).prepareCalls({ account, calls: next.calls })
      }
      setReview(next)
    } catch (error) { setMessage(readableError(error)) } finally { finish() }
  }
  async function submit() {
    if (!review || !account || !address || !start()) return
    const owner = address
    let submitted: EvmActivity | undefined
    try {
      assertOwner(owner)
      if (getAccount(config).chainId !== 999) await switchChainAsync({ chainId: 999 })
      assertOwner(owner)
      const fresh = await prepareLending(client, market, account, action, amount)
      if (JSON.stringify(fresh.calls) !== JSON.stringify(review.calls)) throw new Error('Allowance or transaction details changed. Review again.')
      const signer = await getWalletClient(config, { chainId: 999 })
      assertOwner(owner)
      if (smart) {
        const { submitHyperEvmBatch } = await import('../../lib/alchemyWallet')
        const result = await submitHyperEvmBatch(signer, account, fresh.calls, id => {
          submitted = { id, owner, account, kind: 'batch', status: 'pending', label: `${action} ${amount} ${market.symbol} · ${protocols[market.protocol].name}`, createdAt: Date.now() }
          saveActivity(submitted)
          setMessage('Submitted. Waiting for confirmation…')
        })
        if (submitted) saveActivity({ ...submitted, status: result.status === 'success' ? 'confirmed' : 'failed' })
        submitted = undefined
        if (result.status !== 'success') throw new Error('The batch failed. Check transaction details.')
      } else {
        for (let i = 0; i < fresh.calls.length; i++) {
          assertOwner(owner)
          if (getAccount(config).chainId !== 999) throw new Error('Network changed. Switch back to HyperEVM and review again.')
          const call = fresh.calls[i]
          await client.call({ account, to: call.to, data: call.data })
          assertOwner(owner)
          setMessage(i < fresh.calls.length - 1 ? 'Confirm token approval in your wallet…' : 'Confirm lending transaction in your wallet…')
          const hash = await signer.sendTransaction({ account, chain: hyperEVM, to: call.to, data: call.data })
          submitted = { id: hash, owner, account, kind: 'transaction', status: 'pending', label: i < fresh.calls.length - 1 ? `Approve ${market.symbol} for ${protocols[market.protocol].name}` : `${action} ${amount} ${market.symbol} · ${protocols[market.protocol].name}`, createdAt: Date.now() }
          saveActivity(submitted)
          await trackTransaction(client, submitted)
          submitted = undefined
        }
      }
      setMessage('Confirmed on HyperEVM. Refreshing your position…')
      setAmount('')
      await queries.invalidateQueries({ queryKey: ['lending-position'] })
      await queries.invalidateQueries({ queryKey: ['lending-markets'] })
    } catch (error) {
      setMessage(submitted && getActivity().some(e => e.id === submitted?.id && e.status === 'pending') ? 'Submitted, but confirmation is uncertain. Use Check status below; do not resubmit.' : readableError(error))
    } finally { setReview(undefined); finish() }
  }
  const p = position.data
  return <section className="lending-card lending-trade">
    <h2>{market.symbol}</h2><p>{protocols[market.protocol].name} · {smart ? 'Smart account' : 'Connected wallet'} {short}</p>
    {market.symbol.toUpperCase().includes('WHYPE') && <p>To lend HYPE, first convert it to WHYPE using the converter below. You get 1 WHYPE for each HYPE.</p>}
    <div className="lending-actions">{(['supply', 'withdraw', 'borrow', 'repay'] as const).map(a => <button disabled={busy || disabled} className={action === a ? 'active' : ''} key={a} onClick={() => { setAction(a); setReview(undefined); setMessage('') }}>{a}</button>)}</div>
    <label>Amount<input aria-label="Lending amount" inputMode="decimal" value={amount} disabled={busy || disabled} onChange={e => { setAmount(e.target.value); setReview(undefined) }} placeholder="0.00" /></label>
    {p && <dl>
      <dt>Wallet balance</dt><dd>{formatUnits(p.balance, market.decimals)}</dd>
      <dt>Supplied</dt><dd>{formatUnits(p.supplied, market.decimals)}</dd>
      <dt>Variable debt</dt><dd>{formatUnits(p.debt, market.decimals)}</dd>
      <dt>Health factor</dt><dd>{p.debtBase === 0n ? 'No debt' : Number(formatUnits(p.healthFactor, 18)).toFixed(3)}</dd>
      <dt>Used as collateral</dt><dd>{p.collateralEnabled ? 'Yes' : 'No'}</dd>
    </dl>}
    {position.isError && <p role="alert">Position data unavailable. Retry before submitting.</p>}
    {review && <div className="lending-review">
      <strong>Review {action} {amount} {market.symbol}</strong>
      <p>Account: <span className="evm-address">{account}</span></p>
      <p>Protocol: {protocols[market.protocol].name} on HyperEVM</p>
      <p>{review.calls.length > 1 ? `Includes exact-amount token approval. ${smart ? 'Calls are batched.' : 'Your wallet will request each transaction separately.'}` : 'No new token approval required.'}</p>
      <p>{action === 'borrow' ? 'Creates variable-rate debt. Collateral can be liquidated if your health factor falls below 1.' : action === 'withdraw' ? 'Withdrawing collateral can reduce your health factor. The contract checks eligibility.' : 'Rates and balances can change before confirmation.'}</p>
      <button disabled={busy || disabled} onClick={submit}>{busy ? 'Processing…' : 'Confirm in wallet'}</button>
    </div>}
    {!review && <button className="trade-submit buy" disabled={busy || disabled || !account || !amount || position.isError || !p} onClick={preview}>{busy ? 'Checking…' : account ? 'Review transaction' : 'Connect wallet'}</button>}
    {message && <p role="status">{message}</p>}
  </section>
}
