# Mobile wallet

Open `/wallet` for supported HyperEVM balances, send/receive shortcuts and lending access. The narrow-screen layout includes bottom navigation, touch-sized controls and safe-area spacing. The web manifest launches into the wallet; iPhone users can add it to the home screen from Safari. An internet connection is required; financial data and transaction execution are not cached for offline use.

Wallet extensions and compatible wallet-app browsers are detected through wagmi. The account panel exposes the full address, network, copy and disconnect actions. Keys remain with the connected wallet.

## Optional mobile pairing

Create a WalletConnect/Reown project and configure its allowed origins. Set the public GitHub Actions repository variable `WALLETCONNECT_PROJECT_ID` (local development: `VITE_WALLETCONNECT_PROJECT_ID`). Rebuild/deploy to enable QR/deep-link pairing. Without it, direct injected wallet connections remain available. A project ID is not a private credential; never put private API credentials or signing keys in Vite variables.

Wallet compatibility depends on support for HyperEVM and the signing methods requested by each feature. This is a mobile web interface, not an App Store wallet, and does not guarantee every wallet supports every operation. Public RPC remains the default; Alchemy activation is separate (see ALCHEMY.md).

## Validation

Production builds pass with pairing disabled and with a placeholder project ID to exercise the optional bundle. The existing suite passes (29 tests, three opt-in integration tests skipped). Browser checks cover the narrow layout, no-wallet state, dialog dismissal and receive shortcut. Real-device wallet pairing and real-money transactions were not performed.
