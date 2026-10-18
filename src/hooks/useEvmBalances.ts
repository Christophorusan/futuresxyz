import { useCallback } from 'react'
import { useAlchemyBalanceUpdates } from './useAlchemyBalanceUpdates'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { hyperEVM } from '../config/wagmi'
const TOKENS = [
  { symbol: 'USDC', address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' },
  { symbol: 'USDT0', address: '0xB8CE59fc3717ada4C02eadf9682A9e934F625Ebb' },
  { symbol: 'USDH', address: '0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5' },
  { symbol: 'WHYPE', address: '0x5555555555555555555555555555555555555555' },
] as const
export interface EvmBalance { symbol: string; balance: string; raw: bigint }
export function useEvmBalances() {
  const { address, isConnected } = useAccount()
  const native = useBalance({ address, chainId: hyperEVM.id, query: { enabled: !!address, refetchInterval: 15000 } })
  const contracts = TOKENS.flatMap(token => [
    { address: token.address, abi: erc20Abi, functionName: 'balanceOf' as const, args: [address!] as const, chainId: hyperEVM.id },
    { address: token.address, abi: erc20Abi, functionName: 'decimals' as const, chainId: hyperEVM.id },
  ])
  const { data, isLoading, isError, refetch } = useReadContracts({ contracts: address ? contracts : [],
    query: { enabled: isConnected && !!address, refetchInterval: 15000 } })
  const nativeRefetch = native.refetch
  const refresh = useCallback(() => { void nativeRefetch(); void refetch() }, [nativeRefetch, refetch])
  useAlchemyBalanceUpdates(isConnected && !!address, refresh)
  const balances: EvmBalance[] = []
  if (native.data) balances.push({ symbol: 'HYPE', balance: formatUnits(native.data.value, native.data.decimals), raw: native.data.value })
  TOKENS.forEach((token, i) => {
    const balance = data?.[i * 2]; const decimals = data?.[i * 2 + 1]
    if (balance?.status === 'success' && decimals?.status === 'success') {
      const raw = balance.result as bigint
      balances.push({ symbol: token.symbol, balance: formatUnits(raw, decimals.result as number), raw })
    }
  })
  return { balances: balances.filter(b => b.raw > 0n), isLoading: isLoading || native.isLoading,
    isError: isError || native.isError || data?.some(d => d.status === 'failure') }
}
