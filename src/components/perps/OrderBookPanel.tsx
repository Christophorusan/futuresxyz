import { useState } from 'react'
import { OrderBook } from './OrderBook'
import { RecentTrades } from './RecentTrades'

type View = 'book' | 'trades'

export function OrderBookPanel({ externalView }: { externalView?: View }) {
  const [internalView, setView] = useState<View>('book')
  const view = externalView ?? internalView

  return (
    <div className="obp">
      {/* Tab bar — like Hyperliquid; hidden when the mobile page tabs drive the view */}
      <div className={`obp-tabs ${externalView ? 'obp-tabs-external' : ''}`}>
        <button
          className={`obp-tab ${view === 'book' ? 'active' : ''}`}
          onClick={() => setView('book')}
        >
          Order book
        </button>
        <button
          className={`obp-tab ${view === 'trades' ? 'active' : ''}`}
          onClick={() => setView('trades')}
        >
          Recent trades
        </button>
      </div>

      {/* Content */}
      <div className="obp-content">
        {view === 'book' ? <OrderBook /> : <RecentTrades />}
      </div>
    </div>
  )
}
