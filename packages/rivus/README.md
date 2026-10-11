# rivus-meter

Pay-per-second billing for compute and APIs, on Tempo.

A provider hands Rivus the work it sells. Rivus quotes the price, opens a payment channel, times the work, bills each piece for the time it took, and settles on-chain when either side is done. A buyer pays for exactly what it receives, never more than the cap it set, and gets the rest of its deposit back automatically.

Built on Tempo's Machine Payments Protocol: Tempo provides the payment channel, Rivus provides the meter. There is no contract to deploy, no account to open and no API key.

> Version 0.1 runs on Tempo's Moderato testnet with faucet-issued test tokens. No real funds are involved.

## Install

```
npm install rivus-meter
npx rivus-meter init      # testnet keys in .env.local, both wallets funded from the faucet
```

Requires Node.js 20.12 or later.

## Sell work: the meter

```ts
import { createMeter } from "rivus-meter/server";

const meter = createMeter({
  privateKey: process.env.PROVIDER_PRIVATE_KEY,   // the account that gets paid
  secret: process.env.RIVUS_SECRET,
  price: "0.01",                                  // pathUSD per second of work
  deposit: "1",                                   // what a buyer is asked to lock
});

// Next.js route handler. Each value yielded is delivered to the buyer and billed for the time it took.
export const { GET, POST } = meter.route(async function* (job) {
  for await (const result of doTheWork(job.signal)) {
    yield result;
  }
});
```

- **Timing.** By default the meter clocks each step of the generator. If the work measures itself more precisely, bill that figure instead: `yield job.unit(value, { seconds })`.
- **Payment before delivery.** If the buyer's authorised total is not enough, the stream pauses until a new voucher arrives.
- **Minimum charge.** The first second is paid when the stream opens and drawn down before anything more is charged.
- **Stopping.** `job.signal` aborts when the buyer stops, disconnects or reaches its cap. Pass it to the work.
- **Other servers.** `meter.handler(work)` returns one `(request: Request) => Promise<Response>` for any server that speaks web-standard requests.
- **Next.js.** Add `"rivus-meter"` to `serverExternalPackages` and run the route on the Node.js runtime.

## Buy work: the buyer

```ts
import { createBuyer } from "rivus-meter/client";

const buyer = createBuyer({ privateKey: process.env.AGENT_PRIVATE_KEY });

const session = await buyer.open("https://provider.example/api/render", {
  maxSpend: "1",        // the most this session can ever cost
  maxPrice: "0.02",     // walk away, before paying, from anything dearer per second
});

for await (const unit of session) {
  use(unit.value);      // unit.seconds, unit.cost, unit.spent
}

const receipt = await session.close();   // settles on-chain, refunds the rest
console.log(receipt.paid, receipt.refunded, receipt.txUrl);
```

- **Price limit.** The provider states its price before any money moves. Above `maxPrice`, `open` throws a `RivusError` with the code `price_too_high` and nothing is paid.
- **Spending cap.** `maxSpend` is locked when the session opens. The stream stops if it is reached.
- **Stopping early.** Leave the loop, call `session.stop()`, or abort the `signal` passed to `open`.
- **Always close.** `session.close()` settles for the work delivered and returns the rest. A close that fails once is retried.
- **Traffic.** `onTraffic` reports every exchange with the provider as it happens: the quote, the channel opening, each voucher, the settlement.

## From a terminal

```
rivus init                     create testnet keys in .env.local and fund both wallets
rivus pay <url> [options]      buy metered work and print what was paid
    --max <pathUSD>            the most the session can cost (default 1)
    --max-price <pathUSD>      refuse a provider quoting more than this per second
    --stop-after <seconds>     stop early and take the refund
rivus balance                  show both wallets' balances
```

## What it is built on

`rivus-meter` depends on [`mppx`](https://github.com/wevm/mppx), Tempo's Machine Payments Protocol SDK, for the payment channel and vouchers, and on [`viem`](https://viem.sh) for chain access. Both are installed with it.

## License

MIT
