import type { Hash, PublicClient } from 'viem'
import { saveActivity, type EvmActivity } from './evmActivity'

export async function trackTransaction(client: PublicClient, original: EvmActivity) {
  let current = original
  let replacedByDifferentTransaction = false
  const receipt = await client.waitForTransactionReceipt({
    hash: original.id as Hash, timeout: 120000,
    onReplaced: replacement => {
      saveActivity({ ...current, status: 'failed' })
      replacedByDifferentTransaction = replacement.reason !== 'repriced'
      current = { ...current, id: replacement.transaction.hash,
        label: replacedByDifferentTransaction ? `Replacement for ${original.label}` : original.label }
      saveActivity(current)
    },
  })
  saveActivity({ ...current, status: receipt.status === 'success' ? 'confirmed' : 'failed' })
  if (replacedByDifferentTransaction) throw new Error('Transaction was cancelled or replaced. Review the current position before continuing.')
  if (receipt.status !== 'success') throw new Error('Transaction reverted. Check activity for details.')
  return receipt
}
