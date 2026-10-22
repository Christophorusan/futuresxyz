import { AppDiscovery } from '../components/AppDiscovery'
import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, type Address } from 'viem'
import { protocols } from '../lib/lending/contracts'
import { readMarkets, rateToApy } from '../lib/lending/markets'
import { LendingTrade } from '../components/shared/LendingTrade'
import { SmartAccountTransfer } from '../components/shared/SmartAccountTransfer'
import { HypeWrap } from '../components/shared/HypeWrap'
import { EvmActivity } from '../components/shared/EvmActivity'
import { gasPolicyId, smartWalletsEnabled } from '../config/alchemy'

export function LendingPage() {
  const { address } = useAccount()
  const { data: signer } = useWalletClient()
  const client = usePublicClient({ chainId: 999 })!
  const protocol = 'hyperlend' as const
  const [selected, setSelected] = useState<Address>()
  const [smart, setSmart] = useState(false)
  const [smartAccount, setSmartAccount] = useState<{ owner: Address; address: Address }>()
  const [busy, setBusy] = useState(false)
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [error, setError] = useState('')
  const currentSmartAccount = smartAccount?.owner === address ? smartAccount?.address : undefined
  const account = smart ? currentSmartAccount : address
  const query = useQuery({ queryKey: ['lending-markets', protocol], queryFn: () => readMarkets(client, protocol), staleTime: 30000, refetchInterval: 60000, retry: 1 })
  const markets = query.data?.markets || []
  const market = markets.find(m => m.asset === selected) || markets[0]
  async function enableSmartAccount() {
    if (!signer || !address || loadingAccount) return
    setLoadingAccount(true); setError('')
    try {
      const { createHyperEvmSmartWallet } = await import('../lib/alchemyWallet')
      const result = await createHyperEvmSmartWallet(signer).requestAccount({ creationHint: { accountType: 'sma-b' } })
      setSmartAccount({ owner: address, address: result.address })
      setSmart(true)
    } catch { setError('Unable to load smart account. Verify Alchemy configuration or use your connected wallet.') }
    finally { setLoadingAccount(false) }
  }
  return <main className="lending-page">
    <header className="lending-heading"><div><h1>Lending</h1><p>Earn by lending your assets, or explore borrowing.</p></div>
      <a href={protocols[protocol].source} target="_blank" rel="noreferrer">How lending works</a>
    </header>
    <AppDiscovery category="lending" />
    <h2 style={{ marginBottom: 16 }}>Lend in Oslo · HyperLend on HyperEVM</h2>
    <div className="lending-toolbar">
      <div className="lending-actions"><button disabled={busy || loadingAccount} className={!smart ? 'active' : ''} onClick={() => setSmart(false)}>Connected wallet</button>
        <button disabled={busy || loadingAccount || !smartWalletsEnabled || !signer} className={smart ? 'active' : ''} onClick={enableSmartAccount}>{loadingAccount ? 'Loading…' : 'Additional wallet'}</button></div>
    </div>
    {smart && <div className="lending-notice"><strong>Your additional wallet</strong><p className="evm-address">{currentSmartAccount || 'Reconnect the owner wallet to continue.'}</p><p>This wallet has its own balance. Add funds on the HyperEVM network before using it. Deposits and loans in your other wallet stay there. {gasPolicyId ? 'Network fees may be covered for eligible transactions.' : 'You pay the network fees.'}</p></div>}
    {error && <p role="alert">{error}</p>}
    <div className="lending-layout"><section className="lending-card">
      <div className="lending-heading"><h2>{protocols[protocol].name} markets</h2><button disabled={query.isFetching} onClick={() => query.refetch()}>{query.isFetching ? 'Refreshing…' : 'Refresh'}</button></div>
      {query.data && <p>Last updated {new Date(query.dataUpdatedAt).toLocaleTimeString()}</p>}
      {query.isError && <p role="alert">Live market data is unavailable. Actions require fresh data. <button onClick={() => query.refetch()}>Retry</button></p>}
      {query.isPending && <p role="status">Loading lending options…</p>}
      <div className="lending-table-scroll"><table className="lending-table"><thead><tr><th>Asset</th><th>Yearly earning rate</th><th>Yearly borrowing rate</th><th>Total deposited</th><th>Borrowed</th><th>Status</th></tr></thead><tbody>
        {markets.map(m => <tr key={m.asset} className={m.asset === market?.asset ? 'selected' : ''}>
          <td><button disabled={busy} onClick={() => setSelected(m.asset)}>{m.symbol}</button></td>
          <td className="green">{rateToApy(m.supplyRate).toFixed(2)}%</td><td>{rateToApy(m.borrowRate).toFixed(2)}%</td>
          <td>{Number(formatUnits(m.supply, m.decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })} {m.symbol}</td>
          <td>{Number(formatUnits(m.debt, m.decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })} {m.symbol}</td>
          <td>{m.paused ? 'Paused' : !m.active ? 'Inactive' : m.frozen ? 'Frozen' : !m.borrowing ? 'Deposits only' : m.borrowCap > 0n && m.debt >= m.borrowCap * 10n ** BigInt(m.decimals) ? 'Borrowing limit reached' : 'Active'}</td>
        </tr>)}
      </tbody></table></div><p>These are estimated yearly rates based on current conditions. Rates can change and do not include extra rewards. Amounts are shown in each asset.</p>
    </section>
      {market && <LendingTrade key={`${market.protocol}-${market.asset}-${account}-${smart}`} market={market} account={account} smart={smart} disabled={busy} onBusy={setBusy} />}
    </div>
    <HypeWrap key={`${account}-${smart}`} account={account} smart={smart} disabled={busy} onBusy={setBusy} />
    {address && currentSmartAccount && <SmartAccountTransfer key={`${address}-${currentSmartAccount}-${market?.asset}`} owner={address} smartAccount={currentSmartAccount} market={market} disabled={busy} onBusy={setBusy} />}
    <EvmActivity />
    <section className="lending-card"><h3>Felix</h3><p>Felix offers other borrowing options, with its own terms and risks. View and manage your Felix loans here.</p><a href="https://www.usefelix.xyz/portfolio" target="_blank" rel="noreferrer">Open Felix ↗</a></section>
  </main>
}
