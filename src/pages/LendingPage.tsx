import './LendingPage.css'
import { TokenIcon } from '../components/TokenIcon'
import { LendingTokenIcon } from '../components/LendingTokenIcon'
import { AppDiscovery } from '../components/AppDiscovery'
import { useEffect, useRef, useState } from 'react'
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
  const market = markets.find(m => m.asset === selected)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (market && !dialog.current?.open) dialog.current?.showModal() }, [market?.asset])
  const closeMarket = () => { if (!busy) { dialog.current?.close(); setSelected(undefined) } }
  const assetNames: Record<string, string> = { WHYPE: 'Wrapped HYPE', wstHYPE: 'Staked HYPE', UBTC: 'Unit Bitcoin', UETH: 'Unit Ethereum', USOL: 'Unit Solana', USDe: 'Ethena USDe', sUSDe: 'Ethena Staked USDe', 'USD₮0': 'USDT0', USDHL: 'Hyper USD', kHYPE: 'Kinetiq Staked HYPE', USR: 'Resolv USD', beHYPE: 'BeHYPE', USDC: 'USD Coin', USDH: 'USDH' }
  const totalSupply = (supply: bigint, decimals: number) => Number(formatUnits(supply, decimals)).toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 2 })
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
  return <main className="lending-page lending-earn-page">
    <header className="lending-heading"><div><h1>Lending</h1><p>Earn by lending your assets, or explore borrowing.</p></div>
      <a href={protocols[protocol].source} target="_blank" rel="noreferrer">How lending works</a>
    </header>
    <div className="lending-earn-context"><h2>Hyperliquid ecosystem</h2><p>Supply and borrow with HyperLend on HyperEVM.</p></div>
    <div className="lending-toolbar">
      <div className="lending-actions"><button disabled={busy || loadingAccount} className={!smart ? 'active' : ''} onClick={() => setSmart(false)}>Connected wallet</button>
        <button disabled={busy || loadingAccount || !smartWalletsEnabled || !signer} className={smart ? 'active' : ''} onClick={enableSmartAccount}>{loadingAccount ? 'Loading…' : 'Additional wallet'}</button></div>
    </div>
    {smart && <div className="lending-notice"><strong>Your additional wallet</strong><p className="evm-address">{currentSmartAccount || 'Reconnect the owner wallet to continue.'}</p><p>This wallet has its own balance. Add funds on the HyperEVM network before using it. Deposits and loans in your other wallet stay there. {gasPolicyId ? 'Network fees may be covered for eligible transactions.' : 'You pay the network fees.'}</p></div>}
    {error && <p role="alert">{error}</p>}
    <section className="lending-card lending-earn-table-card">
      <div className="lending-earn-table-heading"><div><h2>{protocols[protocol].name} markets</h2><p>{query.data ? `Updated ${new Date(query.dataUpdatedAt).toLocaleTimeString()}` : 'Live lending markets'}</p></div><button disabled={query.isFetching} onClick={() => query.refetch()}>{query.isFetching ? 'Refreshing…' : 'Refresh'}</button></div>
      {query.isError && <p role="alert" className="lending-earn-note">Live market data is unavailable. Actions require fresh data. <button onClick={() => query.refetch()}>Retry</button></p>}
      {query.isPending && <p role="status" className="lending-earn-note">Loading lending options…</p>}
      <div className="lending-table-scroll"><table className="lending-earn-table"><thead><tr><th>Asset</th><th>Network</th><th>Collateral</th><th>Supply APY</th><th>Borrow APY</th><th>Total supplied</th><th>Actions</th></tr></thead><tbody>
        {markets.map(m => <tr key={m.asset}>
          <td><div className="lending-earn-asset"><LendingTokenIcon symbol={m.symbol} size={38} /><div><strong>{m.symbol}</strong><small title={assetNames[m.symbol] || m.symbol}>{assetNames[m.symbol] || (m.symbol.startsWith('PT-') ? 'Pendle principal token' : m.symbol)}</small></div></div></td>
          <td><span className="lending-earn-network"><TokenIcon symbol="HYPE" size={22} />HyperEVM</span></td>
          <td><span className={`lending-earn-collateral${m.collateral ? ' enabled' : ''}`}>{m.collateral ? 'Eligible' : 'Not eligible'}</span>{m.collateral && <small>Max LTV {(Number(m.ltv) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</small>}</td>
          <td className="lending-earn-apy">{rateToApy(m.supplyRate).toFixed(2)}%</td>
          <td>{rateToApy(m.borrowRate).toFixed(2)}%</td>
          <td>{totalSupply(m.supply, m.decimals)}<small>{m.symbol}</small></td>
          <td><button className="lending-earn-view" disabled={busy} aria-label={`View ${m.symbol} market`} onClick={() => setSelected(m.asset)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>View</button><small>{m.paused ? 'Paused' : !m.active ? 'Inactive' : m.frozen ? 'Frozen' : !m.borrowing ? 'Supply only' : m.borrowCap > 0n && m.debt >= m.borrowCap * 10n ** BigInt(m.decimals) ? 'Borrow cap reached' : 'Active'}</small></td>
        </tr>)}
      </tbody></table></div><p className="lending-earn-note">APY reflects current variable rates, not a seven-day average, and excludes extra rewards. Total supplied is shown in tokens. Collateral eligibility and maximum loan-to-value are market settings; your account’s collateral status appears in View.</p>
    </section>
    {market && <dialog ref={dialog} className="lending-earn-dialog" aria-labelledby="lending-market-title" onCancel={e => { e.preventDefault(); closeMarket() }}><header><h2 id="lending-market-title">Market details</h2><button disabled={busy} onClick={closeMarket} aria-label="Close market details">✕</button></header><div className="lending-market-overview"><div>Supply APY<strong>{rateToApy(market.supplyRate).toFixed(2)}%</strong></div><div>Collateral<strong>{market.collateral ? `${(Number(market.ltv) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}% max LTV` : 'Not eligible'}</strong></div></div><LendingTrade key={`${market.protocol}-${market.asset}-${account}-${smart}`} market={market} account={account} smart={smart} disabled={busy} onBusy={setBusy} /></dialog>}
    <HypeWrap key={`${account}-${smart}`} account={account} smart={smart} disabled={busy} onBusy={setBusy} />
    {address && currentSmartAccount && <SmartAccountTransfer key={`${address}-${currentSmartAccount}-${market?.asset}`} owner={address} smartAccount={currentSmartAccount} market={market} disabled={busy} onBusy={setBusy} />}
    <EvmActivity />
    <section className="lending-card"><h3>Felix</h3><p>Felix offers other borrowing options, with its own terms and risks. View and manage your Felix loans on its official site.</p><a data-external="true" href="https://www.usefelix.xyz/portfolio" target="_blank" rel="noreferrer">Open Felix ↗</a></section>
    <AppDiscovery category="lending" />
  </main>
}
