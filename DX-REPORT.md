# Jupiter Signal Forge DX Report

## Summary

I built a small Jupiter API signal dashboard that uses the Tokens API and Price API to rank token opportunities and generate a Trigger V2 order draft. The project is intentionally read-only: it creates a decision ticket and a draft payload, but does not sign or submit orders.

## First Successful API Call

Time from docs landing to first successful API call was about 5 minutes using keyless access.

Working calls:

```bash
curl "https://api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112,JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
curl "https://api.jup.ag/tokens/v2/search?query=JUP"
```

Keyless access made prototyping much faster. I could avoid account setup while validating the idea, then leave `JUP_API_KEY` support in the app for real Developer Platform usage and analytics.

## What Worked Well

- The API responses are clean JSON and easy for an agent to parse.
- `Price V3` gives exactly the fields needed for a first risk screen: `usdPrice`, `liquidity`, `blockId`, and `priceChange24h`.
- `Tokens V2 search` is rich enough to build a signal layer without needing extra APIs: metadata, icons, holder count, liquidity, market data, and interval stats.
- `llms.txt` was useful as an entry point because it gave me endpoint names, base URLs, and the keyless-vs-keyed distinction quickly.

## Friction And Confusing Parts

- Several docs pages say to fetch the documentation index at `https://dev.jup.ag/docs/llms.txt`, but that URL returned a 404 in my test. `https://developers.jup.ag/llms.txt` worked. This should be made consistent because agents follow exact URLs.
- Trigger V2 is well explained conceptually, but it would help to have a "dry-run planning" section. Many agent workflows should not immediately touch wallet auth or vault deposits. A documented payload planner or validator endpoint would let agents generate safe drafts before any user funds move.
- The Price API docs mention some tokens may return null or be missing due to heuristics. The response shape is clean, but a `rejectionReason` or optional warning field would make downstream UI much better.
- The Tokens API returns a lot of useful nested stats. A compact "agent-safe summary" schema would reduce the need for every agent to invent its own scoring model.
- CORS behavior was not obvious from the docs. I used a small local Node proxy because I did not want a browser-only prototype to fail unexpectedly.

## API Edge Cases Found

- Requesting common mints works well, but stablecoins can be intentionally boring or absent depending on the requested set and heuristics. The app handles missing prices by falling back to token search values and showing conservative decisions.
- Trigger V2 has several real-world prerequisites: API key, wallet challenge JWT, vault setup, signed deposit flow, and minimum order size. That is good for security, but a beginner can miss how much is needed beyond the order payload.

## AI Stack Feedback

I used `llms.txt` and raw Markdown docs. That was enough to get started without leaving the terminal.

What would improve it:

- Put the canonical `llms.txt` URL in a prominent, copyable place on every docs page.
- Add "agent recipes" with bounded tasks like: read price, rank tokens, create Trigger draft, simulate swap quote, or generate user-facing safety warnings.
- Add a machine-readable examples folder with minimal JSON request and response fixtures for each API.
- Add a "never do this in agents" safety section, especially around wallet signatures, custodial vault setup, and order execution.

## How I Would Rebuild Developer Onboarding

I would make developers interface with APIs immediately on page one:

1. A copyable keyless curl that works without signup.
2. The same call with `x-api-key`.
3. A short "turn this into an app" card for browser, Node, and Python.
4. A safety ladder: read-only APIs, transaction builders, signed execution, and custodial/vault flows.
5. A generated API notebook where every response can be downloaded as JSON fixtures for tests.

## What I Wish Existed

- A Trigger V2 draft validation endpoint that checks order direction, minimum size, mints, slippage, and trigger price without requiring wallet auth.
- A `/signals` or `/token-risk-summary` endpoint that compacts Tokens + Price into a durable, documented score surface.
- A public sandbox wallet or canned JWT flow for demos, so builders can show the full Trigger lifecycle without touching real funds.
- Official TypeScript helper functions for keyless/keyed fetch, rate-limit handling, and response normalization.

## Project Notes

The project never submits orders or signs transactions. It stops at a "decision ticket" because that is the safest boundary for an autonomous agent. A human with a wallet can inspect the rationale and decide whether to proceed through Jupiter's authenticated Trigger V2 flow.
