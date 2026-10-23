# Email and X wallets for Oslo

The integration is prepared but remains OFF until a public Privy App ID is configured. The current wallet connection flow continues to work without it.

## Activate email

1. Create an Oslo application at https://dashboard.privy.io. Review the provider's plan and terms yourself.
2. Enable Email as a login method. Users receive a one-time code; Oslo never receives their email password.
3. Configure allowed origins for `https://christophorusan.github.io` and your local development origin (for example `http://127.0.0.1:5175`). Use the exact OAuth redirect URLs provided by Privy where requested; don't guess them from the `/futuresxyz/` path.
4. Set the public App ID in `.env.local` as `VITE_PRIVY_APP_ID=...`. Never put a Privy App Secret or X client secret in a Vite variable, the repository, or browser code.
5. In this repository's GitHub Settings → Secrets and variables → Actions → Variables, set `PRIVY_APP_ID` to that same public App ID. The Pages workflow maps it to the build variable. Redeploy using the workflow's Run workflow button.

## Activate X

Enable Twitter/X in Privy's login settings and follow its OAuth setup instructions, including any X developer app credentials and redirect allowlists. Keep secrets exclusively in the provider dashboards. Then set `VITE_PRIVY_X_ENABLED=true` locally and `PRIVY_X_ENABLED=true` as a GitHub Actions repository variable. Rebuild/redeploy. Email can be enabled independently.

## User experience and scope

Connect Wallet offers Continue with email, optionally Continue with X, and Connect an existing wallet. New social/email users without a wallet receive an embedded EVM wallet automatically. Returning users restore the existing wallet. The authenticated wallet flows into Oslo's existing Wagmi balance, transaction, and Hyperliquid signing interfaces. Disconnect also signs out of the Privy session. If disconnected while still authenticated, Use your email or social wallet restores the active wallet.

This does not create Solana wallets, fund accounts, add bridging, or eliminate transaction approvals. Solana address tracking is unchanged. Email and X sign-ins may create separate accounts unless linked through a separately implemented account-linking flow; don't assume a matching email merges them.

## Required verification before enabling in production

Use a test Privy app and a wallet you control. Complete email OTP sign-up and sign-in, verify the same wallet address returns after logout, refresh, and signing in on a second device. Confirm cancelling login leaves the app usable, and verify external-wallet connections still work. Test X only after OAuth is configured. Test network switching, HyperEVM transaction review, and Hyperliquid typed-data signing in an appropriate test environment; do not send real funds as a UI test. Review Privy's recovery/export settings and user-support process before onboarding funded accounts.

Local build and unit tests validate the integration compiles; they cannot validate actual authentication without your configured Privy application. Keep production variables unset until these checks pass. Unset `PRIVY_APP_ID` and redeploy to revert to external-wallet-only onboarding.

## Official references

- https://docs.privy.io/basics/react/setup
- https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
- https://docs.privy.io/authentication/user-authentication/login-methods/email
- https://www.alchemy.com/docs/wallets/authentication/overview
