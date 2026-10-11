# Product Requirements — Rivus

## Problem

Renting compute or paying for metered API usage today forces a bad tradeoff: pay a flat rate upfront (wasteful when the job finishes early, or a barrier when it runs long), or get billed after the fact from an invoice you have to trust, often with a multi-day delay before the provider actually receives funds. Building accurate, real-time, per-second billing is expensive infrastructure work that most providers — especially small or independent ones — never get around to building themselves.

This gets sharper as more purchasing shifts from people to software. An AI agent that needs to rent compute, call a paid API, or consume another agent's service has no simple way to pay for exactly what it uses, in real time, without a human pre-negotiating a contract or manually approving each charge.

## What Rivus is

Billing infrastructure that lets a provider charge per second (or per unit of usage) for anything metered, settled automatically on Tempo, with instant refunds for unused balance. Two integration points:

- **Provider side**: a small amount of server-side code turns any existing endpoint into a metered, pay-as-you-go endpoint.
- **Buyer side**: a small amount of client-side code lets an app or an autonomous agent pay automatically as it consumes the service — no manual card entry, no pre-arranged invoice.

Rivus does not implement the payment mechanism itself. Tempo's Machine Payments Protocol already provides the channel-based, voucher-signed, on-chain-settled mechanism this requires. Rivus integrates it and is the first real product built on it for this use case.

## Target users

- **Providers**: anyone selling metered compute, an API, or any usage-based digital service, who wants precise per-second billing and fast settlement without building billing infrastructure themselves.
- **Buyers**: applications or autonomous AI agents that need to pay for exactly what they consume, automatically, without a human in the loop for each transaction.

## Demo scope (hackathon submission)

A single, working, two-sided example of the above, rather than a general-purpose marketplace (that's the longer-term vision — see below):

- A provider endpoint that performs real, CPU-bound compute (a tile-based fractal render) and charges per second of actual work performed.
- A buyer-facing page that starts a render, shows it filling in live, shows a live running cost meter, and can stop the job at any time for an instant refund of the unused balance.
- A visible link to the settled transaction on Tempo's public explorer, so the payment is verifiably real, not simulated.
- A visible "for developers" panel showing the actual integration code, so it's clear the demo runs on an installable package (`rivus-meter`) and is not a one-off app.

## Explicitly out of scope for the hackathon build

- A general marketplace connecting many providers and buyers (this is the follow-on vision, not the 13-day build).
- Real GPU provisioning or any actual AI/ML workload — the fractal render is a deliberately simple, honest stand-in for "metered compute," chosen so the billing story is provably true without needing real infrastructure.
- Wallet-connect UX for human users — MPP is a machine-to-machine protocol; the demo uses a programmatic account, matching its actual design point.
- Mainnet deployment — the demo runs entirely on Tempo's Moderato testnet with test stablecoins.

## Success criteria

- A judge can watch a under-3-minute video and understand, without narration beyond captions, that: the compute is real, the billing is exact and automatic, unused funds are refunded instantly, and this integrates in a few lines of code into any existing service.
- The repo is public, runs from a clean checkout following the README, and the demo works live against the testnet, not just in a recording.
- The submission includes a credible go-to-market angle: who would actually adopt this, and evidence (even light) that the pain point is real.

## Longer-term vision (for the pitch, not the 13-day build)

A hosted marketplace/directory where many providers list metered services and many buyers (including autonomous agents) discover and pay for them through the same underlying integration — effectively becoming the default way usage-based billing works for agent-to-agent commerce on Tempo.
