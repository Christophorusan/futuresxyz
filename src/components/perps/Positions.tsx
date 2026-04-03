import { useState } from 'react'
import { useUserState } from '../../hooks/useUserState'
import { useAccountData } from '../../hooks/useAccountData'
import { usePlaceOrder } from '../../hooks/usePlaceOrder'
import { useMarketMeta } from '../../hooks/useMarketMeta'
import { useMarket } from '../../contexts/MarketContext'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice, formatUsd, formatPct } from '../../lib/format'
import { useAccount } from 'wagmi'

type Tab = 'orders' | 'history' | 'positions' | 'assets' | 'trades'

export function Positions() {
  const { isConnected } = useAccount()
  const { state } = useUserState()
  const { spotBalances, openOrders, fills, refetch: refetchAccount } = useAccountData()
  const { placeOrder, cancelOrder, cancelAll } = usePlaceOrder()
  const { markets } = useMarketMeta()
  const { setSelectedMarket } = useMarket()
  const { addToast } = useToast()
  const [tab, setTab] = useState<Tab>('positions')
  const [closingCoin, setClosingCoin] = useState<string | null>(null)
  const [cancellingOid, setCancellingOid] = useState<number | null>(null)
  const [cancellingAll, setCancellingAll] = useState(false)

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
    { id: 'positions', label: 'Positions', count: state?.positions.length },
    { id: 'orders', label: 'Open Orders', count: openOrders.length },
    { id: 'assets', label: 'Balances', count: spotBalances.length },
    { id: 'trades', label: 'Trade History' },
    { id: 'history', label: 'Funding' },
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
          <div className="pos-empty-icon">📋</div>
          <div className="pos-empty-text">Connect wallet to view account</div>
        </div>
      ) : (
        <>
          {/* Open Orders */}
          {tab === 'orders' && (
            openOrders.length === 0 ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">📋</div>
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
              <div className="pos-empty-icon">📋</div>
              <div className="pos-empty-text">No order history</div>
            </div>
          )}

          {/* Positions */}
          {tab === 'positions' && (
            !state?.positions.length ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">📊</div>
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
                      <span>--</span>
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
                <div className="pos-empty-icon">💰</div>
                <div className="pos-empty-text">No assets</div>
              </div>
            ) : (
              <div className="positions-table">
                <div className="pos-row-full pos-row-header">
                  <span>Coin</span>
                  <span>Total Balance</span>
                  <span>Available</span>
                  <span>USD Value</span>
                </div>
                {spotBalances.map(b => (
                  <div key={b.coin} className="pos-row-full" style={{ gridTemplateColumns: '1fr 2fr 2fr 1fr' }}>
                    <span className="pos-name">{b.coin}</span>
                    <span>{parseFloat(b.total).toLocaleString('en-US', { maximumFractionDigits: 8 })}</span>
                    <span>{parseFloat(b.available).toLocaleString('en-US', { maximumFractionDigits: 8 })}</span>
                    <span>${parseFloat(b.usdValue).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Trade History */}
          {tab === 'trades' && (
            fills.length === 0 ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">📋</div>
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
        </>
      )}
    </div>
  )
}
