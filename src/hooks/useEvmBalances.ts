import { useAccount, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { hyperEVM } from '../config/wagmi'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const TOKENS = [
  { symbol: 'USDC', address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' as const, decimals: 6 },
  { symbol: 'USDT', address: '0xB8CE59fc3717ada4C02eadf9682A9e934F625Ebb' as const, decimals: 6 },
  { symbol: 'USDH', address: '0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5' as const, decimals: 18 },
  { symbol: 'WHYPE', address: '0x5555555555555555555555555555555555555555' as const, decimals: 18 },
] as const

export interface EvmBalance {
  symbol: string
  balance: string
  raw: bigint
}

export function useEvmBalances() {
  const { address, isConnected } = useAccount()

  const contracts = TOKENS.map(token => ({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: [address!] as const,
    chainId: hyperEVM.id,
  }))

  const { data, isLoading } = useReadContracts({
    contracts: isConnected && address ? contracts : [],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15000,
    },
  })

  const balances: EvmBalance[] = TOKENS.map((token, i) => {
    const result = data?.[i]
    const raw = result?.status === 'success' ? (result.result as bigint) : 0n
    return {
      symbol: token.symbol,
      balance: formatUnits(raw, token.decimals),
      raw,
    }
  }).filter(b => b.raw > 0n)

  return { balances, isLoading }
}
