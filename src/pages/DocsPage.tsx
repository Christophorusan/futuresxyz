export function DocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-content">
        <h1>Futuresxyz Documentation</h1>
        <p className="docs-subtitle">A Hyperliquid perps trading frontend with Builder Codes revenue</p>

        <section className="docs-section">
          <h2>Architecture</h2>
          <p>
            Futuresxyz is a client-side React application that connects directly to Hyperliquid's L1 API.
            No backend server is needed — all trading happens through signed EIP-712 messages sent to Hyperliquid's
            REST and WebSocket endpoints.
          </p>
          <div className="docs-code">
            <pre>{`User Wallet (Rabby / MetaMask / Phantom)
      ↓ signTypedData (EIP-712)
  React Frontend
      ↓↑
  Hyperliquid L1 API
  ├── POST /info     → market data, account state
  ├── POST /exchange → orders, builder fee, leverage
  └── WSS /ws        → live prices, orderbook, candles`}</pre>
          </div>
        </section>

        <section className="docs-section">
          <h2>Tech Stack</h2>
          <ul>
            <li><strong>Vite + React 19 + TypeScript</strong> — Build tooling and UI framework</li>
            <li><strong>wagmi + viem</strong> — Wallet connection (auto-detects Rabby, MetaMask, Phantom, WalletConnect)</li>
            <li><strong>@nktkas/hyperliquid SDK</strong> — Typed Hyperliquid API client (InfoClient, ExchangeClient)</li>
            <li><strong>TradingView Lightweight Charts</strong> — Candlestick charting (Apache 2.0)</li>
            <li><strong>react-router-dom</strong> — Client-side routing (Perps, Predictions, Protocols, Docs)</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>Builder Codes (Revenue)</h2>
          <p>
            Futuresxyz earns revenue through Hyperliquid's Builder Codes system. Every order placed through the
            frontend includes a builder fee that goes directly to the builder's Hyperliquid perps account.
          </p>
          <ul>
            <li><strong>One-time approval</strong> — User signs an <code>ApproveBuilderFee</code> message (EIP-712, no gas)</li>
            <li><strong>Per-order fee</strong> — Each order includes <code>builder: {'{'} b: address, f: fee {'}'}</code></li>
            <li><strong>Max fee</strong> — 0.1% on perps, configurable in <code>src/config/hyperliquid.ts</code></li>
            <li><strong>Builder requirement</strong> — 100 USDC minimum in perps account</li>
          </ul>
          <div className="docs-code">
            <pre>{`// src/config/hyperliquid.ts
export const BUILDER_ADDRESS = '0xYOUR_ADDRESS'
export const BUILDER_FEE = 30  // 30 = 3 bps = 0.03%`}</pre>
          </div>
        </section>

        <section className="docs-section">
          <h2>Wallet Connection</h2>
          <p>
            Uses wagmi's <code>injected()</code> connector which auto-detects the user's browser wallet:
            Rabby, MetaMask, Phantom (EVM), Coinbase Wallet, etc. WalletConnect is also supported
            for mobile wallets.
          </p>
          <p>
            The connected wallet's <code>walletClient</code> is passed to the Hyperliquid SDK's
            <code>ExchangeClient</code> which uses it for EIP-712 typed data signing.
            No private keys are ever exposed — signing happens in the wallet.
          </p>
        </section>

        <section className="docs-section">
          <h2>Data Flow</h2>
          <h3>Market Data (REST polling)</h3>
          <ul>
            <li><code>info.meta()</code> — All perp market metadata (name, szDecimals, maxLeverage)</li>
            <li><code>info.allMids()</code> — Current mid prices for all markets</li>
            <li><code>info.metaAndAssetCtxs()</code> — Funding rates, open interest, 24h volume</li>
            <li><code>info.clearinghouseState()</code> — User positions, margin, balances</li>
            <li><code>info.candleSnapshot()</code> — Historical OHLCV candle data</li>
          </ul>

          <h3>Real-time (WebSocket)</h3>
          <ul>
            <li><code>l2Book</code> — Order book updates (bids/asks)</li>
            <li><code>candle</code> — Live candle updates</li>
            <li><code>trades</code> — Trade stream (available for future use)</li>
            <li><code>userFills</code> — User fill notifications (available for future use)</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>Project Structure</h2>
          <div className="docs-code">
            <pre>{`src/
├── config/
│   ├── wagmi.ts           # Wallet config (chains, connectors)
│   └── hyperliquid.ts     # Builder address, fees, API URLs
├── contexts/
│   ├── HyperliquidContext  # InfoClient + ExchangeClient
│   ├── MarketContext       # Selected market state
│   └── ThemeContext        # Light/dark theme
├── hooks/
│   ├── useMarketMeta      # All perp markets + prices
│   ├── useMarketStats     # Funding, OI, volume, 24h change
│   ├── useOrderBook       # WebSocket L2 book
│   ├── useCandles         # Historical + live candles
│   ├── useUserState       # Positions, balances, margin
│   ├── useBuilderApproval # Builder fee approval flow
│   └── usePlaceOrder      # Order submission + builder fee
├── components/
│   ├── shared/            # ConnectButton, BuilderBanner
│   └── perps/             # Chart, OrderBook, TradePanel, etc.
├── pages/                 # Perps, Predictions, Protocols, Docs
└── lib/                   # Format utils, WS manager, constants`}</pre>
          </div>
        </section>

        <section className="docs-section">
          <h2>HIP-4 Prediction Markets</h2>
          <p>
            HIP-4 introduces outcome contracts — binary YES/NO prediction markets on Hyperliquid.
            Currently on testnet, mainnet deployment is imminent. The Predictions page will be
            activated when the <code>outcomeMeta</code> API endpoint goes live on mainnet.
          </p>
          <ul>
            <li>Same L1 API, same CLOB matching engine</li>
            <li>1x margin only (no leverage, no liquidation risk)</li>
            <li>Builder Codes work the same way</li>
            <li>Kalshi partnership for institutional-grade outcomes</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>Deployment</h2>
          <div className="docs-code">
            <pre>{`# Development
npm run dev

# Production build
npm run build

# Deploy to Vercel (free)
npx vercel --prod

# Costs: $0 (API free, SDK free, hosting free)
# Revenue: Builder fees on every trade`}</pre>
          </div>
        </section>
      </div>
    </div>
  )
}
