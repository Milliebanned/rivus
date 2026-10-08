# Rivus

Pay-per-second billing infrastructure for Tempo, demonstrated with a live compute-rental app.

## What this is

Rivus lets any compute or API provider charge customers by the second — automatically, with an instant refund for whatever isn't used — instead of flat fees or after-the-fact invoices. It's built directly on Tempo's Machine Payments Protocol (MPP), which already provides the underlying payment-channel mechanics (opening a channel, signing off-chain vouchers, settling on-chain, refunding unused balance). Rivus is the product layer on top: a real, working example of a provider and a buyer using that mechanism, plus a drop-in integration pattern other providers can adopt.

The working demo: a provider rents out compute time to render a fractal image. The renderer does genuine CPU-bound work; the buyer is charged in real time for exactly the seconds of computation used, watches the image fill in live next to a running cost meter, and can stop at any point to get an instant refund of the unused balance.

The fractal is a stand-in task chosen because it's honestly billable and visually clear in a short demo — the real target use case is any provider selling metered compute or API access, and any buyer (increasingly, an autonomous AI agent) that needs to pay for exactly what it consumes without manual billing.

## Why Tempo

Tempo is a payments-first blockchain built for stablecoin settlement at high throughput and low cost. Its MPP toolkit (`mppx`) already implements pay-as-you-go and streamed payment channels (TIP-20, EIP-712 vouchers) — the exact primitive this product needs — so Rivus does not implement its own payment channel or smart contract. It integrates Tempo's SDK directly and puts the engineering effort into the product experience instead.

## Docs

- [`docs/PRD.md`](docs/PRD.md) — problem, users, features, scope
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical design
- [`docs/DESIGN.md`](docs/DESIGN.md) — UX and demo flow
- [`docs/TASKS.md`](docs/TASKS.md) — build checklist
- [`memory.md`](memory.md) — decision log

## Status

Working end to end on Tempo's Moderato testnet: the metered endpoint renders a fractal tile by tile, bills each tile for the CPU time it actually took (0.01 pathUSD per compute-second), and settles on-chain with automatic refund of the unused deposit. A full render is about 24 seconds of compute and costs about 0.24 pathUSD. The dashboard at `http://localhost:3000` shows the render, the live meter, both parties' balances, and the settlement transaction; stopping mid-render settles for the work done and refunds the rest. Polish and edge-case handling are next — see `docs/TASKS.md`.

## Quickstart

```
npm install
npm run setup    # creates .env.local with testnet-only keys and funds both wallets from the faucet
npm run dev      # starts the app at http://localhost:3000 — open it and press Start render
npm run smoke    # in a second terminal: runs a buyer agent that pays for a full render and prints the settlement tx
npm run bench    # renders without any payment logic and prints timing; pass a path to also write a PNG
```

Everything runs on testnet with faucet-issued test tokens. No real funds are involved. See `docs/ARCHITECTURE.md` for chain details.
