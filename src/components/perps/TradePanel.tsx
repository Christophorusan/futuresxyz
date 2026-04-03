import { useState, useCallback } from 'react'
import { useMarket } from '../../contexts/MarketContext'
import { useHyperliquid } from '../../contexts/HyperliquidContext'
import { useMarketMeta } from '../../hooks/useMarketMeta'
import { useUserState } from '../../hooks/useUserState'
import { usePlaceOrder, type OrderSide, type OrderType, type Tif } from '../../hooks/usePlaceOrder'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { OrderConfirmModal } from './OrderConfirmModal'
import { formatPrice, formatUsd } from '../../lib/format'

const SIZE_MARKS = [0, 25, 50, 75, 100]

export function TradePanel() {
  const { selectedMarket } = useMarket()
  const { markets } = useMarketMeta()
  const { state } = useUserState()
  const { placeOrder, placing, error, clearError } = usePlaceOrder()
  const { isConnected, agentApproved, approving, approvalError, approveAgent, switchToArbitrum } = useHyperliquid()

  const [side, setSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [tif, setTif] = useState<Tif>('Gtc')
  const [leverage, setLeverage] = useState(20)
  const [reduceOnly, setReduceOnly] = useState(false)
  const [showTpSl, setShowTpSl] = useState(false)
  const [tpPrice, setTpPrice] = useState('')
  const [slPrice, setSlPrice] = useState('')
  const [sizePct, setSizePct] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    setSide,
    setOrderType,
    onEscape: useCallback(() => setShowConfirm(false), []),
  })

  const market = markets.find(m => m.name === selectedMarket)
  const midPrice = market ? parseFloat(market.midPrice) : 0
  const maxLev = market?.maxLeverage ?? 50
  const coin = selectedMarket.replace('-PERP', '')

  // Unified balance (spot USDC + perps withdrawable)
  const available = state ? parseFloat(state.totalBalance) : 0
  const buyingPower = available * leverage

  const sizeNum = parseFloat(size) || 0
  const priceNum = orderType === 'limit' && price ? parseFloat(price) : midPrice
  const orderValue = sizeNum * priceNum
  // Fee is shown as percentage in the summary, not calculated here

  const handleSubmit = async () => {
    if (!size || sizeNum <= 0) return
    clearError()
    await placeOrder({
      coin: selectedMarket,
      side,
      size,
      orderType,
      price: orderType === 'market' ? midPrice.toFixed(6) : price,
      tif: orderType === 'limit' ? tif : undefined,
      reduceOnly,
      tpPrice: showTpSl && tpPrice ? tpPrice : undefined,
      slPrice: showTpSl && slPrice ? slPrice : undefined,
      leverage,
    })
  }

  const handleSizePct = (pct: number) => {
    setSizePct(pct)
    if (!midPrice || !buyingPower) return
    const notional = (buyingPower * pct) / 100
    const sz = notional / midPrice
    setSize(sz > 0 ? sz.toFixed(market?.szDecimals ?? 4) : '')
  }

  // Current position
  const currentPos = state?.positions?.find(p => p.coin === coin)
  const posSize = currentPos ? parseFloat(currentPos.szi) : 0

  return (
    <div className="trade-panel">
      {/* Balance Header — unified */}
      <div className="tp-balance-header">
        <span className="tp-balance-label">Balance</span>
        <span className="tp-balance-value">{formatUsd(available)}</span>
      </div>

      {/* Cross / Leverage */}
      <div className="tp-mode-row">
        <button className="tp-mode-btn">Cross</button>
        <button className="tp-mode-btn tp-lev-btn">{leverage}x</button>
      </div>

      {/* Side Toggle */}
      <div className="trade-side-toggle">
        <button className={`trade-side-btn ${side === 'buy' ? 'active buy' : ''}`} onClick={() => setSide('buy')}>
          Long
        </button>
        <button className={`trade-side-btn ${side === 'sell' ? 'active sell' : ''}`} onClick={() => setSide('sell')}>
          Short
        </button>
      </div>

      {/* Order Type */}
      <div className="trade-type-toggle">
        <button className={`trade-type-btn ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>
          Market
        </button>
        <button className={`trade-type-btn ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>
          Limit
        </button>
      </div>

      {/* Available + Position */}
      <div className="tp-info-rows">
        <div className="tp-info-row">
          <span>Available to Trade</span>
          <span>{formatUsd(available)}</span>
        </div>
        <div className="tp-info-row">
          <span>Current Position</span>
          <span>{posSize !== 0 ? `${posSize > 0 ? '+' : ''}${posSize} ${coin}` : '$0'}</span>
        </div>
      </div>

      {/* Limit price with MID | BID */}
      {orderType === 'limit' && (
        <div className="trade-input-group">
          <div className="tp-input-header">
            <span className="trade-label">Limit price (USDC)</span>
            <div className="tp-midbid">
              <button onClick={() => setPrice(midPrice.toFixed(2))}>MID</button>
              <span>|</span>
              <button onClick={() => {
                const bid = midPrice * 0.999
                setPrice(bid.toFixed(2))
              }}>BID</button>
            </div>
          </div>
          <div className="trade-input-wrapper">
            <input type="number" className="trade-input" placeholder={formatPrice(midPrice)} value={price} onChange={e => setPrice(e.target.value)} step="any" />
          </div>
          <div className="trade-tif">
            <label className="tp-checkbox" style={{ marginRight: 'auto' }}>
              <input type="checkbox" />
              <span>Post only</span>
            </label>
            <select className="tp-tif-select" value={tif} onChange={e => setTif(e.target.value as Tif)}>
              <option value="Gtc">GTC</option>
              <option value="Ioc">IOC</option>
              <option value="Alo">ALO</option>
            </select>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="trade-input-group">
        <div className="tp-input-header">
          <span className="trade-label">Amount</span>
          <span className="trade-label" style={{ color: 'var(--text-3)' }}>USDC ↻</span>
        </div>
        <div className="trade-input-wrapper">
          <input
            type="number"
            className="trade-input"
            placeholder="0.00"
            value={size}
            onChange={e => {
              setSize(e.target.value)
              const val = parseFloat(e.target.value) || 0
              if (buyingPower > 0) setSizePct(Math.min(100, Math.round((val * midPrice / buyingPower) * 100)))
            }}
            step="any"
          />
          <span className="trade-input-unit">≈ {sizeNum > 0 ? `${(sizeNum * priceNum).toFixed(0)} USDC` : `0 ${coin}`}</span>
        </div>
      </div>

      {/* Slider with dots */}
      <div className="tp-slider-wrapper">
        <div className="tp-slider-dots">
          {SIZE_MARKS.map(pct => (
            <button
              key={pct}
              className={`tp-slider-dot ${sizePct >= pct ? 'active' : ''}`}
              onClick={() => handleSizePct(pct)}
            />
          ))}
        </div>
        <input
          type="range"
          className="tp-slider"
          min={0}
          max={100}
          value={sizePct}
          onChange={e => handleSizePct(parseInt(e.target.value))}
        />
      </div>

      {/* Leverage slider */}
      <div className="tp-lev-slider-section">
        <input
          type="range"
          className="tp-slider"
          min={1}
          max={maxLev}
          value={leverage}
          onChange={e => setLeverage(parseInt(e.target.value))}
        />
        <div className="trade-leverage-labels">
          <span>1x</span>
          <span>{maxLev}x</span>
        </div>
      </div>

      {/* Options */}
      <div className="tp-options">
        <label className="tp-checkbox">
          <input type="checkbox" checked={reduceOnly} onChange={e => setReduceOnly(e.target.checked)} />
          <span>Reduce Only</span>
        </label>
        <label className="tp-checkbox">
          <input type="checkbox" checked={showTpSl} onChange={e => setShowTpSl(e.target.checked)} />
          <span>Take profit / Stop loss</span>
        </label>
      </div>

      {/* TP/SL */}
      {showTpSl && (
        <div className="tp-tpsl-grid">
          <div className="tp-tpsl-row">
            <input type="number" className="trade-input" placeholder="Take profit" value={tpPrice} onChange={e => setTpPrice(e.target.value)} step="any" />
            <div className="tp-tpsl-gain">
              <span>Gain</span>
              <span className="tp-tpsl-unit">$ ▾</span>
            </div>
          </div>
          <div className="tp-tpsl-row">
            <input type="number" className="trade-input" placeholder="Stop loss" value={slPrice} onChange={e => setSlPrice(e.target.value)} step="any" />
            <div className="tp-tpsl-gain">
              <span>Loss</span>
              <span className="tp-tpsl-unit">$ ▾</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      {!isConnected ? (
        <div className="connect-prompt">Connect wallet to trade</div>
      ) : available <= 0 ? (
        <button className="trade-submit add-funds">
          Not Enough Margin
        </button>
      ) : (
        <button
          className={`trade-submit ${side}`}
          onClick={() => {
            if (!size || sizeNum <= 0) return
            setShowConfirm(true)
          }}
          disabled={placing || !size || sizeNum <= 0}
        >
          {placing ? 'Placing...' : side === 'buy' ? 'Buy / Long' : 'Sell / Short'}
        </button>
      )}

      {/* Order details — like Hyperliquid */}
      <div className="tp-summary">
        <div className="tp-summary-row">
          <span>Liquidation Price</span>
          <span>{orderValue > 0 ? `$${(priceNum * (side === 'buy' ? (1 - 0.9 / leverage) : (1 + 0.9 / leverage))).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'}</span>
        </div>
        <div className="tp-summary-row">
          <span>Order Value</span>
          <span>{orderValue > 0 ? formatUsd(orderValue) : 'N/A'}</span>
        </div>
        <div className="tp-summary-row">
          <span>Margin Required</span>
          <span>{orderValue > 0 ? formatUsd(orderValue / leverage) : 'N/A'}</span>
        </div>
        <div className="tp-summary-row">
          <span>Slippage</span>
          <span>Est: 0% / Max: 8.00%</span>
        </div>
        <div className="tp-summary-row">
          <span>Fees</span>
          <span>0.0350% / 0.0100%</span>
        </div>
      </div>

      {error && <div className="trade-error">{error}</div>}
      {approvalError && <div className="trade-error">{approvalError}</div>}


      {/* Order Confirmation Modal */}
      {showConfirm && (
        <OrderConfirmModal
          market={selectedMarket}
          side={side}
          size={size}
          price={priceNum}
          leverage={leverage}
          orderType={orderType}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false)
            handleSubmit()
          }}
        />
      )}

      {/* Balance Summary */}
      {/* Deposit / Withdraw — like Hyperliquid */}
      {isConnected && (
        <div className="tp-deposit-section">
          <button className="tp-deposit-btn">Deposit</button>
          <div className="tp-perps-spot-toggle">
            <span className="tp-toggle-active">Perps</span>
            <span className="tp-toggle-divider">|</span>
            <span>Spot</span>
          </div>
          <button className="tp-withdraw-btn">Withdraw</button>
        </div>
      )}

      {/* Unified Account Summary — like Hyperliquid */}
      {isConnected && state && (
        <div className="tp-unified">
          <div className="tp-unified-title">Unified Account Summary</div>
          <div className="tp-unified-row">
            <span>Portfolio Value</span>
            <span>{formatUsd(state.totalBalance)}</span>
          </div>
          <div className="tp-unified-row">
            <span>Unrealized PNL</span>
            <span>{state.positions.length > 0
              ? formatUsd(state.positions.reduce((s, p) => s + parseFloat(p.unrealizedPnl), 0).toString())
              : '$0.00'}</span>
          </div>
          <div className="tp-unified-row">
            <span>Margin Used</span>
            <span>{formatUsd(state.totalMarginUsed)}</span>
          </div>
          <div className="tp-unified-row">
            <span>Account Leverage</span>
            <span>{parseFloat(state.totalNtlPos) > 0
              ? `${(parseFloat(state.totalNtlPos) / parseFloat(state.accountValue)).toFixed(2)}x`
              : '0.00x'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
