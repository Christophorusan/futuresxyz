import { AssetLabel } from '../AssetLabel'
import { useRef, useState } from 'react'
import { usePublicClient, useSwitchChain } from 'wagmi'
import { getAccount, getWalletClient } from 'wagmi/actions'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { encodeFunctionData, erc20Abi, formatUnits, type Address } from 'viem'
import { config, hyperEVM } from '../../config/wagmi'
import { parseAmount } from '../../lib/lending/transactions'
import type { LendingMarket } from '../../lib/lending/markets'
import { getActivity, saveActivity, type EvmActivity } from '../../lib/evmActivity'
import { trackTransaction } from '../../lib/transactionReceipt'

export function SmartAccountTransfer({ owner, smartAccount, market, disabled, onBusy }: {
  owner: Address; smartAccount: Address; market?: LendingMarket; disabled: boolean; onBusy: (value: boolean) => void
}) {
  const client = usePublicClient({ chainId: 999 })!
  const { switchChainAsync } = useSwitchChain()
  const queries = useQueryClient()
  const [outgoing, setOutgoing] = useState(false)
  const [native, setNative] = useState(true)
  const [amount, setAmount] = useState('')
  const [review, setReview] = useState(false)
  const [message, setMessage] = useState('')
  const lock = useRef(false)
  const from = outgoing ? smartAccount : owner
  const to = outgoing ? owner : smartAccount
  const decimals = native ? 18 : market?.decimals ?? 18
  const symbol = native ? 'HYPE' : market?.symbol ?? ''
  const balance = useQuery({ queryKey: ['account-transfer-balance', from, native ? 'HYPE' : market?.asset],
    queryFn: () => native ? client.getBalance({ address: from }) : client.readContract({ address: market!.asset, abi: erc20Abi, functionName: 'balanceOf', args: [from] }),
    enabled: native || !!market, refetchInterval: 15000 })
  async function submit() {
    if (disabled || lock.current || (!native && !market)) return
    lock.current = true; onBusy(true); setMessage('')
    let record: EvmActivity | undefined
    try {
      if (getActivity().some(e => e.owner.toLowerCase() === owner.toLowerCase() && e.status === 'pending')) throw new Error('Resolve pending activity first.')
      const value = parseAmount(amount, decimals)
      const current = await balance.refetch()
      if (current.isError || current.data === undefined || current.data < value) throw new Error('Unable to verify sufficient funds in the source account.')
      if (getAccount(config).chainId !== 999) await switchChainAsync({ chainId: 999 })
      if (getAccount(config).address?.toLowerCase() !== owner.toLowerCase()) throw new Error('Owner wallet changed. Reconnect and review again.')
      const signer = await getWalletClient(config, { chainId: 999 })
      const call = native ? { to, data: '0x' as const, value } : { to: market!.asset, data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to, value] }), value: 0n }
      if (native) await client.call({ account: from, ...call })
      else {
        const simulation = await client.simulateContract({ account: from, address: market!.asset, abi: erc20Abi, functionName: 'transfer', args: [to, value] })
        if (!simulation.result) throw new Error('The token rejected this transfer.')
      }
      if (getAccount(config).address?.toLowerCase() !== owner.toLowerCase()) throw new Error('Owner wallet changed. Review again.')
      const submitted = (id: string, kind: EvmActivity['kind']) => {
        record = { id, kind, owner, account: from, createdAt: Date.now(), status: 'pending', label: `${outgoing ? 'Withdraw from' : 'Fund'} smart account: ${amount} ${symbol}` }
        saveActivity(record)
      }
      if (outgoing) {
        const { submitHyperEvmBatch } = await import('../../lib/alchemyWallet')
        const result = await submitHyperEvmBatch(signer, smartAccount, [call], id => submitted(id, 'batch'))
        if (record) saveActivity({ ...record, status: result.status === 'success' ? 'confirmed' : 'failed' })
        record = undefined
        if (result.status !== 'success') throw new Error('Transfer failed. Check activity.')
      } else {
        const hash = await signer.sendTransaction({ account: owner, chain: hyperEVM, ...call })
        submitted(hash, 'transaction')
        if (record) await trackTransaction(client, record)
        record = undefined
      }
      setAmount(''); setMessage('Transfer confirmed.')
      await queries.invalidateQueries({ queryKey: ['account-transfer-balance'] })
      await queries.invalidateQueries({ queryKey: ['lending-position'] })
      await queries.invalidateQueries({ queryKey: ['hype-balances'] })
    } catch (error) {
      setMessage(record && getActivity().some(e => e.id === record?.id && e.status === 'pending') ? 'Submitted; confirmation is uncertain. Check activity before retrying.' : error instanceof Error && !error.message.includes('http') ? error.message.slice(0, 180) : 'Unable to transfer. Check wallet, balance and gas.')
    } finally { lock.current = false; onBusy(false); setReview(false) }
  }
  return <section className="lending-card"><h3>Move funds to or from your smart account</h3>
    <p>Transfers wallet tokens only. Supplied collateral and outstanding loans are not moved. Leave HYPE for gas when gas is not sponsored.</p>
    <div className="lending-actions"><button disabled={disabled} onClick={() => { setOutgoing(!outgoing); setReview(false) }}>{outgoing ? 'Smart account → connected wallet' : 'Connected wallet → smart account'}</button>
      <AssetLabel symbol={native ? 'HYPE' : market?.symbol || 'HYPE'} size={24} /><select aria-label="Transfer asset" disabled={disabled} value={native ? 'native' : 'token'} onChange={e => { setNative(e.target.value === 'native'); setAmount(''); setReview(false) }}><option value="native">HYPE</option>{market && <option value="token">{market.symbol}</option>}</select>
      <input aria-label="Transfer amount" inputMode="decimal" disabled={disabled} value={amount} placeholder="Amount" onChange={e => { setAmount(e.target.value); setReview(false) }} />
      <button disabled={disabled || !amount || balance.isError || balance.data === undefined} onClick={() => setReview(true)}>Review transfer</button></div>
    <p>Available: {balance.data !== undefined ? `${formatUnits(balance.data, decimals)} ${symbol}` : 'Unavailable'}</p>
    {review && <div className="lending-review"><strong>Transfer {amount} {symbol} on HyperEVM</strong><p className="evm-address">From: {from}<br />To: {to}</p><button disabled={disabled} onClick={submit}>Confirm in wallet</button></div>}
    {message && <p role="status">{message}</p>}
  </section>
}
