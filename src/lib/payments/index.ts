import { encodeFunctionData, erc20Abi, getAddress, isAddress, zeroAddress, type Address, type PublicClient } from 'viem'
import { parseAmount } from '../lending/transactions'

export const paymentAssets = [
  { symbol: 'USDC', address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' },
  { symbol: 'USDT0', address: '0xB8CE59fc3717ada4C02eadf9682A9e934F625Ebb' },
  { symbol: 'USDH', address: '0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5' },
  { symbol: 'HYPE', address: undefined },
  { symbol: 'WHYPE', address: '0x5555555555555555555555555555555555555555' },
] as const
export type PaymentAsset = typeof paymentAssets[number]
export function recipientAddress(value: string): Address {
  if (!isAddress(value, { strict: true }) || value.toLowerCase() === zeroAddress) throw new Error('Enter a valid nonzero wallet address. Check mixed-case checksums.')
  return getAddress(value)
}
export function parsePaymentRequest(hash: string) {
  if (!hash || hash === '#') return undefined
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (params.get('chain') !== '999') throw new Error('This payment request is not for HyperEVM (999).')
  const to = recipientAddress(params.get('to') || '')
  const asset = paymentAssets.find(a => a.symbol === params.get('asset'))
  if (!asset) throw new Error('Unsupported payment-request asset.')
  const amount = params.get('amount') || ''
  if (amount && (!/^\d+(\.\d+)?$/.test(amount) || amount.length > 80)) throw new Error('Invalid requested amount.')
  return { to, asset, amount }
}
export function paymentRequest(base: string, to: Address, asset: PaymentAsset, amount: string, decimals: number) {
  recipientAddress(to)
  if (amount) parseAmount(amount, decimals)
  const params = new URLSearchParams({ chain: '999', to, asset: asset.symbol })
  if (amount) params.set('amount', amount)
  return `${base.split('#')[0]}#${params}`
}
export async function readPaymentBalance(client: PublicClient, account: Address, asset: PaymentAsset) {
  if (await client.getChainId() !== 999) throw new Error('Unexpected payment network.')
  if (!asset.address) return { balance: await client.getBalance({ address: account }), decimals: 18 }
  const [balance, decimals] = await Promise.all([
    client.readContract({ address: asset.address, abi: erc20Abi, functionName: 'balanceOf', args: [account] }),
    client.readContract({ address: asset.address, abi: erc20Abi, functionName: 'decimals' }),
  ])
  return { balance, decimals }
}
export async function preparePayment(client: PublicClient, account: Address, recipient: string, asset: PaymentAsset, input: string, smart = false) {
  const to = recipientAddress(recipient)
  if (to.toLowerCase() === account.toLowerCase()) throw new Error('Choose a recipient other than the sending account.')
  if (to.toLowerCase() === asset.address?.toLowerCase()) throw new Error('Do not send tokens to their own token contract.')
  const { balance, decimals } = await readPaymentBalance(client, account, asset)
  const amount = parseAmount(input, decimals)
  if (amount > balance) throw new Error('Insufficient balance in this account.')
  const call = asset.address
    ? { to: asset.address, data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to, amount] }), value: 0n }
    : { to, data: '0x' as const, value: amount }
  if (asset.address) {
    const result = await client.simulateContract({ account, address: asset.address, abi: erc20Abi, functionName: 'transfer', args: [to, amount] })
    if (!result.result) throw new Error('The token rejected this payment.')
  }
  let fee: bigint | undefined
  if (!smart) {
    const [gas, gasPrice, native] = await Promise.all([client.estimateGas({ account, ...call }), client.getGasPrice(), client.getBalance({ address: account })])
    fee = gas * gasPrice
    if (native < call.value + fee) throw new Error('Leave enough HYPE to cover the network fee.')
  }
  return { to, call, amount, decimals, fee }
}
