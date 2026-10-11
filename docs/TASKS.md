# Tasks — Rivus

Deadline: Crypto World's Fair submissions close **October 12, 2026**, 11:59pm PT.

## Day 1 — Foundation ✅

- [x] `git init` the `rivus/` project; `.gitignore` excludes `.env*`
- [x] Scaffold Next.js 16 (TypeScript) + Tailwind 4
- [x] Generate testnet-only keypairs for the provider and the buyer agent; fund both via the Moderato faucet (`npm run setup`)
- [x] Install `mppx` and `viem`; confirm the real API against the SDK's types and official SSE example, and correct `docs/ARCHITECTURE.md`
- [x] Smoke test end to end on testnet — went straight to the streaming session (harder path) instead of a one-time charge: 10 metered units streamed, billed per unit, settled on-chain, unused deposit refunded (`npm run smoke`)

## Days 2-3 — Compute engine

- [x] Build the tile-based Mandelbrot renderer in `lib/fractal.ts`, independent of any payment logic
- [x] Tune iteration depth and tile size so a full render takes roughly 20-40 seconds of real compute (1080x720, 216 tiles of 60px, 7x7 supersampling, 1000 max iterations: ~24s; `npm run bench`)
- [x] Confirm the tile output streams cleanly (in isolation, before wiring to SSE/payments) (`npm run bench -- out.png` reassembles the tiles into an image)

## Days 4-5 — Metered payments

- [x] Wrap the render endpoint in `mppx`'s session/streamed-payment middleware (done on Day 1 with placeholder units)
- [x] Replace placeholder units with fractal tiles. Decision: each tile is charged for its measured CPU time at 0.01 pathUSD per compute-second (`stream.charge(amount)`), so the bill tracks real compute rather than tile count. The first compute-second is paid when the stream opens and drawn down before further charges, which makes it the minimum charge
- [x] Confirm vouchers accumulate correctly (verified on a full render: 24.22s of compute settled for exactly 0.242215 pathUSD)
- [x] Confirm final close-and-refund works against the testnet (verified on Day 1)
- [x] Test the stop-early path: agent closes mid-stream, provider is paid only for work done (verified on testnet from the page; a tile already in flight when Stop is pressed is still billed, typically under 0.001 pathUSD)
- [x] Confirm the mid-stream voucher path: vouchers are signed incrementally through every render, and when the deposit cap is reached the stream stops and the channel settles at the cap (`MAX_DEPOSIT=0.05 npm run smoke`)

## Days 6-7 — Dashboard

- [x] `Canvas.tsx` — progressive tile rendering
- [x] `Meter.tsx` — live elapsed-time and accumulating-cost display
- [x] Start / Stop controls, with Stop triggering an early channel close and visible refund
- [x] `ProviderPanel.tsx` — polls and displays the provider's balance so both sides of the payment are visible (also used for the buyer, so the escrow lock and refund show up in its on-chain balance)
- [x] `DevSnippet.tsx` — the collapsed "for developers" panel showing the real integration code
- [x] Settled-transaction link to the Tempo explorer shown on completion or stop

## Days 8-9 — Polish and edge cases

- [x] Visual design pass — this needs to look clean on a screen recording, not just function (channel-lifecycle strip under the canvas, deposit bar on the meter, one-row settlement receipt, per-run balance changes, Rivus mark and favicon; the whole flow fits a 1440x900 window without scrolling)
- [x] Landing page at `/` (3D hero, product explanation, animated walkthrough of a session, embedded live demo, developer setup, stack diagram); the demo on its own moved to `/demo` for recording
- [x] "Built on Tempo" moved up to the first section after the hero, with what Tempo provides and the network details; drag-to-stop calculator added
- [x] Documentation at `/docs`, with a PDF copy at `public/rivus-docs.pdf` (regenerate it after editing the document)
- [x] Handle: starting a render with an underfunded wallet (balance checked before the channel opens; the page says how to refill)
- [x] Handle: network drop mid-stream (if the browser disconnects, the agent stops the render and settles for the work done; a disconnect during channel open costs the one-second minimum and the deposit is returned)
- [x] Handle: rapid start/stop/start (one render at a time; a start while another is running or settling gets a clear message)
- [x] Agent traffic pane in the demo (`components/Terminal.tsx`): the buyer agent's `fetch` is wrapped in `app/api/agent/route.ts`, so the 402 quote, channel open, every voucher, the close and the settlement tx are reported live from the real exchanges. Verified on testnet for a full render and a stop-early run; the two party panels became one compact card to keep the flow on one 1440x900 screen
- [x] Rivus as an installable package, `rivus-meter` (`packages/rivus`): the meter (`createMeter`), the buyer (`createBuyer`, with a price limit, spending cap, traffic reporting and guaranteed close) and the `rivus` command (`init`, `pay`, `balance`). The demo's routes were rebuilt on it; `lib/tempo.ts`, `lib/provider.ts`, `scripts/setup-wallets.mts` and `scripts/smoke.mts` were replaced by it. The landing page's developer section, the documentation and its PDF, the README and the architecture doc now describe the package. Verified on testnet: full render, stop-early, price refusal, cap reached, and the packed tarball installed and run in an empty project
- [x] "Give this to your agent" in the hero (`components/landing/AgentPrompt.tsx`): two copyable commands, `npx rivus-meter init` and `npx rivus-meter pay <this site>/api/render --max 0.5`, with the address taken from wherever the page is served. Works for a stranger once the package is on npm and the site is deployed
- [x] Live settlements strip on the landing page (`components/landing/LiveLedger.tsx`, `/api/ledger`, `lib/ledger.ts`), replacing the static facts: sessions settled, pathUSD paid, pathUSD refunded and the latest four settlements as explorer links, all read from the chain (the escrow's transfers to the provider), not recorded by the app
- [ ] Publish `rivus-meter` to npm (`npm login`, then `npm publish` in `packages/rivus`), so the install line on the site works for a stranger. The name was free on Oct 10
- [x] Cross-check the whole flow end to end at least twice from a clean state (fresh copy: `npm install`, `npm run setup`, production build, two full paid renders)

## Day 10 — Non-code submission materials

- [ ] Lock final product name/description text for the submission form
- [ ] Write the go-to-market one-pager: target customer, distribution plan
- [ ] Get at least a couple of real conversations with people who build AI-agent or usage-billing infrastructure, as demand-validation evidence
- [ ] Write team background section
- [ ] Prepare logo

## Day 11 — Video

- [ ] Record the 2-3 minute pitch video
- [ ] Record the demo video (3 minutes or under), showing: start → live render + meter → stop mid-way with visible refund → explorer link → dev-integration panel

## Day 12 — Submission

- [ ] Final QA pass on the live testnet (not just the recording)
- [ ] Clean the public repo: remove any secrets, confirm `.env.local` was never committed, tidy the README
- [ ] Fill out and submit the Colosseum submission form: product name, description, chains/tools used, team backgrounds, location, logo, GitHub repo link, pitch video, demo video, go-to-market plan

## Day 13 (Oct 12) — Buffer

- [ ] Reserved for anything that broke, ran long, or needs a last fix before the deadline
