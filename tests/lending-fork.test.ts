import { test, expect } from 'vitest'
import { createPublicClient, createTestClient, createWalletClient, http, parseEther, parseAbi, encodeFunctionData, erc20Abi } from 'viem'
import { hyperEvm } from 'viem/chains'
import { readMarket, readPosition } from '../src/lib/lending/markets'
import { prepareLending } from '../src/lib/lending/transactions'
const enabled = process.env.FORK_TEST === '1'
// Hardcoded loopback only: never send these transactions to a public RPC.
const transport = http('http://127.0.0.1:8545', { timeout: 60000 })
const client = createPublicClient({ chain: hyperEvm, transport })
const testClient = createTestClient({ chain: hyperEvm, mode: 'anvil', transport })
const owner = '0x0000000000000000000000000000000000005678'
const wallet = createWalletClient({ account: owner, chain: hyperEvm, transport })
const wrapAbi = parseAbi(['function deposit() payable', 'function withdraw(uint256 amount)'])
for (const protocol of ['hyperlend'] as const) {
  test.skipIf(!enabled)(`${protocol}: lending lifecycle and current reserve constraints on local fork`, async () => {
    expect(await testClient.getAutomine()).toBe(true)
    const snapshot = await testClient.snapshot()
    try {
      await testClient.impersonateAccount({ address: owner })
      await testClient.setBalance({ address: owner, value: parseEther('100') })
      // Public upstream serves latest state. Advance local time to avoid negative
      // accrual from newly fetched timestamps. Functional smoke test, not archival simulation.
      const block = await client.getBlock()
      const target = BigInt(Math.floor(Date.now() / 1000) + 300)
      await testClient.setNextBlockTimestamp({ timestamp: target > block.timestamp ? target : block.timestamp + 1n })
      await testClient.mine({ blocks: 1 })
      const collateral = await readMarket(client, protocol, '0x5555555555555555555555555555555555555555', 'WHYPE')
      const borrowed = collateral
      const wrap = await wallet.sendTransaction({ to: collateral.asset, data: encodeFunctionData({ abi: wrapAbi, functionName: 'deposit' }), value: parseEther('20') })
      expect((await client.waitForTransactionReceipt({ hash: wrap })).status).toBe('success')
      const borrowCapped = borrowed.borrowCap > 0n && borrowed.debt >= borrowed.borrowCap * 10n ** BigInt(borrowed.decimals)
      const steps = borrowCapped ? [['supply', '10'], ['withdraw', '9']] as const : [['supply','10'], ['borrow','0.05'], ['repay','0.051'], ['withdraw','9']] as const
      if (borrowCapped) {
        await expect(prepareLending(client, borrowed, owner, 'borrow', '0.05')).rejects.toThrow('cap')
      }
      for (const [action, amount] of steps) {
        const market = action === 'borrow' || action === 'repay' ? borrowed : collateral
        const prepared = await prepareLending(client, market, owner, action, amount)
        for (const call of prepared.calls) {
          await client.call({ account: owner, to: call.to, data: call.data })
          const hash = await wallet.sendTransaction({ to: call.to, data: call.data })
          expect((await client.waitForTransactionReceipt({ hash })).status).toBe('success')
        }
        const position = await readPosition(client, market, owner)
        if (action === 'supply') expect(position.supplied).toBeGreaterThanOrEqual(parseEther('10') - 1n)
        if (action === 'borrow') expect(position.debt).toBeGreaterThan(0n)
        if (action === 'repay') expect(position.debt).toBe(0n)
        if (action === 'withdraw') expect(position.supplied).toBeLessThan(parseEther('1.01'))
      }
      await expect(prepareLending(client, borrowed, owner, 'borrow', '1000000')).rejects.toThrow()
      const before = await client.readContract({ address: collateral.asset, abi: erc20Abi, functionName: 'balanceOf', args: [owner] })
      const unwrap = await wallet.sendTransaction({ to: collateral.asset, data: encodeFunctionData({ abi: wrapAbi, functionName: 'withdraw', args: [parseEther('1')] }) })
      expect((await client.waitForTransactionReceipt({ hash: unwrap })).status).toBe('success')
      expect(await client.readContract({ address: collateral.asset, abi: erc20Abi, functionName: 'balanceOf', args: [owner] })).toBe(before - parseEther('1'))
    } finally { await testClient.revert({ id: snapshot }) }
  }, 180000)
}
