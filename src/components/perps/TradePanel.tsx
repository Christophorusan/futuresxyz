import { useState, useCallback } from 'react'
import { useMarket } from '../../contexts/MarketContext'
import { useHyperliquid } from '../../contexts/HyperliquidContext'
import { useMarketMeta } from '../../hooks/useMarketMeta'
import { useUserState } from '../../hooks/useUserState'
import { usePlaceOrder, type OrderSide, type OrderType, type Tif } from '../../hooks/usePlaceOrder'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { OrderConfirmModal } from './OrderConfirmModal'
import { DepositWithdraw } from './DepositWithdraw'
import { formatPrice, formatUsd } from '../../lib/format'

const SIZE_MARKS = [0, 25, 50, 75, 100]

export function TradePanel() {
  const { selectedMarket } = useMarket()
  const { markets } = useMarketMeta()
  const { state } = useUserState()
  const { placeOrder, placing, error, clearError } = usePlaceOrder()
  const { isConnected, agentApproved, approving, approveAgent, approvalError, switchToArbitrum, exchange } = useHyperliquid()

  const [side, setSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [tif] = useState<Tif>('Gtc')
  const [leverage, setLeverage] = useState(20)
  const [reduceOnly, setReduceOnly] = useState(false)
  const [showTpSl, setShowTpSl] = useState(false)
  const [tpPrice, setTpPrice] = useState('')
  const [slPrice, setSlPrice] = useState('')
  const [sizePct, setSizePct] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showLevInput, setShowLevInput] = useState(false)
  const [levInput, setLevInput] = useState('')

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

  // Size is in USDC — convert to token amount
  const usdcSize = parseFloat(size) || 0
  const priceNum = orderType === 'limit' && price ? parseFloat(price) : midPrice
  const tokenSize = priceNum > 0 ? usdcSize / priceNum : 0
  const orderValue = usdcSize

  const handleSubmit = async () => {
    if (!size || tokenSize <= 0) return
    clearError()
    await placeOrder({
      coin: selectedMarket,
      side,
      size: tokenSize.toFixed(market?.szDecimals ?? 4),
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
    if (!buyingPower) return
    const usdcVal = (buyingPower * pct) / 100
    setSize(usdcVal > 0 ? usdcVal.toFixed(2) : '')
  }

  // Current position
  const currentPos = state?.positions?.find(p => p.coin === coin)
  const posSize = currentPos ? parseFloat(currentPos.szi) : 0

  return (
    <div className="trade-panel">
      {/* Cross / Leverage / Classic — like Hyperliquid */}
      <div className="tp-mode-row" style={{ gap: 4 }}>
        <button className="tp-mode-btn" style={{ background: 'var(--bg-3)', color: 'var(--text-0)' }}>Cross</button>
        <button className="tp-mode-btn tp-lev-btn" onClick={() => { setShowLevInput(!showLevInput); setLevInput(String(leverage)) }}>{leverage}x</button>
        <button className="tp-mode-btn" style={{ opacity: 0.5 }}>Classic</button>
      </div>
      {showLevInput && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="range"
            className="tp-slider"
            min={1}
            max={maxLev}
            value={leverage}
            onChange={e => { setLeverage(parseInt(e.target.value)); setLevInput(e.target.value) }}
          />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div className="trade-leverage-labels" style={{ flex: 1 }}>
              <span>1x</span>
              <span>{maxLev}x</span>
            </div>
            <div className="trade-input-wrapper" style={{ width: 70, padding: '4px 8px' }}>
              <input
                type="number"
                className="trade-input"
                style={{ fontSize: 13 }}
                value={levInput}
                onChange={e => { setLevInput(e.target.value); const n = parseInt(e.target.value); if (n >= 1 && n <= maxLev) setLeverage(n) }}
                onKeyDown={e => { if (e.key === 'Enter') setShowLevInput(false) }}
                min={1} max={maxLev} autoFocus
              />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>x</span>
            </div>
          </div>
        </div>
      )}

      {/* Market / Limit / Pro */}
      <div className="trade-type-toggle">
        <button className={`trade-type-btn ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</button>
        <button className={`trade-type-btn ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', opacity: 0.5 }}>Pro</span>
      </div>

      {/* Buy / Long | Sell / Short */}
      <div className="trade-side-toggle">
        <button className={`trade-side-btn ${side === 'buy' ? 'active buy' : ''}`} onClick={() => setSide('buy')}>Buy / Long</button>
        <button className={`trade-side-btn ${side === 'sell' ? 'active sell' : ''}`} onClick={() => setSide('sell')}>Sell / Short</button>
      </div>

      {/* Available to Trade + Current Position */}
      <div className="tp-info-rows">
        <div className="tp-info-row">
          <span>Available to Trade</span>
          <span>{available > 0 ? `${available.toFixed(2)} USDC` : '0.00 USDC'}</span>
        </div>
        <div className="tp-info-row">
          <span>Current Position</span>
          <span>{posSize !== 0 ? `${posSize.toFixed(5)} ${coin}` : `0.00000 ${coin}`}</span>
        </div>
      </div>

      {/* Limit price */}
      {orderType === 'limit' && (
        <div className="trade-input-group">
          <div className="trade-input-wrapper">
            <input type="number" className="trade-input" placeholder={formatPrice(midPrice)} value={price} onChange={e => setPrice(e.target.value)} step="any" />
            <span className="trade-input-unit">USDC</span>
          </div>
        </div>
      )}

      {/* Size in USDC — like Hyperliquid */}
      <div className="trade-input-group">
        <div className="trade-input-wrapper">
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 8 }}>Size</span>
          <input
            type="number"
            className="trade-input"
            placeholder="0.00"
            value={size}
            onChange={e => {
              setSize(e.target.value)
              const val = parseFloat(e.target.value) || 0
              if (buyingPower > 0) setSizePct(Math.min(100, Math.round((val / buyingPower) * 100)))
            }}
            step="any"
          />
          <span className="trade-input-unit">USDC ▾</span>
        </div>
        {tokenSize > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            = {tokenSize.toFixed(market?.szDecimals ?? 4)} {coin}
          </div>
        )}
      </div>

      {/* Slider with % input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="tp-slider-wrapper" style={{ flex: 1 }}>
          <div className="tp-slider-dots">
            {SIZE_MARKS.map(pct => (
              <button key={pct} className={`tp-slider-dot ${sizePct >= pct ? 'active' : ''}`} onClick={() => handleSizePct(pct)} />
            ))}
          </div>
          <input type="range" className="tp-slider" min={0} max={100} value={sizePct} onChange={e => handleSizePct(parseInt(e.target.value))} />
        </div>
        <div className="trade-input-wrapper" style={{ width: 70, padding: '6px 8px' }}>
          <input type="number" className="trade-input" style={{ fontSize: 13 }} value={sizePct || ''} onChange={e => handleSizePct(parseInt(e.target.value) || 0)} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>%</span>
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
          <span>Take Profit / Stop Loss</span>
        </label>
      </div>

      {/* TP/SL */}
      {showTpSl && (
        <div className="tp-tpsl-grid">
          <div className="tp-tpsl-row">
            <input type="number" className="trade-input" placeholder="Take profit" value={tpPrice} onChange={e => setTpPrice(e.target.value)} step="any" />
            <div className="tp-tpsl-gain"><span>Gain</span><span className="tp-tpsl-unit">$ ▾</span></div>
          </div>
          <div className="tp-tpsl-row">
            <input type="number" className="trade-input" placeholder="Stop loss" value={slPrice} onChange={e => setSlPrice(e.target.value)} step="any" />
            <div className="tp-tpsl-gain"><span>Loss</span><span className="tp-tpsl-unit">$ ▾</span></div>
          </div>
        </div>
      )}

      {/* Submit */}
      {!isConnected ? (
        <div className="connect-prompt">Connect wallet to trade</div>
      ) : !agentApproved ? (
        <button
          className="trade-submit transfer"
          onClick={async () => { switchToArbitrum(); setTimeout(approveAgent, 2000) }}
          disabled={approving}
        >
          {approving ? 'Approving...' : 'Enable Trading (one-time)'}
        </button>
      ) : !exchange ? (
        <div className="trade-error">Wallet signer unavailable. Switch to Arbitrum.</div>
      ) : available <= 0 ? (
        <button className="trade-submit add-funds" onClick={() => window.open('https://app.hyperliquid.xyz', '_blank')}>
          Not Enough Margin — Deposit
        </button>
      ) : (
        <button
          className={`trade-submit ${side}`}
          onClick={() => {
            if (!size || tokenSize <= 0) return
            setShowConfirm(true)
          }}
          disabled={placing || !size || tokenSize <= 0}
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
          <span>{orderType === 'market' ? 'Est: 3.00% max' : 'N/A (limit)'}</span>
        </div>
        <div className="tp-summary-row">
          <span>Fees</span>
          <span>0.0350% + 0.1% builder</span>
        </div>
      </div>

      {error && <div className="trade-error">{error}</div>}
      {approvalError && <div className="trade-error">{approvalError}</div>}


      {/* Order Confirmation Modal */}
      {showConfirm && (
        <OrderConfirmModal
          market={selectedMarket}
          side={side}
          size={tokenSize.toFixed(market?.szDecimals ?? 4)}
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

      {/* Deposit / Withdraw via HyperUnit + Internal Transfer */}
      {isConnected && (
        <div className="tp-deposit-section">
          <button className="tp-deposit-btn" onClick={() => window.open('https://app.hyperunit.xyz/deposit', '_blank')}>Deposit</button>
          <div className="tp-perps-spot-toggle">
            <span className="tp-toggle-active">Perps</span>
            <span className="tp-toggle-divider">|</span>
            <span>Spot</span>
          </div>
          <button className="tp-withdraw-btn" onClick={() => window.open('https://app.hyperunit.xyz/withdraw', '_blank')}>Withdraw</button>
        </div>
      )}

      {/* Spot ↔ Perps internal transfer */}
      {isConnected && exchange && <DepositWithdraw />}

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
