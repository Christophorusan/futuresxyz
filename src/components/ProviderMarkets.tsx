import { LendingTokenIcon } from './LendingTokenIcon'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { readProviderMarkets } from '../lib/lending/providerMarkets'

export function ProviderMarkets({ provider }: { provider: 'aave' | 'morpho' }) {
  const [search, setSearch] = useState('')
  const [network, setNetwork] = useState('all')
  const query = useQuery({ queryKey: ['provider-markets', provider], queryFn: ({ signal }) => readProviderMarkets(provider, signal), staleTime: 60000, retry: 1 })
  const markets = query.data ?? []
  const filtered = markets.filter(m => (network === 'all' || m.network === network) && `${m.asset} ${m.collateral ?? ''} ${m.market}`.toLowerCase().includes(search.trim().toLowerCase()))
  const rate = (value: number | null) => value === null ? '—' : `${value.toFixed(2)}%`
  return <section className="lending-card provider-markets">
    <div className="lending-heading"><h2>{provider === 'aave' ? 'Aave lending markets' : 'Morpho isolated markets'}</h2><button disabled={query.isFetching} onClick={() => query.refetch()}>{query.isFetching ? 'Refreshing…' : 'Refresh'}</button></div>
    <p>{provider === 'morpho' ? '50 listed markets on Ethereum and Base, ordered by supplied value. These are individual markets, not vault rates.' : 'Reserves on Ethereum, Arbitrum, Base, Optimism, and Polygon.'} Rates are variable and exclude extra rewards.</p>
    <div className="finance-discovery-filters"><label>Asset or market<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search USDC, ETH…" /></label><label>Network<select value={network} onChange={e => setNetwork(e.target.value)}><option value="all">All networks</option>{[...new Set(markets.map(m => m.network))].sort().map(n => <option key={n}>{n}</option>)}</select></label></div>
    {query.isPending && <p role="status">Loading live markets…</p>}
    {query.isError && <p role="alert">Market data is unavailable. {query.data ? 'Previously loaded rates may be out of date.' : 'No rates are shown.'} <button onClick={() => query.refetch()}>Retry</button></p>}
    {query.data && <><p>Retrieved {new Date(query.dataUpdatedAt).toLocaleTimeString()} · {filtered.length} results · Read-only</p><div className="lending-table-scroll"><table className="lending-table"><thead><tr><th>Asset</th><th>Network / market</th>{provider === 'morpho' && <th>Collateral</th>}<th>Supply APY</th><th>Borrow APY</th><th>Status</th></tr></thead><tbody>{filtered.map(m => <tr key={m.id}><td><span className="lending-token-label"><LendingTokenIcon symbol={m.asset} size={26} /><span>{m.asset}</span></span></td><td>{m.network}<small className="provider-market-id" title={m.market}>{provider === 'morpho' ? `${m.market.slice(0,8)}…${m.market.slice(-6)}` : m.market}</small></td>{provider === 'morpho' && <td><span className="lending-token-label">{m.collateral && m.collateral !== 'None' && <LendingTokenIcon symbol={m.collateral} size={26} />}<span>{m.collateral}</span></span></td>}<td>{rate(m.supplyApy)}</td><td>{rate(m.borrowApy)}</td><td>{m.status}</td></tr>)}</tbody></table></div>{filtered.length === 0 && <p>No markets match these filters.</p>}</>}
  </section>
}
