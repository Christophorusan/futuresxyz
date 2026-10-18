import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { alchemyApiKey } from '../../config/alchemy'
import { getTransfers } from '../../lib/alchemyData'

export function AlchemyHistory({ address }: { address?: Address }) {
  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming')
  const history = useInfiniteQuery({ queryKey: ['alchemy-transfers', address, direction],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => getTransfers(address!, direction, pageParam, signal),
    getNextPageParam: page => page.pageKey, enabled: !!address && !!alchemyApiKey,
    staleTime: 30000, retry: false,
  })
  if (!alchemyApiKey || !address) return null
  const entries = [...new Map(history.data?.pages.flatMap(p => p.transfers).map(t => [t.id, t])).values()]
  return <section className="lending-card"><h3>Onchain transfer history</h3>
    <p>Indexed by Alchemy · HyperEVM native and ERC-20 transfers. Internal transfers, NFTs and HyperCore activity are excluded. Token names are unverified; amounts are approximate.</p>
    <div className="lending-actions"><button aria-pressed={direction === 'incoming'} onClick={() => setDirection('incoming')}>Received</button><button aria-pressed={direction === 'outgoing'} onClick={() => setDirection('outgoing')}>Sent</button><button disabled={history.isFetching} onClick={() => void history.refetch()}>Refresh</button></div>
    {history.isLoading && <p role="status">Loading transfer history…</p>}
    {history.isError && <p role="alert">Transfer history is unavailable or incomplete. <a href={`https://hyperevmscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">Open account explorer</a></p>}
    {!history.isLoading && !history.isError && !entries.length && <p>No indexed transfers found for this direction.</p>}
    {entries.map(t => <div className="evm-activity-row" key={t.id}><span>{t.amount} {t.asset}<small style={{display:'block', overflowWrap:'anywhere'}}> {direction === 'incoming' ? `From ${t.from}` : `To ${t.to}`}{t.contract && ` · Token ${t.contract}`}</small></span><a href={`https://hyperevmscan.io/tx/${t.hash}`} target="_blank" rel="noopener noreferrer">Receipt</a></div>)}
    {history.hasNextPage && <button disabled={history.isFetching} onClick={() => void history.fetchNextPage()}>Load older transfers</button>}
  </section>
}
