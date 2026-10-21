import { useState, useRef } from 'react'
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi'
import { getAccount, getWalletClient } from 'wagmi/actions'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { encodeFunctionData, erc20Abi, formatEther, parseAbi, type Address } from 'viem'
import { trackTransaction } from '../../lib/transactionReceipt'
import { config, hyperEVM } from '../../config/wagmi'
import { parseAmount } from '../../lib/lending/transactions'
import { getActivity, saveActivity, type EvmActivity } from '../../lib/evmActivity'
const whype = '0x5555555555555555555555555555555555555555'
const abi = parseAbi(['function deposit() payable', 'function withdraw(uint256 amount)'])

export function HypeWrap({ account, smart, disabled, onBusy }: { account?: Address; smart: boolean; disabled: boolean; onBusy: (busy: boolean) => void }) {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: 999 })!
  const { switchChainAsync } = useSwitchChain()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'wrap' | 'unwrap'>('wrap')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [review, setReview] = useState(false)
  const lock = useRef(false)
  const balance = useQuery({ queryKey: ['hype-balances', account], enabled: !!account, refetchInterval: 15000,
    queryFn: async () => {
      const [native, wrapped] = await Promise.all([client.getBalance({ address: account! }), client.readContract({ address: whype, abi: erc20Abi, functionName: 'balanceOf', args: [account!] })])
      return { native, wrapped }
    } })
  async function submit() {
    if (!account || !address || lock.current || disabled) return
    lock.current = true; onBusy(true); setMessage('')
    let entry: EvmActivity | undefined
    try {
      if (getActivity().some(e => e.owner.toLowerCase() === address.toLowerCase() && e.status === 'pending')) throw new Error('Resolve pending activity first.')
      const value = parseAmount(amount, 18)
      const fresh = await balance.refetch()
      if (!fresh.data || fresh.isError) throw new Error('Unable to verify balance.')
      if (value > (mode === 'wrap' ? fresh.data.native : fresh.data.wrapped)) throw new Error('Insufficient balance.')
      if (getAccount(config).chainId !== 999) await switchChainAsync({ chainId: 999 })
      if (getAccount(config).address !== address) throw new Error('Wallet changed. Review again.')
      const signer = await getWalletClient(config, { chainId: 999 })
      const call = mode === 'wrap' ? { to: whype, data: encodeFunctionData({ abi, functionName: 'deposit' }), value } as const
        : { to: whype, data: encodeFunctionData({ abi, functionName: 'withdraw', args: [value] }), value: 0n } as const
      await client.call({ account, ...call })
      if (getAccount(config).address !== address) throw new Error('Wallet changed. Review again.')
      const record = (id: string, kind: EvmActivity['kind']) => {
        entry = { id, kind, owner: address, account, label: `${mode} ${amount} HYPE`, createdAt: Date.now(), status: 'pending' }
        saveActivity(entry)
      }
      if (smart) {
        const { submitHyperEvmBatch } = await import('../../lib/alchemyWallet')
        const result = await submitHyperEvmBatch(signer, account, [call], id => record(id, 'batch'))
        if (entry) saveActivity({ ...entry, status: result.status === 'success' ? 'confirmed' : 'failed' })
        entry = undefined
        if (result.status !== 'success') throw new Error('Transaction failed.')
      } else {
        const id = await signer.sendTransaction({ account, chain: hyperEVM, ...call })
        record(id, 'transaction')
        if (entry) await trackTransaction(client, entry)
        entry = undefined
      }
      setAmount(''); setMessage('Confirmed. Balances are refreshing.')
      await queryClient.invalidateQueries({ queryKey: ['hype-balances'] })
      await queryClient.invalidateQueries({ queryKey: ['lending-position'] })
    } catch (error) {
      setMessage(entry && getActivity().some(e => e.id === entry?.id && e.status === 'pending') ? 'Submitted; confirmation is uncertain. Check activity before resubmitting.' : error instanceof Error && !error.message.includes('http') ? error.message.slice(0, 180) : 'Unable to submit. Check your wallet and gas balance.')
    } finally { lock.current = false; onBusy(false); setReview(false) }
  }
  return <section className="lending-card"><h3>Prepare HYPE for lending</h3><p>Convert HYPE to WHYPE, the version used for lending, or convert it back. The exchange is 1 for 1. Converting alone does not earn rewards. Keep a little HYPE in your wallet to pay network fees.</p>
    {balance.data && <p>{formatEther(balance.data.native)} HYPE · {formatEther(balance.data.wrapped)} WHYPE</p>}
    <div className="lending-actions"><button disabled={disabled} onClick={() => { setMode(mode === 'wrap' ? 'unwrap' : 'wrap'); setReview(false) }}>{mode === 'wrap' ? 'Convert HYPE → WHYPE' : 'Convert WHYPE → HYPE'}</button>
      <input aria-label="Wrap amount" inputMode="decimal" placeholder="Amount" value={amount} disabled={disabled} onChange={e => { setAmount(e.target.value); setReview(false) }} />
      <button disabled={disabled || !account || !amount} onClick={() => setReview(true)}>Review</button></div>
    {review && <div className="lending-review"><p>{mode} {amount} {mode === 'wrap' ? 'HYPE' : 'WHYPE'} at 1:1. Network: HyperEVM. Account: <span className="evm-address">{account}</span></p><button disabled={disabled} onClick={submit}>Confirm in wallet</button></div>}
    {message && <p role="status">{message}</p>}
  </section>
}
