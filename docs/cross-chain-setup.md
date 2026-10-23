# Cross-chain bridge activation status

Oslo now owns one cross-chain form. Users select networks, tokens and amount without picking a bridge provider. Metadata from configured providers is combined; quotes are requested concurrently, and one provider failing does not discard the other result. Executable quotes rank before previews, then by greatest expected output for the same requested asset. This is **not a guarantee of lowest total cost**: source gas and additional native protocol fees are shown separately. Quotes are not silently changed after review. Changing input or wallet invalidates the quote. Existing provider-specific approval, simulation, expiry and delivery checks remain in place.

## What is ready and what is not

- EVM cross-chain: native Oslo form, deBridge public quote previews, automatic Across inclusion when its backend is configured and a wallet connected. Both native execution paths require the setup below.
- Hyperliquid Spot: existing native order-book screen under other swap options; it uses HyperCore balances, not EVM wallet balances.
- Solana: **not yet implemented** in the unified native form. Solana keys/signatures are distinct from the connected EVM account. Do not infer a Solana address from an Ethereum address or silently send funds to an unrelated recipient.
- Same-chain EVM swaps: not implemented by this cross-chain adapter; it rejects identical source/destination networks.

## Native Solana implementation plan

Use Jupiter Swap v2 for Solana → Solana and deBridge/Across only for routes their live APIs explicitly support. Jupiter's current `/order` endpoint supports public quote previews without an API key; production requests should use a private server-side `JUPITER_API_KEY`.

1. Add a Solana Wallet Standard connection alongside the current EVM connection (including Phantom when installed). Keep the active Solana account synchronized with wallet account/disconnect events. Show which address receives an asset.
2. Deploy a restricted Jupiter proxy on the same backend host. Allow only token discovery, GET `/swap/v2/order`, and POST `/swap/v2/execute`; pin upstream hosts, authenticate with `x-api-key`, limit origins/body sizes/rates, and never accept arbitrary upstream URLs or added affiliate fees.
3. Request `/order` with inputMint, outputMint, exact integer amount and connected Solana taker. Validate mint/amount/recipient consistency, expiration and fee/slippage disclosures; decode and inspect the returned transaction, fee payer and signers before asking the wallet to sign. Never sign server-side for the user.
4. Send the user-signed transaction with its request ID to `/execute`; distinguish submission from confirmation and destination delivery. An ambiguous timeout requires status lookup before retrying.
5. Add Solana-aware provider adapters for cross-chain routes, using the provider's Solana chain identifier and base58 addresses (not the current EVM-only validators). Require the connected destination account for EVM ↔ Solana routes. Do not reuse EVM approval or transaction code.
6. Test rejected signatures, account changes, expired quotes, insufficient SOL, mismatched mints/recipients, failed simulations and duplicate submissions. Perform user-controlled small transfers before activation.

Backend keys and host are not supplied yet. No native Solana execution is enabled or claimed. The current Jupiter link is explicitly external. Official reference: https://developers.jup.ag/docs/swap.

---

# Cross-chain swaps in Oslo

Swap and Bridge are separate again. Sidebar Swap and Wallet Swap open Hyperliquid Spot at `/spot`; `/swap` redirects there. Sidebar Bridge and Deposit open cross-chain transfers at `/bridge`. Bridge retains automatic deBridge/Across quote routing.

## deBridge: Oslo interface, DLN backend

The embedded provider widget has been removed. Oslo owns the asset/network selection, amount entry, quote review, exact token approval, wallet submission, and delivery-status UI. DLN supplies live tokens, quotes, and transaction calldata. No widget script or iframe is loaded.

Without a backend URL, the form offers live read-only quotes through the public API. **Submission is disabled until the authenticated backend is configured.** deBridge permits public development requests but requires an API key for commercial integrations.

1. Request a commercial API key through the [official authentication page](https://docs.debridge.com/dln-details/integration-guidelines/order-creation/authentication).
2. Deploy `server/debridge-proxy.mjs` to a Node.js 22+ HTTPS service. Start command: `node server/debridge-proxy.mjs`.
3. Set private server environment `DEBRIDGE_API_KEY`, `ALLOWED_ORIGINS=https://christophorusan.github.io`, and `HOST=0.0.0.0`. `PORT` defaults to `8788`; use the hosting platform's assigned port when needed. Never put the key in a `VITE_` variable. Disable upstream URL logging because DLN's documented authentication uses an `accesstoken` query parameter.
4. Set the repository Actions variable `DEBRIDGE_PROXY_URL` to that service's HTTPS base URL and rerun the Pages deployment. The workflow supplies `VITE_DEBRIDGE_PROXY_URL` to the frontend.
5. For local development use `VITE_DEBRIDGE_PROXY_URL=http://127.0.0.1:8788`, allow the exact Vite origin on the backend, and restart Vite.

The proxy accepts only supported network/token lists, exact-input quotes and order-status requests. It blocks caller-supplied fees, authentication overrides and arbitrary endpoints. Cancellation authorities, recipient and refund beneficiary must all match the sending wallet. Credentials never reach the client. CORS is not authentication; apply hosting quotas and edge rate limits. The built-in limit is 60 requests/minute per socket IP.

Native routes cover Ethereum, Arbitrum, Base, Optimism and HyperEVM, filtered by live provider availability. HyperEVM uses DLN internal ID `100000022` and wallet chain ID `999`; these are deliberately distinct. HyperEVM receipt is **not** a Hyperliquid trading deposit. Solana signing and direct HyperCore deposits are not yet implemented in this native form; a labeled external link retains access to the official provider app for those routes.

Quotes expire 30 seconds from request start. Input amount remains exact (`prependOperatingExpenses=false`); routing costs reduce the receive amount. The protocol's native fixed fee and source gas are displayed separately. ERC-20 approval is exact, requires a separate confirmation, and is followed by a fresh quote. The native flow checks known DLN source/router addresses, token/chain/amount/precision consistency, native fee totals, wallet identity and expiry. It simulates before sending. Transaction calldata remains provider-supplied and is not independently fully decoded. Last-transfer hash and order ID are saved locally; source confirmation and destination fulfillment are reported separately. Cancellation links open the provider's order management interface.

## Across: activation required

The native quote, exact-amount approval, swap and delivery-status flow is implemented, but stays disabled until `VITE_ACROSS_PROXY_URL` is configured. Until then, Across is excluded from automatic route requests. GitHub Pages cannot host the required backend.

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

The native deBridge form was tested with read-only live quotes and no connected wallet. Both provider test suites use fixtures and mock upstream servers. No live approval, swap, or cancellation has been executed. Before enabling Across for users, verify the configured live token/quote/status endpoints and perform a user-controlled small transfer for each route you intend to support. No real transfer was made by the coding agent.

References: [deBridge API](https://docs.debridge.com/dln-details/integration-guidelines/order-creation/creating-order/creating-order), [Across API](https://docs.across.to/api-reference).
