# Jupiter Signal Forge

Jupiter Signal Forge turns live Jupiter Tokens + Price API data into a small decision dashboard for Trigger V2 order planning.

It is intentionally non-custodial and does not submit trades. It ranks searched Solana tokens by liquidity, organic/trust signals, short-term momentum, and 24h change, then emits a Trigger V2 draft payload that a wallet-authenticated user could refine.

## Run

```bash
JUP_API_KEY=optional_developer_platform_key npm start
```

If you do not use npm:

```bash
JUP_API_KEY=optional_developer_platform_key node server.mjs
```

Open `http://localhost:4173` and search for `JUP`, `SOL`, or another token.

Without `JUP_API_KEY`, the app uses Jupiter keyless prototype access.

## Verify

```bash
node --check server.mjs
node --check public/app.js
node scripts/scan.mjs JUP
```

## What It Uses

- `GET https://api.jup.ag/tokens/v2/search?query=...`
- `GET https://api.jup.ag/price/v3?ids=...`
- Trigger V2 docs to shape a safe order draft, without submitting funds.

## Why It Exists

The hackathon asks for unusual Jupiter Developer Platform integrations plus honest DX feedback. This project explores a "strategy ticket" workflow: agents can research token conditions, create human-readable reasoning, and hand a safe draft to a wallet-holding human.

## Safety

The app never asks for private keys, never signs transactions, and never sends Trigger V2 requests. Trigger V2 requires API-key auth, wallet challenge JWT, vault setup, and signed deposit flow.

## Files

- `server.mjs` serves the dashboard and proxies Jupiter API calls.
- `public/app.js` renders the signal dashboard.
- `scripts/scan.mjs` runs a CLI smoke test against the local server.
- `DX-REPORT.md` contains the Developer Experience report for the bounty.
