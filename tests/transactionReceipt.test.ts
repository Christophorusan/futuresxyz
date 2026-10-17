import { beforeEach, expect, test, vi } from 'vitest'
import type { PublicClient } from 'viem'
import { trackTransaction } from '../src/lib/transactionReceipt'
import type { EvmActivity } from '../src/lib/evmActivity'
const saved = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/evmActivity', () => ({ saveActivity: saved }))
const entry: EvmActivity = { id: '0x1234', kind: 'transaction', owner: '0x1111111111111111111111111111111111111111', account: '0x1111111111111111111111111111111111111111', label: 'Supply', createdAt: 1, status: 'pending' }
beforeEach(() => vi.clearAllMocks())
test('cancelled replacement never counts as a successful lending action', async () => {
  const client = { waitForTransactionReceipt: vi.fn(async ({ onReplaced }) => {
    onReplaced({ reason: 'cancelled', transaction: { hash: '0x5678' } })
    return { status: 'success' }
  }) } as unknown as PublicClient
  await expect(trackTransaction(client, entry)).rejects.toThrow('cancelled or replaced')
  expect(saved).toHaveBeenCalledWith({ ...entry, status: 'failed' })
})
test('repriced transaction tracks replacement hash and confirms', async () => {
  const client = { waitForTransactionReceipt: vi.fn(async ({ onReplaced }) => {
    onReplaced({ reason: 'repriced', transaction: { hash: '0x5678' } })
    return { status: 'success' }
  }) } as unknown as PublicClient
  await expect(trackTransaction(client, entry)).resolves.toEqual({ status: 'success' })
  expect(saved).toHaveBeenLastCalledWith({ ...entry, id: '0x5678', status: 'confirmed' })
})
test('timeout preserves pending state instead of declaring failure', async () => {
  const client = { waitForTransactionReceipt: vi.fn().mockRejectedValue(new Error('timeout')) } as unknown as PublicClient
  await expect(trackTransaction(client, entry)).rejects.toThrow('timeout')
  expect(saved).not.toHaveBeenCalled()
})
