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

      <div className="perps-grid">
        <div className="perps-chart-area">
          <PriceChart />
        </div>
        <div className="perps-book-area">
          <OrderBookPanel />
        </div>
        <div className="perps-trade-area">
          <TradePanel />
        </div>
      </div>

      <div className="perps-bottom">
        <Positions />
      </div>
    </div>
  )
}
