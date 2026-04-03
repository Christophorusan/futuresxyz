export function DocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-content">
        <h1>Futuresxyz</h1>
        <p className="docs-subtitle">Perpetual futures trading on Hyperliquid L1</p>

        <section className="docs-section">
          <h2>Overview</h2>
          <p>
            Futuresxyz is a high-performance trading interface built on Hyperliquid — the fastest
            on-chain order book for perpetual futures. Trade 229+ markets including crypto, indices,
            and commodities with up to 50x leverage, sub-second execution, and zero gas fees.
          </p>
          <p>
            The frontend connects directly to Hyperliquid's L1 via REST and WebSocket APIs.
            No backend server, no custodial risk — your wallet signs every order locally
            using EIP-712 typed data.
          </p>
        </section>

        <section className="docs-section">
          <h2>Features</h2>
          <div className="docs-features">
            <div className="docs-feature">
              <h3>Trading</h3>
              <ul>
                <li>Market and limit orders</li>
                <li>Take profit / stop loss trigger orders</li>
                <li>Cross margin with adjustable leverage (1-50x)</li>
                <li>One-click position close</li>
                <li>Order confirmation modal with liquidation estimate</li>
                <li>Cancel individual or all open orders</li>
              </ul>
            </div>
            <div className="docs-feature">
              <h3>Market Data</h3>
              <ul>
                <li>Real-time candlestick chart with volume bars</li>
                <li>Live order book with grouping (0.01 to 100)</li>
                <li>Recent trades feed</li>
                <li>229+ perp markets with search and filtering</li>
                <li>Market stats: mark price, funding, OI, 24h volume</li>
                <li>Scrolling ticker bar with live prices</li>
              </ul>
            </div>
            <div className="docs-feature">
              <h3>Account</h3>
              <ul>
                <li>Unified balance (spot + perps)</li>
                <li>Portfolio page with PnL tracking</li>
                <li>Position management with close buttons</li>
                <li>Trade history and fill tracking</li>
                <li>Sound notifications on fills</li>
                <li>Light / dark theme</li>
              </ul>
            </div>
            <div className="docs-feature">
              <h3>Keyboard Shortcuts</h3>
              <ul>
                <li><kbd>B</kbd> — Switch to Long</li>
                <li><kbd>S</kbd> — Switch to Short</li>
                <li><kbd>M</kbd> — Market order</li>
                <li><kbd>L</kbd> — Limit order</li>
                <li><kbd>Cmd+K</kbd> — Open market selector</li>
                <li><kbd>Esc</kbd> — Close modals</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2>Architecture</h2>
          <div className="docs-code">
            <pre>{`User Wallet (Rabby / MetaMask / Phantom)
      | signTypedData (EIP-712)
  Futuresxyz Frontend (React)
      |
  Hyperliquid L1 API
  |-- POST /info      -> market data, balances, positions
  |-- POST /exchange  -> orders, cancels, transfers, leverage
  |-- WSS /ws         -> live orderbook, candles, trades`}</pre>
          </div>
          <p>
            The frontend is fully client-side — no backend, no database, no server.
            All state comes from Hyperliquid's API and the user's connected wallet.
          </p>
        </section>

        <section className="docs-section">
          <h2>Supported Markets</h2>
          <p>All Hyperliquid perpetual futures are available — currently 229 markets including:</p>
          <ul>
            <li><strong>Major crypto</strong> — BTC, ETH, SOL, BNB, AVAX, XRP, DOT, ADA, NEAR, SUI, APT, HYPE</li>
            <li><strong>DeFi</strong> — AAVE, UNI, MKR, CRV, DYDX, GMX, SNX, LDO, PENDLE, MORPHO, ONDO, ENA</li>
            <li><strong>L2 / Infra</strong> — OP, ARB, STRK, ZK, ZETA, SEI, TIA, MOVE, BERA, INJ, INIT</li>
            <li><strong>AI</strong> — AI16Z, AIXBT, FET, RENDER, TAO, VIRTUAL, GRIFFAIN, GRASS, KAITO</li>
            <li><strong>Memes</strong> — DOGE, PEPE, SHIB, WIF, BONK, FARTCOIN, POPCAT, PNUT, TRUMP, MON</li>
            <li><strong>Indices</strong> — SPX (S&P 500)</li>
            <li><strong>Commodities</strong> — PAXG (gold-backed)</li>
          </ul>
          <p>
            Note: Additional tradfi markets (oil, forex, custom indices) are available through
            third-party frontends like trade.xyz that create custom HyperEVM-based instruments.
            These are separate from Hyperliquid's native perps.
          </p>
        </section>

        <section className="docs-section">
          <h2>Builder Codes</h2>
          <p>
            Futuresxyz earns revenue through Hyperliquid's Builder Codes system. Every trade
            placed through the frontend automatically includes a small builder fee.
          </p>
          <ul>
            <li><strong>Fee rate</strong> — 0.03% per trade (configurable up to 0.1%)</li>
            <li><strong>Revenue</strong> — Paid directly to the builder's Hyperliquid account</li>
            <li><strong>User approval</strong> — One-time gasless signature (EIP-712)</li>
            <li><strong>Requirement</strong> — Builder wallet needs 100+ USDC in perps account</li>
          </ul>
          <div className="docs-code">
            <pre>{`// src/config/hyperliquid.ts
export const BUILDER_ADDRESS = '0x...'  // Your wallet
export const BUILDER_FEE = 30           // 30 = 0.03%`}</pre>
          </div>
        </section>

        <section className="docs-section">
          <h2>Wallet Support</h2>
          <p>
            Connect any EVM-compatible wallet. The app uses wagmi's injected connector
            which auto-detects your browser wallet:
          </p>
          <ul>
            <li><strong>Rabby</strong> — Full Hyperliquid support, recommended</li>
            <li><strong>MetaMask</strong> — Works with EIP-712 signing</li>
            <li><strong>Phantom</strong> — EVM mode</li>
            <li><strong>Coinbase Wallet</strong> — Browser extension or mobile</li>
            <li><strong>WalletConnect</strong> — Any mobile wallet via QR code</li>
          </ul>
          <p>
            No private keys are ever exposed. Your wallet signs typed data messages
            locally — the signature is sent to Hyperliquid, not the key.
          </p>
        </section>

        <section className="docs-section">
          <h2>Tech Stack</h2>
          <ul>
            <li><strong>Vite + React 19 + TypeScript</strong> — Build tooling and UI</li>
            <li><strong>wagmi + viem</strong> — Wallet connection and EVM interactions</li>
            <li><strong>@nktkas/hyperliquid</strong> — Typed SDK for Hyperliquid L1 API</li>
            <li><strong>TradingView Lightweight Charts</strong> — Candlestick + volume charting</li>
            <li><strong>react-router-dom</strong> — Client-side routing</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>API Endpoints</h2>
          <h3>REST (POST /info)</h3>
          <div className="docs-code">
            <pre>{`meta()                  -> market metadata (name, decimals, maxLeverage)
allMids()               -> current mid prices for all markets
metaAndAssetCtxs()      -> funding rates, OI, 24h volume
clearinghouseState()    -> user positions, margin, withdrawable
spotClearinghouseState()-> spot balances (USDC, tokens)
candleSnapshot()        -> historical OHLCV candle data
recentTrades()          -> recent fills for a market
openOrders()            -> user's open orders
userFills()             -> user's trade history`}</pre>
          </div>
          <h3>REST (POST /exchange)</h3>
          <div className="docs-code">
            <pre>{`order()                 -> place order (market, limit, trigger)
cancel()                -> cancel order(s) by asset + oid
usdClassTransfer()      -> transfer USDC between spot and perps
updateLeverage()        -> change leverage for a market
approveBuilderFee()     -> approve builder fee (one-time)`}</pre>
          </div>
          <h3>WebSocket (WSS /ws)</h3>
          <div className="docs-code">
            <pre>{`l2Book     -> order book updates (bids/asks with depth)
candle     -> live candle updates (OHLCV per interval)
trades     -> trade stream (price, size, side, time)`}</pre>
          </div>
        </section>

        <section className="docs-section">
          <h2>Project Structure</h2>
          <div className="docs-code">
            <pre>{`src/
  config/
    wagmi.ts              # Wallet config (chains, connectors)
    hyperliquid.ts        # Builder address, fees, API URLs
  contexts/
    HyperliquidContext    # InfoClient + ExchangeClient provider
    MarketContext         # Selected market state
    ThemeContext           # Light/dark theme
    ToastContext           # Toast notifications
  hooks/
    useMarketMeta         # All perp markets + prices (cached)
    useMarketStats        # Funding, OI, volume for a market
    useOrderBook          # WebSocket L2 book with grouping
    useCandles            # Historical + live OHLCV candles
    useUserState          # Unified balance, positions, margin
    useAccountData        # Spot balances, open orders, fills
    usePlaceOrder         # Order, cancel, cancelAll, TP/SL
    useModifyLeverage     # Update leverage per market
    useKeyboardShortcuts  # B/S/M/L/Cmd+K/Esc shortcuts
    useSoundNotifications # Audio beep on new fills
  components/perps/
    PriceChart            # Candlestick + volume chart
    OrderBook             # Grouped orderbook with view modes
    OrderBookPanel        # Order book / Recent trades tabs
    TradePanel            # Order form + confirmation modal
    MarketSelector        # Full market search with tabs
    MarketHeader          # Mark, funding, volume, OI stats
    TickerBar             # Scrolling price ticker
    Positions             # Bottom panel (balances, positions, orders)
  pages/
    PerpsPage             # Main trading interface
    PortfolioPage         # Portfolio with PnL, balances, history
    DocsPage              # This page`}</pre>
          </div>
        </section>

        <section className="docs-section">
          <h2>Self-Hosting</h2>
          <div className="docs-code">
            <pre>{`# Clone
git clone https://github.com/Chrisportugal/futuresxyz.git
cd futuresxyz

# Install + run
npm install
npm run dev        # http://localhost:5173

# Build + deploy
npm run build
npx vercel --prod  # Deploy to Vercel (free)`}</pre>
          </div>
          <p>
            Total cost: $0. The Hyperliquid API is free, the SDK is open source,
            and Vercel's free tier handles the hosting.
          </p>
        </section>

        <section className="docs-section">
          <h2>Links</h2>
          <ul>
            <li><strong>GitHub</strong> — github.com/Chrisportugal/futuresxyz</li>
            <li><strong>Hyperliquid API</strong> — hyperliquid.gitbook.io/hyperliquid-docs</li>
            <li><strong>Hyperliquid SDK</strong> — github.com/nktkas/hyperliquid</li>
            <li><strong>Builder Codes</strong> — hyperliquid.gitbook.io/.../builder-codes</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
