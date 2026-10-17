import { alchemyWalletTransport, createSmartWalletClient } from '@alchemy/wallet-apis'
import { createWalletClient, custom, type WalletClient, type Address, type Hex } from 'viem'
import { hyperEVM } from '../config/wagmi'
import { alchemyApiKey, gasPolicyId } from '../config/alchemy'

export function createHyperEvmSmartWallet(signer: WalletClient) {
  if (!alchemyApiKey) throw new Error('Alchemy wallet services are not configured.')
  if (!signer.account) throw new Error('Connect a wallet first.')
  return createSmartWalletClient({
    signer: createWalletClient({ account: signer.account, chain: hyperEVM, transport: custom({ request: signer.request }) }),
    chain: hyperEVM,
    transport: alchemyWalletTransport({ apiKey: alchemyApiKey }),
    ...(gasPolicyId ? { paymaster: { policyId: gasPolicyId } } : {}),
  })
}

export type ContractCall = { to: Address; data: Hex; value?: bigint }

// Protocol adapters must build and review calls before invoking this function.
// Never substitute the owner's address for the separate HyperEVM smart account.
export async function submitHyperEvmBatch(
  signer: WalletClient,
  expectedAccount: Address,
  calls: ContractCall[],
  onSubmitted: (id: string) => void,
) {
  if (!calls.length) throw new Error('No transactions to submit.')
  const client = createHyperEvmSmartWallet(signer)
  const { address } = await client.requestAccount({ creationHint: { accountType: 'sma-b' } })
  if (address.toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error('Wallet changed. Review the account and transaction again.')
  }
  const { id } = await client.sendCalls({ account: address, calls })
  onSubmitted(id) // Preserve ID even if receipt polling times out. Do not blindly resubmit.
  return client.waitForCallsStatus({ id })
}
