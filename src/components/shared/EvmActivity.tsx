import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import type { Hash } from 'viem'
import { getActivity, saveActivity, type EvmActivity as Activity } from '../../lib/evmActivity'

export function EvmActivity() {
  const { address } = useAccount()
  const { data: signer } = useWalletClient()
  const client = usePublicClient({ chainId: 999 })
  const [entries, setEntries] = useState(getActivity)
  const [checking, setChecking] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    const update = () => setEntries(getActivity())
    window.addEventListener('evm-activity', update)
    window.addEventListener('storage', update)
    return () => { window.removeEventListener('evm-activity', update); window.removeEventListener('storage', update) }
  }, [])
  async function check(entry: Activity) {
    if (!client) return
    setChecking(entry.id); setMessage('')
    try {
      if (entry.kind === 'transaction') {
        const receipt = await client.getTransactionReceipt({ hash: entry.id as Hash })
        saveActivity({ ...entry, status: receipt.status === 'success' ? 'confirmed' : 'failed' })
      } else {
        if (!signer) throw new Error('Connect wallet to check smart-account activity.')
        const { createHyperEvmSmartWallet } = await import('../../lib/alchemyWallet')
        const result = await createHyperEvmSmartWallet(signer).getCallsStatus({ id: entry.id })
        if (result.status === 'success' || result.status === 'failure') saveActivity({ ...entry, status: result.status === 'success' ? 'confirmed' : 'failed' })
        else setMessage('Still pending. No transaction was resubmitted.')
      }
    } catch { setMessage('No final receipt available yet. Check again later; do not resubmit an uncertain transaction.') }
    finally { setChecking('') }
  }
  const visible = entries.filter(e => e.owner.toLowerCase() === address?.toLowerCase()).slice(0, 10)
  if (!visible.length) return null
  return <section className="lending-card"><h3>HyperEVM activity</h3><p>Transactions initiated in this browser · latest 10 shown. Incoming transfers are available in your account explorer.</p>
    {visible.map(e => <div key={e.id} className="evm-activity-row">
      <span>{e.label} · {e.status}</span>
      {e.kind === 'transaction' ? <a href={`https://hyperevmscan.io/tx/${e.id}`} target="_blank" rel="noreferrer">View transaction</a> : <span title={e.id}>Batch {e.id.slice(0, 12)}…</span>}
      {e.status === 'pending' && <button disabled={!!checking} onClick={() => check(e)}>{checking === e.id ? 'Checking…' : 'Check status'}</button>}
    </div>)}
    {message && <p role="status">{message}</p>}
  </section>
}
