import { useEffect, useState } from 'react'
import { TickerBar } from '../components/perps/TickerBar'
import { MarketHeader } from '../components/perps/MarketHeader'
import { PriceChart } from '../components/perps/PriceChart'
import { OrderBookPanel } from '../components/perps/OrderBookPanel'
import { TradePanel } from '../components/perps/TradePanel'
import { Positions } from '../components/perps/Positions'

type MobilePerpsTab = 'chart' | 'book' | 'trade' | 'positions'

export function PerpsPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobilePerpsTab>('chart')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)

    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!isMobile) setMobileTab('chart')
  }, [isMobile])

  if (isMobile) {
    return (
      <div className="perps-page perps-page-mobile">
        <TickerBar />
        <MarketHeader />

        <div className="perps-mobile-shell">
          <div className="perps-mobile-tabs" role="tablist" aria-label="Perps mobile panels">
            <button
              className={`perps-mobile-tab ${mobileTab === 'chart' ? 'active' : ''}`}
              onClick={() => setMobileTab('chart')}
            >
              Chart
            </button>
            <button
              className={`perps-mobile-tab ${mobileTab === 'book' ? 'active' : ''}`}
              onClick={() => setMobileTab('book')}
            >
              Book
            </button>
            <button
              className={`perps-mobile-tab ${mobileTab === 'trade' ? 'active' : ''}`}
              onClick={() => setMobileTab('trade')}
            >
              Trade
            </button>
            <button
              className={`perps-mobile-tab ${mobileTab === 'positions' ? 'active' : ''}`}
              onClick={() => setMobileTab('positions')}
            >
              Positions
            </button>
          </div>

          <div className={`perps-mobile-panel perps-mobile-panel-${mobileTab}`}>
            {mobileTab === 'chart' && (
              <div className="perps-chart-area perps-mobile-chart">
                <PriceChart />
              </div>
            )}

            {mobileTab === 'book' && (
              <div className="perps-book-area perps-mobile-book">
                <OrderBookPanel />
              </div>
            )}

            {mobileTab === 'trade' && (
              <div className="perps-trade-area perps-mobile-trade">
                <TradePanel />
              </div>
            )}

            {mobileTab === 'positions' && (
              <div className="perps-bottom perps-mobile-positions">
                <Positions />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
