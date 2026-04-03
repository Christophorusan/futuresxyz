import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useMarket } from '../../contexts/MarketContext'
import { useMarketMeta } from '../../hooks/useMarketMeta'
import { useUserState } from '../../hooks/useUserState'
import { usePlaceOrder, type OrderSide, type OrderType, type Tif } from '../../hooks/usePlaceOrder'
import { formatPrice, formatUsd } from '../../lib/format'

const SIZE_MARKS = [0, 25, 50, 75, 100]

export function TradePanel() {
  const { isConnected } = useAccount()
  const { selectedMarket } = useMarket()
  const { markets } = useMarketMeta()
  const { state } = useUserState()
  const { placeOrder, placing, error, clearError } = usePlaceOrder()

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
  const margin = leverage > 0 ? orderValue / leverage : 0
  const estFee = orderValue * 0.00035

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

      {/* Order Summary */}
      <div className="tp-summary">
        <div className="tp-summary-row"><span>Subtotal</span><span>{orderValue > 0 ? formatUsd(orderValue) : '--'}</span></div>
        <div className="tp-summary-row"><span>Fee</span><span>{estFee > 0 ? formatUsd(estFee) : '--'}</span></div>
        <div className="tp-summary-row tp-summary-total"><span>Total</span><span>{orderValue > 0 ? formatUsd(orderValue + estFee) : '--'}</span></div>
      </div>

      {/* Submit */}
      {!isConnected ? (
        <div className="connect-prompt">Connect wallet to trade</div>
      ) : available <= 0 ? (
        <button className="trade-submit add-funds" disabled>
          Add funds to continue
        </button>
      ) : (
        <button
          className={`trade-submit ${side}`}
          onClick={handleSubmit}
          disabled={placing || !size || sizeNum <= 0}
        >
          {placing ? 'Placing...' : side === 'buy' ? 'Long' : 'Short'}
        </button>
      )}

      {error && <div className="trade-error">{error}</div>}

      {/* Balance Summary */}
      {isConnected && state && (
        <div className="tp-bal-summary">
          <div className="tp-bal-summary-title">Balance summary</div>
          <div className="tp-bal-summary-row">
            <span>USDC</span>
            <span>{parseFloat(state.totalBalance).toFixed(2)}</span>
          </div>
          {posSize !== 0 && (
            <div className="tp-bal-summary-row">
              <span>{coin}</span>
              <span>{posSize.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
