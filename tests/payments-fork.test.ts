import { test, expect } from 'vitest'
import { createPublicClient, createTestClient, createWalletClient, http, parseEther, parseAbi, encodeFunctionData, erc20Abi } from 'viem'
import { hyperEvm } from 'viem/chains'
import { paymentAssets, preparePayment } from '../src/lib/payments'
// Loopback-only functional smoke test: no public transactions or real funds.
const transport = http('http://127.0.0.1:8545', { timeout: 60000 })
const client = createPublicClient({ chain: hyperEvm, transport })
const testClient = createTestClient({ chain: hyperEvm, mode: 'anvil', transport })
const owner = '0x0000000000000000000000000000000000005678'
const to = '0x0000000000000000000000000000000000009876'
const wallet = createWalletClient({ account: owner, chain: hyperEvm, transport })
test.skipIf(process.env.FORK_TEST !== '1')('native and ERC20 payments arrive at the reviewed recipient on a local fork', async () => {
  expect(await testClient.getAutomine()).toBe(true)
  const snapshot = await testClient.snapshot()
  try {
    await testClient.impersonateAccount({ address: owner })
    await testClient.setBalance({ address: owner, value: parseEther('100') })
    const before = await client.getBalance({ address: to })
    const native = await preparePayment(client, owner, to, paymentAssets[3], '0.25')
    const hash = await wallet.sendTransaction(native.call)
    expect((await client.waitForTransactionReceipt({ hash })).status).toBe('success')
    expect(await client.getBalance({ address: to })).toBe(before + parseEther('0.25'))
    const asset = paymentAssets[4]
    const wrap = await wallet.sendTransaction({ to: asset.address, data: encodeFunctionData({ abi: parseAbi(['function deposit() payable']), functionName: 'deposit' }), value: parseEther('2') })
    await client.waitForTransactionReceipt({ hash: wrap })
    const beforeToken = await client.readContract({ address: asset.address, abi: erc20Abi, functionName: 'balanceOf', args: [to] })
    const token = await preparePayment(client, owner, to, asset, '1.123456789012345678')
    const tokenHash = await wallet.sendTransaction(token.call)
    expect((await client.waitForTransactionReceipt({ hash: tokenHash })).status).toBe('success')
    expect(await client.readContract({ address: asset.address, abi: erc20Abi, functionName: 'balanceOf', args: [to] })).toBe(beforeToken + parseEther('1.123456789012345678'))
  } finally { await testClient.revert({ id: snapshot }) }
}, 120000)
