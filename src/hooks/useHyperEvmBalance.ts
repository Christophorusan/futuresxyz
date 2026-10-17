import { useAccount, useBalance, useReadContract } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { hyperEVM } from '../config/wagmi'

// Addresses already used by the app. Unknown tokens remain unavailable, not zero.
const tokens: Record<string, `0x${string}`> = {
  USDC: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
  USDT0: '0xB8CE59fc3717ada4C02eadf9682A9e934F625Ebb',
  WHYPE: '0x5555555555555555555555555555555555555555',
}
export function useHyperEvmBalance(symbol?: string) {
  const { address } = useAccount()
  const supported = symbol === 'HYPE' || !!(symbol && tokens[symbol])
  const native = useBalance({ address, chainId: hyperEVM.id,
    query: { enabled: !!address && symbol === 'HYPE', refetchInterval: 15000 } })
  const token = symbol ? tokens[symbol] : undefined
  const balance = useReadContract({ address: token, abi: erc20Abi, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: hyperEVM.id,
    query: { enabled: !!address && !!token, refetchInterval: 15000 } })
  const decimals = useReadContract({ address: token, abi: erc20Abi, functionName: 'decimals',
    chainId: hyperEVM.id, query: { enabled: !!address && !!token, staleTime: Infinity } })
  if (!address) return 'Connect wallet'
  if (!supported) return 'Unavailable'
  if (symbol === 'HYPE') {
    if (native.isError) return 'Unable to load'
    return native.data ? `${formatUnits(native.data.value, native.data.decimals)} HYPE` : 'Loading…'
  }
  if (balance.isError || decimals.isError) return 'Unable to load'
  return balance.data !== undefined && decimals.data !== undefined
    ? `${formatUnits(balance.data, decimals.data)} ${symbol}` : 'Loading…'
}
