# Decision log — Rivus

Running record of why the project is shaped the way it is, so later work doesn't have to reconstruct the reasoning from scratch.

## Why Tempo, not another chain

Of the eight chains available in Colosseum's Crypto World's Fair (Solana, Tempo, Zcash, Hyperliquid, Ethereum L1, Base, Arbitrum One, Robinhood Chain), Tempo scored best on a combined difficulty/cost/competition analysis: it's EVM-compatible (Solidity skills transfer, unlike Solana's Rust/Anchor model), has a credible team behind it (Stripe and Paradigm), and its track wasn't yet carrying the scale of competition Solana's track has from five prior Colosseum cohorts. A full comparison across all eight chains, scored on technical difficulty, cost/fee risk, tooling maturity, and track crowding, was produced earlier in this project's research and can be recreated from that scoring model if needed.

## Why streaming/metered payments, not another payment primitive

A survey of public repos already submitted to Tempo's track (Held, Fermata, Wink, Float, Corridor, a UPI-to-stablecoin travel app, and an integration into an existing agent-payments protocol) showed every one of them building some version of the same thing: escrow, identity/addressing, settlement, or financing — payment-rail primitives. None of them were building a product on top of a primitive. Two use cases Tempo names as target markets — payroll and recurring/subscription billing — had no visible entry. Metered, streaming payments (billing continuously rather than one-shot) was chosen as the angle because it's a genuinely different shape of product from everything else in the track, not a fourth version of the same thing.

## Why the mechanism is not custom-built

Tempo's Machine Payments Protocol already implements exactly the payment-channel mechanism a streaming-payments product needs: TIP-20 channels, off-chain EIP-712 vouchers, on-chain settlement, refund of unused balance. Building a custom version of this would have been redundant work that also signals unfamiliarity with the platform to judges who know it well. The decision was made to integrate Tempo's own `mppx` SDK directly and spend the build's time budget on the product layer instead.

## Why a fractal render as the demo task

The demo needed a task that is genuinely billable by real elapsed compute time (not a simulated progress bar, and not a rebuild of Tempo's own documented "AI text streamed per token" example, which would look like copying the docs rather than building something new). A tile-based Mandelbrot renderer is real CPU-bound work, requires no external API keys or paid dependencies, is easy to tune to a demo-friendly duration (roughly 20-40 seconds), and is visually satisfying to watch fill in — which matters for a judge watching a three-minute video. It is explicitly a stand-in for "any metered compute or API task," not the actual proposed business — the pitch is the billing infrastructure, not fractal rendering as a product.

## Why the "for developers" panel matters

Early framing risked reading as "a cool fractal app" rather than "reusable billing infrastructure." The fix was to put the actual integration code visibly on the page, so a viewer can see in seconds that this is a pattern any provider could drop into their own service, not a one-off toy built around one specific task.

## Why the name Rivus

Latin for "stream, brook, channel." Chosen because it directly echoes "payment channel" — the actual technical term for the underlying TIP-20 mechanism — and "streaming payments," the product's core mechanic. Considered and rejected: Klepsydra (Greek, "water clock" — a beautiful metaphor for metering time via flow, but harder to spell and say), Metron (Greek, "measure" — ties to the taxi-meter analogy used while explaining the concept, but a common word with existing naming collisions), Stilla (Latin, "a drop" — poetic but less literally connected to the mechanism).

## Chain choice is settled, not just a default

Colosseum's registration allows selecting multiple ecosystem tracks, and Tempo was already one of the ones selected at registration — so there's no registration-lock conflict with building on Tempo. Briefly considered whether the product should instead target Base or Hyperliquid: neither has a native pay-per-second/streaming-payment feature the way Tempo does, so porting there would mean either integrating a third-party protocol (Superfluid or Sablier, unconfirmed on either chain, likely more plausible on Base than on Hyperliquid) or building custom payment-streaming logic — reintroducing the exact scope and platform-fit problem that was avoided by building on Tempo in the first place. Decision: stay on Tempo only; do not spread the submission across multiple chains.

## Testnet is allowed; mainnet is optional

The Official Rules (colosseum.com/legal/Crypto World's Fair Hackathon Rules.pdf) never mention testnet, devnet, or mainnet. The Tempo track awards "products that integrate with the Tempo blockchain," and Colosseum's own guidance recommends a functional devnet demo. Decision: build and submit on Moderato testnet. A real mainnet transaction in the final days is an optional bonus for the Functionality and Business Plan criteria, not a requirement.

Other rule points that affect the submission:
- Judging criteria (section 8): Functionality, Potential Impact, Novelty, UX, Open-source, Business Plan.
- Section 9: entrants must disclose open-source and third-party code used (here: `mppx`, `viem`, Next.js).
- Section 12: all content must be in English.
- Section 7: one project submission per team.

## Why Rivus became a package (Oct 10)

Until two days before the deadline, the developer section told people to install Tempo's `mppx` and `viem` and described Rivus as "a pattern on top of Tempo's own SDK, so there is nothing of ours to deploy." That was accurate and it was the problem: a developer following the steps used nothing of ours, and a judge could fairly read the project as Tempo's SDK plus a demo. The logic that makes per-second billing work (timing the work, converting time to charges, the minimum charge, safe stopping, the cap, the refund) existed, but inside the demo's route files, where nobody else could use it.

Decision: Rivus is a product developers install. That logic was moved into `rivus-meter` (`packages/rivus`) with a meter for providers, a buyer for agents and a `rivus` command, and the demo was rebuilt on it. The earlier decision not to rebuild Tempo's payment channel still stands: the package is built on `mppx`. The line is "Tempo provides the channel, Rivus provides the meter."

Rule that follows: no page, document or pitch material should tell a developer to install Tempo's SDK or call Rivus a pattern. The install is `rivus-meter`; Tempo's SDK is what it is built on.

The buyer's price limit (`maxPrice`) was added at the same time, in answer to "what if someone doesn't want to pay that much per second": the provider's price is quoted before any money moves, and a buyer with a limit refuses a dearer provider at that point.

## Standing constraints for this project

- No AI/assistant attribution anywhere — not in commits, not in code comments, not in any document, not as a co-author or contributor credit of any kind.
- 13-day build window from planning (Sept 29, 2026) to the Oct 12, 2026 submission deadline — every scope decision should be checked against whether it's achievable in that window.
- No custom smart contract — this is a deliberate scope reduction, not an oversight.
- Rivus is presented as the `rivus-meter` package, never as "install Tempo's SDK" or "a pattern".
- Testnet only (Tempo Moderato, chain ID 42431) for the hackathon build.
