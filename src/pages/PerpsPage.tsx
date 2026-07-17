import { TickerBar } from '../components/perps/TickerBar'
import { MarketHeader } from '../components/perps/MarketHeader'
import { PriceChart } from '../components/perps/PriceChart'
import { OrderBookPanel } from '../components/perps/OrderBookPanel'
import { TradePanel } from '../components/perps/TradePanel'
import { Positions } from '../components/perps/Positions'

export function PerpsPage() {
  return (
    <div className="perps-page">
      <TickerBar />
      <MarketHeader />

      <div className="perps-main">
        {/* Left side: chart + orderbook + bottom panel */}
        <div className="perps-left">
          <div className="perps-top-row">
            <div className="perps-chart-area">
              <PriceChart />
            </div>
            <div className="perps-book-area">
              <OrderBookPanel />
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
