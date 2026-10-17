import { encodeFunctionData, erc20Abi, parseUnits, type Address, type PublicClient } from 'viem'
import { poolAbi, protocols, type LendingAction } from './contracts'
import { readMarket, readPosition, verifyProtocol, type LendingMarket, type LendingPosition } from './markets'
import type { ContractCall } from '../alchemyWallet'

export function parseAmount(input: string, decimals: number) {
  if (!/^\d+(\.\d+)?$/.test(input) || (input.split('.')[1]?.length ?? 0) > decimals) throw new Error('Enter a positive amount within the token precision.')
  const amount = parseUnits(input, decimals)
  if (amount <= 0n) throw new Error('Enter an amount greater than zero.')
  return amount
}
export function validateAction(m: LendingMarket, p: LendingPosition, action: LendingAction, amount: bigint) {
  if (amount <= 0n) throw new Error('Amount must be positive.')
  if (!m.active || m.paused) throw new Error('This reserve is inactive or paused.')
  if ((action === 'supply' || action === 'borrow') && m.frozen) throw new Error('This reserve is frozen.')
  const unit = 10n ** BigInt(m.decimals)
  if ((action === 'supply' || action === 'repay') && amount > p.balance) throw new Error('Insufficient balance in the selected account.')
  if (action === 'supply' && m.supplyCap && m.supply + amount > m.supplyCap * unit) throw new Error('Supply cap exceeded.')
  if (action === 'borrow') {
    if (!m.borrowing) throw new Error('Borrowing is disabled for this reserve.')
    if (p.price <= 0n) throw new Error('No valid oracle price.')
    if (m.borrowCap && m.debt + amount > m.borrowCap * unit) throw new Error('Borrow cap exceeded.')
    if (amount * p.price > p.availableBorrowsBase * unit) throw new Error('Insufficient available collateral for this borrow.')
  }
  if ((action === 'borrow' || action === 'withdraw') && amount > p.liquidity) throw new Error('Insufficient available pool liquidity.')
  if (action === 'withdraw' && amount > p.supplied) throw new Error('Amount exceeds your supplied balance.')
  if (action === 'repay' && !p.debt) throw new Error('This account has no variable debt in this market.')
}
export function buildLendingCalls(m: LendingMarket, p: LendingPosition, account: Address, action: LendingAction, amount: bigint): ContractCall[] {
  validateAction(m, p, action, amount)
  const pool = protocols[m.protocol].pool
  const calls: ContractCall[] = []
  if ((action === 'supply' || action === 'repay') && p.allowance < amount) {
    // Zero-reset is compatible with tokens that reject a nonzero -> nonzero approval.
    if (p.allowance > 0n) calls.push({ to: m.asset, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [pool, 0n] }) })
    calls.push({ to: m.asset, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [pool, amount] }) })
  }
  const data = action === 'supply'
    ? encodeFunctionData({ abi: poolAbi, functionName: 'supply', args: [m.asset, amount, account, 0] })
    : action === 'withdraw'
      ? encodeFunctionData({ abi: poolAbi, functionName: 'withdraw', args: [m.asset, amount, account] })
      : action === 'borrow'
        ? encodeFunctionData({ abi: poolAbi, functionName: 'borrow', args: [m.asset, amount, 2n, 0, account] })
        : encodeFunctionData({ abi: poolAbi, functionName: 'repay', args: [m.asset, amount, 2n, account] })
  calls.push({ to: pool, data })
  return calls
}
export async function prepareLending(client: PublicClient, selected: LendingMarket, account: Address, action: LendingAction, input: string) {
  await verifyProtocol(client, selected.protocol)
  const market = await readMarket(client, selected.protocol, selected.asset, selected.symbol)
  const position = await readPosition(client, market, account)
  const amount = parseAmount(input, market.decimals)
  const calls = buildLendingCalls(market, position, account, action, amount)
  // Contract validation is authoritative for e-mode, isolation, siloed debt and withdrawal health.
  // For approval-dependent actions, simulate the pool call with a temporary allowance override
  // only in fork tests; production simulates after approvals or through Alchemy prepareCalls.
  if (calls.length === 1) await client.call({ account, to: calls[0].to, data: calls[0].data })
  return { calls, market, position, amount, account, action }
}
