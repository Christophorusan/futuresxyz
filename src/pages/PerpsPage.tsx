import { useState } from 'react'
import { TickerBar } from '../components/perps/TickerBar'
import { MarketHeader } from '../components/perps/MarketHeader'
import { PriceChart } from '../components/perps/PriceChart'
import { OrderBookPanel } from '../components/perps/OrderBookPanel'
import { TradePanel } from '../components/perps/TradePanel'
import { Positions } from '../components/perps/Positions'

type MobileView = 'chart' | 'book' | 'trades'

export function PerpsPage() {
  const [mView, setMView] = useState<MobileView>('chart')

  return (
    <div className="perps-page">
      <TickerBar />
      <MarketHeader />

      {/* Mobile only: Chart | Order Book | Trades segmented tabs */}
      <div className="perps-mobile-tabs">
        <button className={`pm-tab ${mView === 'chart' ? 'active' : ''}`} onClick={() => setMView('chart')}>Chart</button>
        <button className={`pm-tab ${mView === 'book' ? 'active' : ''}`} onClick={() => setMView('book')}>Order Book</button>
        <button className={`pm-tab ${mView === 'trades' ? 'active' : ''}`} onClick={() => setMView('trades')}>Trades</button>
      </div>

      <div className={`perps-main pm-${mView}`}>
        {/* Left side: chart + orderbook + bottom panel */}
        <div className="perps-left">
          <div className="perps-top-row">
            <div className="perps-chart-area">
              <PriceChart />
            </div>
            <div className="perps-book-area">
              <OrderBookPanel externalView={mView === 'trades' ? 'trades' : mView === 'book' ? 'book' : undefined} />
            </div>
          </div>
          <div className="perps-bottom">
            <Positions />
          </div>
        </div>

        {/* Right side: trade panel (full height) */}
        <div className="perps-trade-area">
          <TradePanel />
        </div>
      </div>
    </div>
  )
}
