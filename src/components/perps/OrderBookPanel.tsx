import { useState } from 'react'
import { OrderBook } from './OrderBook'
import { RecentTrades } from './RecentTrades'

type View = 'book' | 'trades'

export function OrderBookPanel() {
  const [view, setView] = useState<View>('book')

  return (
    <div className="obp">
      {/* Tab bar — like Hyperliquid */}
      <div className="obp-tabs">
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
