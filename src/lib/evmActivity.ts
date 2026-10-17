import type { Address } from 'viem'
export interface EvmActivity {
  id: string; kind: 'transaction' | 'batch'; owner: Address; account: Address
  label: string; status: 'pending' | 'confirmed' | 'failed'; createdAt: number
}
let memory: EvmActivity[] = []
const key = 'futuresxyz:evm-activity:v1'
export function getActivity(): EvmActivity[] {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return memory
    const data: unknown = JSON.parse(saved)
    if (!Array.isArray(data)) return []
    return data.filter((v): v is EvmActivity => v && typeof v.id === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v.owner) && /^0x[0-9a-fA-F]{40}$/.test(v.account) && ['transaction', 'batch'].includes(v.kind) && ['pending', 'confirmed', 'failed'].includes(v.status) && typeof v.label === 'string' && typeof v.createdAt === 'number')
  } catch { return memory }
}
export function saveActivity(entry: EvmActivity) {
  const entries = getActivity().filter(v => v.id !== entry.id)
  // Keep all unresolved records; only trim completed history.
  const pending = entries.filter(v => v.status === 'pending')
  const completed = entries.filter(v => v.status !== 'pending').slice(0, 49)
  memory = [entry, ...pending, ...completed]
  try { localStorage.setItem(key, JSON.stringify(memory)) } catch { /* In-memory tracking when browser storage is unavailable. */ }
  window.dispatchEvent(new Event('evm-activity'))
}
