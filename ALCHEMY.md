# HyperEVM lending and Alchemy

## Implemented

- HyperLend pooled markets are read from its deployed data provider. Felix remains linked to its native app. HypurrFi has been removed. No hardcoded market rates, TVLs or token decimals in the lending UI.
- Supply, withdraw, variable-rate borrow and repay run in-app with explicit transaction review and wallet confirmation. Exact token approvals, zero-reset when required, reserve/cap/balance/liquidity checks, fresh preflight reads, contract simulation, chain/account checks and receipt verification are included.
- Optional Alchemy smart accounts batch approval and action. The same owner is used to resolve the separate non-7702 smart account. All positions and balances use the selected account address. Existing wallet debt is never silently migrated.
- Smart-wallet prepareCalls performs preflight before review; sendCalls prepares again before signing/submission. Gas Manager sponsorship is used only when a policy is configured. Failed/uncertain operations are not automatically resubmitted.
- Reviewed transfers into the smart account and back to its owner for native HYPE and selected reserve tokens. Existing loans/collateral are not transferred.
- HYPE/WHYPE wrapping in either account mode, with user review. This is conversion, not staking.
- HyperEVM balances in Portfolio and lending, native gas balance, live ERC-20 decimals, and persistent local transaction history with status recovery and replacement handling.
- Alchemy HTTP RPC batching and public fallback for HyperEVM, Ethereum and Arbitrum. SDK is lazy-loaded. HyperCore trading retains its native APIs.
- GitHub Actions tests, builds and deploys the site; direct route navigation uses a 404 fallback.

## Alchemy activation

Create/sign in to your own Alchemy account. Create an app enabling HyperEVM (and Ethereum/Arbitrum if desired). Restrict the browser API key to `https://christophorusan.github.io` and appropriate local development origins, and set usage alerts/limits. Browser keys are public in the delivered JavaScript; never use a management key.

Set GitHub repository secret `ALCHEMY_BROWSER_API_KEY`. Optionally create a gas sponsorship policy and set repository variable `ALCHEMY_GAS_POLICY_ID`. Re-run “Verify and deploy Futuresxyz”. Local equivalents are in `.env.example`; use `.env.local`, which is ignored.

Start sponsorship with explicit spending limits and a contract/function allowlist:
- the HyperLend pool address in `src/lib/lending/contracts.ts`: supply, withdraw, borrow, repay;
- supported reserve ERC-20s: approve, limited to this pool spender where policy granularity supports it;
- WHYPE at 0x5555555555555555555555555555555555555555: deposit, withdraw.

Policy support varies; contract restrictions alone do not validate all calldata. Configure per-user/global budgets and abuse controls in Alchemy. Sponsorship may be denied and never guarantees execution. No session keys, automatic borrowing authority, wallet custody, or unlimited approvals are enabled.

## Deployment and verification

`npm ci && npm test && npm run build`

Read-only mainnet integration tests:
`LIVE_RPC=https://rpc.hyperliquid.xyz/evm npx vitest run tests/lending-live.test.ts`

Functional fork tests (only ever send to loopback):
1. `anvil --fork-url https://rpc.hyperliquid.xyz/evm --host 127.0.0.1 --port 8545 --chain-id 999`
2. `FORK_TEST=1 npx vitest run tests/lending-fork.test.ts`

The official public RPC only supports latest state and cannot provide a consistent historical fork. Tests advance local time to avoid negative accrual from freshly fetched storage. They are functional smoke tests, not archival risk simulations. An Alchemy archival endpoint should be used for pinned-block, reproducible regression testing. Mainnet reads are intentionally latest-state reads; displayed block is an observed reference, not an atomic snapshot.

Verified during development: published pool/provider identity and reserve/account ABIs on mainnet; HyperLend WHYPE supply → borrow → repay → withdraw on the local fork. Mainnet transactions were not executed. Alchemy service calls and sponsorship require the user's configuration and have not been live-tested without it.

## Remaining boundaries

Felix CDPs/Morpho and staking are separate protocol integrations, not implemented by Alchemy. Those existing products still link to their native apps. Reserve caps can prevent new borrows; the UI displays and enforces them. Do not imply every listed asset permits borrowing.

A receipt confirms execution, not future lending safety. Rates, collateral prices and health factor change. No autonomous risk management is provided. Browser activity history is local to that browser and falls back to memory when persistent storage is unavailable.

## Sources

- https://docs.hyperlend.finance/developer-documentation/contract-addresses
- https://docs.hyperlend.finance/developer-documentation/core-pools/pool
- https://github.com/hyperlendx/hyperlend-core
- https://www.alchemy.com/docs/wallets/recipes/hyperliquid-wallets
- https://www.alchemy.com/docs/wallets/third-party/signers/custom-integration
- https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/json-rpc

## Payments (October 2026)

`/payments` provides reviewed HyperEVM transfers for HYPE, WHYPE, USDC, USDT0,
and USDH. Token decimals and balances are read onchain; direct payments use
`transfer`, never `approve`. Native payments reserve an estimated network fee.
Both review and confirmation perform fresh preflight checks. The wallet shows
final gas. QR codes encode either the receiving address or a Futuresxyz request
link; requests use URL fragments and cannot automatically submit transactions.
Request amounts, recipient addresses and chain 999 are validated. Incoming
history is linked to HyperEVM Scan; local activity is explicitly browser-local,
not presented as a complete transaction index. No card, fiat, or Elios backend
integration is implied.

Alchemy RPC fallback, smart-account request/prepare/send/status APIs and optional
gas policies are wired into payments. `ALCHEMY_SMART_WALLETS_ENABLED=true` must be
set as a repository variable (Vite equivalent in `.env.example`) only after a
successful signer and smart-account integration test. The official overview says
external browser wallets are not supported, while its custom-signer guide shows
a browser WalletClient with non-7702 support. Because these sources conflict,
production activation requires verification, not just an API key. HyperEVM uses
separate sma-b accounts; deposits and debts in an existing wallet do not migrate.

- https://www.alchemy.com/docs/wallets/authentication/overview
- https://www.alchemy.com/docs/wallets/third-party/signers/custom-integration
- https://www.alchemy.com/docs/wallets/recipes/hyperliquid-wallets
- https://www.eliospay.com/ (product reference, no integration API used)

Configure `ALCHEMY_BROWSER_API_KEY` in GitHub Actions secrets, enable HyperEVM in
that Alchemy app, restrict allowed origins, and verify `eth_chainId` returns
`0x3e7`. An `arb-mainnet.g.alchemy.com` endpoint targets Arbitrum and cannot be used
as the HyperEVM RPC. Do not paste management credentials into frontend code.
Gas sponsorship additionally needs `ALCHEMY_GAS_POLICY_ID` and bounded policy
spending/target rules. Paid services and live sponsored transfers have not been
activated or tested by these changes.

Payment validation: seven unit tests cover request roundtrips, wrong networks,
unsupported assets, invalid precision, token call encoding, insufficient balances,
self/token-contract recipients, gas reserves and false-returning ERC20s. An opt-in
loopback fork test executes native and WHYPE payments and checks recipient balance
changes with simulated funds. Run `FORK_TEST=1 npx vitest run tests/payments-fork.test.ts`
against a local Anvil fork at 127.0.0.1:8545. Public latest-state RPC makes this a
functional smoke test, not an archival regression. No real mainnet payment was made.

All application routes now load lazily. The main entry chunk fell from about
951 kB to 412 kB uncompressed in the local production build; shared dependencies
and the selected route still load separately, so this is not a total-page byte
or measured latency comparison. Removed placeholder social links and corrected
the repository link.

Compatible dependency security updates reduced npm audit findings from 16
(including 10 high) to two moderate findings in the existing Hyperliquid SDK /
Valibot dependency chain. The remaining fix requires a breaking SDK upgrade and
is deferred from the payments release. A page error boundary lets stale tabs
reload safely after a deployment. Public RPC remains active by user preference;
no Alchemy service activation is claimed.
