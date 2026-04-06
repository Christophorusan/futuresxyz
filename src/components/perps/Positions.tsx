import { useState, useMemo } from 'react'
import { useUserState } from '../../hooks/useUserState'
import { useAccountData } from '../../hooks/useAccountData'
import { usePlaceOrder } from '../../hooks/usePlaceOrder'
import { useMarketMeta } from '../../hooks/useMarketMeta'
import { useMarket } from '../../contexts/MarketContext'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice, formatUsd, formatPct } from '../../lib/format'
import { useAccount } from 'wagmi'
import { TokenIcon } from '../TokenIcon'

type Tab = 'orders' | 'history' | 'positions' | 'assets' | 'trades' | 'twap' | 'funding'

// ── TP/SL Modal ──
function TpSlModal({ coin, szi, entryPx, markPx, onClose, onSubmit }: {
  coin: string
  szi: string
  entryPx: string
  markPx: string
  onClose: () => void
  onSubmit: (tp: string, sl: string) => Promise<void>
}) {
  const [tp, setTp] = useState('')
  const [sl, setSl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLong = parseFloat(szi) > 0
  const entry = parseFloat(entryPx)
  const mark = parseFloat(markPx)
  const size = Math.abs(parseFloat(szi))

  // Calculate estimated PnL
  const tpPnl = tp ? (isLong ? (parseFloat(tp) - entry) : (entry - parseFloat(tp))) * size : 0
  const slPnl = sl ? (isLong ? (parseFloat(sl) - entry) : (entry - parseFloat(sl))) * size : 0

  const handleSubmit = async () => {
    if (!tp && !sl) return
    setSubmitting(true)
    await onSubmit(tp, sl)
    setSubmitting(false)
  }

  return (
    <div className="tpsl-overlay" onClick={onClose}>
      <div className="tpsl-modal" onClick={e => e.stopPropagation()}>
        <div className="tpsl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TokenIcon symbol={coin} size={20} />
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{coin}-PERP</span>
            <span className={isLong ? 'pos-pnl-green' : 'pos-pnl-red'} style={{ fontSize: 12, fontWeight: 600 }}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <button className="tpsl-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="tpsl-info">
          <div className="tpsl-info-row">
            <span>Entry Price</span><span>${formatPrice(entryPx)}</span>
          </div>
          <div className="tpsl-info-row">
            <span>Mark Price</span><span>${formatPrice(markPx)}</span>
          </div>
          <div className="tpsl-info-row">
            <span>Size</span><span>{size.toFixed(4)} {coin}</span>
          </div>
        </div>

        {/* Take Profit */}
        <div className="tpsl-section">
          <label className="tpsl-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
            Take Profit
          </label>
          <div className="tpsl-input-row">
            <div className="trade-input-wrapper" style={{ flex: 1 }}>
              <span className="trade-input-unit">$</span>
              <input
                type="number"
                className="trade-input"
                placeholder={isLong ? `Above ${formatPrice(markPx)}` : `Below ${formatPrice(markPx)}`}
                value={tp}
                onChange={e => setTp(e.target.value)}
              />
            </div>
            {tp && (
              <span className={tpPnl >= 0 ? 'green' : 'red'} style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {tpPnl >= 0 ? '+' : ''}{formatUsd(tpPnl)}
              </span>
            )}
          </div>
          <div className="tpsl-presets">
            {[2, 5, 10, 25].map(pct => {
              const price = isLong ? mark * (1 + pct / 100) : mark * (1 - pct / 100)
              return (
                <button key={pct} className="tpsl-preset-btn" onClick={() => setTp(price.toFixed(2))}>
                  +{pct}%
                </button>
              )
            })}
          </div>
        </div>

        {/* Stop Loss */}
        <div className="tpsl-section">
          <label className="tpsl-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></svg>
            Stop Loss
          </label>
          <div className="tpsl-input-row">
            <div className="trade-input-wrapper" style={{ flex: 1 }}>
              <span className="trade-input-unit">$</span>
              <input
                type="number"
                className="trade-input"
                placeholder={isLong ? `Below ${formatPrice(markPx)}` : `Above ${formatPrice(markPx)}`}
                value={sl}
                onChange={e => setSl(e.target.value)}
              />
            </div>
            {sl && (
              <span className={slPnl >= 0 ? 'green' : 'red'} style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {slPnl >= 0 ? '+' : ''}{formatUsd(slPnl)}
              </span>
            )}
          </div>
          <div className="tpsl-presets">
            {[2, 5, 10, 25].map(pct => {
              const price = isLong ? mark * (1 - pct / 100) : mark * (1 + pct / 100)
              return (
                <button key={pct} className="tpsl-preset-btn" onClick={() => setSl(price.toFixed(2))}>
                  -{pct}%
                </button>
              )
            })}
          </div>
        </div>

        <button
          className={`trade-submit buy`}
          style={{ width: '100%', marginTop: 8 }}
          disabled={submitting || (!tp && !sl)}
          onClick={handleSubmit}
        >
          {submitting ? 'Placing...' : `Set ${tp ? 'TP' : ''}${tp && sl ? ' & ' : ''}${sl ? 'SL' : ''}`}
        </button>
      </div>
    </div>
  )
}

export function Positions() {
  const { isConnected } = useAccount()
  const { state } = useUserState()
  const { spotBalances, openOrders, fills, refetch: refetchAccount } = useAccountData()
  const { placeOrder, cancelOrder, cancelAll } = usePlaceOrder()
  const { markets } = useMarketMeta()
  const { setSelectedMarket } = useMarket()
  const { addToast } = useToast()
  const [tab, setTab] = useState<Tab>('assets')
  const [closingCoin, setClosingCoin] = useState<string | null>(null)
  const [cancellingOid, setCancellingOid] = useState<number | null>(null)
  const [cancellingAll, setCancellingAll] = useState(false)
  const [tpslCoin, setTpslCoin] = useState<string | null>(null)

  const handleSetTpSl = async (coin: string, szi: string, tp: string, sl: string) => {
    const isLong = parseFloat(szi) > 0
    const size = Math.abs(parseFloat(szi))
    const market = markets.find(m => m.name === coin)
    const midPrice = market ? parseFloat(market.midPrice) : 0
    if (!midPrice) return

    try {
      // Place TP order
      if (tp && parseFloat(tp) > 0) {
        await placeOrder({
          coin,
          side: isLong ? 'sell' : 'buy',
          size: size.toString(),
          orderType: 'limit',
          price: tp,
          reduceOnly: true,
          tpPrice: tp,
        })
      }
      // Place SL order
      if (sl && parseFloat(sl) > 0) {
        await placeOrder({
          coin,
          side: isLong ? 'sell' : 'buy',
          size: size.toString(),
          orderType: 'limit',
          price: sl,
          reduceOnly: true,
          slPrice: sl,
        })
      }
      addToast(`TP/SL set for ${coin}`, 'success')
      setTpslCoin(null)
      refetchAccount()
    } catch {
      addToast(`Failed to set TP/SL for ${coin}`, 'error')
    }
  }

  const sortedBalances = useMemo(
    () => [...spotBalances].sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue)),
    [spotBalances]
  )

  const handleClosePosition = async (coin: string, szi: string) => {
    const isLong = parseFloat(szi) > 0
    const sz = Math.abs(parseFloat(szi))
    const market = markets.find(m => m.name === coin)
    const midPrice = market ? parseFloat(market.midPrice) : 0
    if (!midPrice) return

    setClosingCoin(coin)
    try {
      await placeOrder({
        coin,
        side: isLong ? 'sell' : 'buy',
        size: sz.toString(),
        orderType: 'market',
        price: midPrice.toFixed(6),
        reduceOnly: true,
      })
      addToast(`Closed ${coin} position`, 'success')
    } catch {
      addToast(`Failed to close ${coin}`, 'error')
    } finally {
      setClosingCoin(null)
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'assets', label: 'Balances', count: spotBalances.length },
    { id: 'positions', label: 'Positions', count: state?.positions.length },
    { id: 'orders', label: 'Open Orders', count: openOrders.length },
    { id: 'twap', label: 'TWAP' },
    { id: 'trades', label: 'Trade History' },
    { id: 'funding', label: 'Funding History' },
    { id: 'history', label: 'Order History' },
  ]

  return (
    <div className="positions">
      {/* Tab bar with balance on the right — like Hyperliquid */}
      <div className="pos-tab-bar">
        <div className="pos-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`pos-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}{t.count ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>
        <div className="pos-tab-right">
          {tab === 'orders' && openOrders.length > 0 && (
            <button
              className="pos-cancel-all"
              disabled={cancellingAll}
              onClick={async () => {
                setCancellingAll(true)
                const success = await cancelAll(openOrders.map(o => ({ coin: o.coin, oid: o.oid })))
                if (success) { addToast('All orders cancelled', 'success'); refetchAccount() }
                else addToast('Failed to cancel orders', 'error')
                setCancellingAll(false)
              }}
            >{cancellingAll ? 'Cancelling...' : 'Cancel all'}</button>
          )}
          {isConnected && state && (
            <div className="pos-balance-inline">
              <span className="pos-bal-item"><span className="pos-bal-label">Balance</span> {formatUsd(state.totalBalance)}</span>
              <span className="pos-bal-item"><span className="pos-bal-label">Equity</span> {formatUsd(state.accountValue)}</span>
              <span className="pos-bal-item"><span className="pos-bal-label">Margin</span> {formatUsd(state.totalMarginUsed)}</span>
            </div>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="pos-empty-state">
          <div className="pos-empty-icon">—</div>
          <div className="pos-empty-text">Connect wallet to view account</div>
        </div>
      ) : (
        <>
          {/* Open Orders */}
          {tab === 'orders' && (
            openOrders.length === 0 ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">—</div>
                <div className="pos-empty-text">No orders</div>
              </div>
            ) : (
              <div className="positions-table">
                <div className="pos-row-full pos-row-header">
                  <span>Time Placed</span>
                  <span>Name</span>
                  <span>Type</span>
                  <span>Side</span>
                  <span>Price</span>
                  <span>Amount</span>
                  <span>% Filled</span>
                  <span>Total</span>
                  <span>TP/SL</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {openOrders.map(order => {
                  const isBuy = order.side === 'B'
                  const filled = parseFloat(order.origSz) - parseFloat(order.sz)
                  const filledPct = parseFloat(order.origSz) > 0
                    ? ((filled / parseFloat(order.origSz)) * 100).toFixed(0)
                    : '0'
                  const total = parseFloat(order.limitPx) * parseFloat(order.origSz)
                  return (
                    <div key={order.oid} className="pos-row-full">
                      <span className="pos-time">{new Date(order.timestamp).toLocaleString()}</span>
                      <span className="pos-name">{order.coin}-PERP</span>
                      <span>Limit</span>
                      <span className={isBuy ? 'pos-pnl-green' : 'pos-pnl-red'}>
                        {isBuy ? 'Buy' : 'Sell'}
                      </span>
                      <span>${formatPrice(order.limitPx)}</span>
                      <span>{order.origSz}</span>
                      <span>{filledPct}%</span>
                      <span>{formatUsd(total)}</span>
                      <span>--</span>
                      <span className="pos-status-open">Open</span>
                      <span>
                        <button
                          className="pos-close-btn"
                          disabled={cancellingOid === order.oid}
                          onClick={async () => {
                            setCancellingOid(order.oid)
                            const success = await cancelOrder(order.coin, order.oid)
                            if (success) { addToast(`Cancelled ${order.coin} order`, 'success'); refetchAccount() }
                            else addToast('Failed to cancel', 'error')
                            setCancellingOid(null)
                          }}
                        >{cancellingOid === order.oid ? '...' : 'Cancel'}</button>
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Order History */}
          {tab === 'history' && (
            <div className="pos-empty-state">
              <div className="pos-empty-icon">—</div>
              <div className="pos-empty-text">No order history</div>
            </div>
          )}

          {/* Positions */}
          {tab === 'positions' && (
            !state?.positions.length ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">—</div>
                <div className="pos-empty-text">No open positions</div>
              </div>
            ) : (
              <div className="positions-table">
                <div className="pos-row-full pos-row-header">
                  <span>Market</span>
                  <span>Side</span>
                  <span>Size</span>
                  <span>Entry Price</span>
                  <span>Mark Price</span>
                  <span>Liq. Price</span>
                  <span>Margin</span>
                  <span>PnL (ROE%)</span>
                  <span>TP/SL</span>
                  <span>Actions</span>
                </div>
                {state.positions.map(pos => {
                  const pnl = parseFloat(pos.unrealizedPnl)
                  const isLong = parseFloat(pos.szi) > 0
                  const market = markets.find(m => m.name === pos.coin)
                  const markPx = market ? formatPrice(market.midPrice) : '--'
                  return (
                    <div key={pos.coin} className="pos-row-full">
                      <span className="pos-name pos-clickable" onClick={() => setSelectedMarket(pos.coin)}>{pos.coin}-PERP</span>
                      <span className={isLong ? 'pos-pnl-green' : 'pos-pnl-red'}>
                        {isLong ? 'Long' : 'Short'}
                        <span className="pos-leverage">{pos.leverage.value}x</span>
                      </span>
                      <span>{Math.abs(parseFloat(pos.szi)).toFixed(4)}</span>
                      <span>${formatPrice(pos.entryPx)}</span>
                      <span>${markPx}</span>
                      <span>{pos.liquidationPx ? `$${formatPrice(pos.liquidationPx)}` : '--'}</span>
                      <span>{formatUsd(pos.marginUsed)}</span>
                      <span className={pnl >= 0 ? 'pos-pnl-green' : 'pos-pnl-red'}>
                        {formatUsd(pnl)} ({formatPct(parseFloat(pos.returnOnEquity) * 100)})
                      </span>
                      <span>
                        <button className="pos-tpsl-btn" onClick={() => setTpslCoin(pos.coin)}>
                          + TP/SL
                        </button>
                      </span>
                      <span>
                        <button
                          className="pos-close-btn"
                          onClick={() => handleClosePosition(pos.coin, pos.szi)}
                          disabled={closingCoin === pos.coin}
                        >
                          {closingCoin === pos.coin ? '...' : 'Close'}
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Assets */}
          {tab === 'assets' && (
            spotBalances.length === 0 ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">--</div>
                <div className="pos-empty-text">No balances</div>
              </div>
            ) : (
              <div className="positions-table">
                <div className="pos-row-full pos-row-header" style={{ gridTemplateColumns: '0.8fr 1.5fr 1.5fr 1fr 1fr' }}>
                  <span>Coin</span>
                  <span>Total Balance</span>
                  <span>Available Balance</span>
                  <span>USDC Value</span>
                  <span>PNL (ROE %)</span>
                </div>
                {sortedBalances.map(b => {
                    const pnl = parseFloat(b.pnl)
                    const pnlPct = parseFloat(b.pnlPct)
                    return (
                      <div key={b.coin} className="pos-row-full" style={{ gridTemplateColumns: '0.8fr 1.5fr 1.5fr 1fr 1fr' }}>
                        <span className="pos-name">{b.coin}</span>
                        <span>{parseFloat(b.total).toLocaleString('en-US', { maximumFractionDigits: 8 })} {b.coin}</span>
                        <span>{parseFloat(b.available).toLocaleString('en-US', { maximumFractionDigits: 8 })} {b.coin}</span>
                        <span>${parseFloat(b.usdValue).toFixed(2)}</span>
                        <span className={pnl >= 0 ? 'green' : 'red'}>
                          {pnl !== 0 ? `$${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)` : '--'}
                        </span>
                      </div>
                    )
                  })}
              </div>
            )
          )}

          {/* Trade History */}
          {tab === 'trades' && (
            fills.length === 0 ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">—</div>
                <div className="pos-empty-text">No recent trades</div>
              </div>
            ) : (
              <div className="positions-table">
                <div className="pos-row-full pos-row-header">
                  <span>Time</span>
                  <span>Market</span>
                  <span>Side</span>
                  <span>Price</span>
                  <span>Size</span>
                  <span>Fee</span>
                  <span>Total</span>
                </div>
                {fills.map((fill, i) => {
                  const isBuy = fill.side === 'B' || fill.side === 'Buy'
                  const total = parseFloat(fill.px) * parseFloat(fill.sz)
                  return (
                    <div key={`${fill.oid}-${i}`} className="pos-row-full" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                      <span className="pos-time">{new Date(fill.time).toLocaleString()}</span>
                      <span className="pos-name">{fill.coin}-PERP</span>
                      <span className={isBuy ? 'pos-pnl-green' : 'pos-pnl-red'}>
                        {isBuy ? 'Buy' : 'Sell'}
                      </span>
                      <span>${formatPrice(fill.px)}</span>
                      <span>{fill.sz}</span>
                      <span>${parseFloat(fill.fee).toFixed(4)}</span>
                      <span>{formatUsd(total)}</span>
                    </div>
                  )
                })}
              </div>
            )
          )}
          {/* TWAP */}
          {tab === 'twap' && (
            <div className="pos-empty-state">
              <div className="pos-empty-icon">--</div>
              <div className="pos-empty-text">TWAP orders coming soon</div>
            </div>
          )}

          {/* Funding History */}
          {tab === 'funding' && (
            <div className="pos-empty-state">
              <div className="pos-empty-icon">--</div>
              <div className="pos-empty-text">Funding history coming soon</div>
            </div>
          )}
        </>
      )}

      {/* TP/SL Modal */}
      {tpslCoin && state && (() => {
        const pos = state.positions.find(p => p.coin === tpslCoin)
        if (!pos) return null
        const market = markets.find(m => m.name === tpslCoin)
        return (
          <TpSlModal
            coin={tpslCoin}
            szi={pos.szi}
            entryPx={pos.entryPx}
            markPx={market?.midPrice || pos.entryPx}
            onClose={() => setTpslCoin(null)}
            onSubmit={(tp, sl) => handleSetTpSl(tpslCoin, pos.szi, tp, sl)}
          />
        )
      })()}
    </div>
  )
}
