# Cross-chain swaps in Oslo

The `/bridge` page is linked from Swap and Deposit. Hyperliquid spot trading remains at `/spot` and is linked from the bridge page.

## deBridge: embedded integration

Oslo loads the official deBridge widget from `https://app.debridge.com/assets/scripts/widget.js`. No Oslo API key is needed. The widget supplies available networks, assets, quotes, transaction review and transfer status. The initial selection is Arbitrum → Ethereum; users choose their destination in the widget. Availability depends on the provider and route.

An already connected Oslo EVM wallet is passed to the widget. Solana wallets connect inside the widget. Users still approve wallet prompts. This is a provider-controlled embedded interface, not automatic background bridging or automatic price comparison between providers. HyperEVM balances are separate from Hyperliquid trading balances; a trading deposit must explicitly target the trading account.

## Across: activation required

The native quote, exact-amount approval, swap and delivery-status flow is implemented, but stays disabled until `VITE_ACROSS_PROXY_URL` is configured. Until then, the Across tab links to the official app. GitHub Pages cannot host the required backend.

1. Obtain an Across API key and a two-byte hexadecimal integrator ID through [Across](https://docs.across.to/api-reference).
2. Deploy `server/across-proxy.mjs` on a Node.js 22+ service with HTTPS. No additional server dependencies are needed. Start command: `node server/across-proxy.mjs`.
3. Set these environment variables privately on that service:

| Variable | Value |
| --- | --- |
| `ACROSS_API_KEY` | Across API key; never a `VITE_` variable or repository value |
| `ACROSS_INTEGRATOR_ID` | Assigned integrator ID, for example the format `0x1234`; do not use this example as an assigned ID |
| `ALLOWED_ORIGINS` | `https://christophorusan.github.io` (comma-separated additional exact origins if needed) |
| `HOST` | `0.0.0.0` for container hosting; defaults to loopback for local use |
| `PORT` | Hosting platform's port; defaults to `8787` |

4. In GitHub repository Settings → Secrets and variables → Actions → Variables, set **`ACROSS_PROXY_URL`** to the HTTPS service base URL. The existing Pages workflow maps it to `VITE_ACROSS_PROXY_URL`. Re-run the Pages deployment after setting it.
5. For local development only, set `VITE_ACROSS_PROXY_URL=http://127.0.0.1:8787` in `.env.local`, allow the exact Vite origin in the backend's `ALLOWED_ORIGINS`, and restart Vite. Inject backend credentials using your hosting environment or secret manager; do not put them in the frontend env file.

The server exposes only GET `/chains`, `/tokens`, `/quote`, and `/status`, validates inputs, and keeps authorization headers server-side. Set API quotas and edge rate limits on the host. CORS is not authentication: non-browser clients can supply an Origin header. The built-in 60 requests/minute limit uses socket IP and does not trust forwarded headers, so a reverse proxy can share that limit across users.

## Behavior and limits

- Native Across execution is EVM only: Ethereum, Optimism, Base, Arbitrum and HyperEVM, further filtered by Across's live network/token responses. Solana signing and HyperCore gasless deposits are not implemented in the native Across flow.
- Exact-input swaps use 0.5% slippage and request refunds to the sending wallet on the source network. Oslo adds no affiliate fee.
- Quotes expire after at most 60 seconds. Wallet, route, recipient or amount changes require a fresh quote.
- ERC-20 approvals are for the exact quoted input. After approval confirms, users request a fresh quote and separately confirm the swap.
- A submission attempt clears its quote. If a wallet/RPC error occurs, check wallet history before retrying; an error does not prove nothing was broadcast.
- Source confirmation is separate from destination delivery. The last transfer hash is saved locally. A missing/not-yet-indexed status is not reported as a failed transfer.
- The provider supplies transaction calldata; Oslo validates the response shape, account, network, token, amounts, allowance and simulation, then simulates again before submission. It does not independently decode every possible provider route.

## Validation

`npm test` covers amount precision, malformed/mismatched quotes, exact approvals, expiration, wallet changes, token/network filtering, proxy query restrictions, origin/method checks and private upstream authorization. `npm run build` checks the production bundle.

The deBridge widget was visually verified without connecting a wallet. Across tests use fixtures and a mock upstream server. Before enabling Across for users, verify the configured live token/quote/status endpoints and perform a user-controlled small transfer for each route you intend to support. No real transfer was made by the coding agent.

References: [deBridge widget](https://docs.debridge.com/dln-details/widget/deBridge-widget), [Across API](https://docs.across.to/api-reference).
