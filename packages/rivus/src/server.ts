import { Mppx, Store, tempo } from "mppx/server";
import { PATH_USD, accountFrom, balanceOf, clientFor, formatAmount, parseAmount, RivusError, type Address } from "./network.js";
import type { WireUnit } from "./types.js";

export type MeterOptions = {
  // The account that gets paid and signs the on-chain close.
  privateKey: string | undefined;
  // A random server-side secret; it signs the payment challenges this meter issues.
  secret: string | undefined;
  // pathUSD per second of work, e.g. "0.01".
  price: string;
  // What a buyer is asked to lock when a session opens. Whatever isn't spent returns to them on close.
  deposit: string;
  // What the buyer is told one second is a second of. Shown in the price quote.
  unit?: string;
};

const TIMED = Symbol("rivus.timed");
type Timed = { [TIMED]: true; value: unknown; seconds: number };

export type Job = {
  // Aborts when the buyer stops, disconnects or runs out of deposit. Pass it to the work so it stops too.
  signal: AbortSignal;
  request: Request;
  // Bills a value for a working time you measured yourself, instead of the time Rivus clocked for it.
  unit(value: unknown, measured: { seconds: number }): unknown;
};

// The work to sell: an async generator. Each value it yields is delivered to the buyer and billed for
// the time it took to produce.
export type Work = (job: Job) => AsyncIterable<unknown>;

type Handler = (request: Request) => Promise<Response>;

export type Meter = {
  // The same handler for both methods: the stream is a GET, vouchers and the close arrive as POSTs.
  route(work: Work): { GET: Handler; POST: Handler };
  // A single web-standard handler, for frameworks that don't split by method.
  handler(work: Work): Handler;
  readonly address: Address;
  // The provider's on-chain pathUSD balance, as a decimal string.
  balance(): Promise<string>;
  readonly price: string;
  readonly deposit: string;
};

// One payments instance per provider account for the whole process. A dev server re-evaluates modules
// on reload, and the stream and its voucher requests must all see the same open channels.
const INSTANCES = Symbol.for("rivus.meter.instances");
type Instance = { mppx: ReturnType<typeof createPayments>; address: Address };
const instances = ((globalThis as unknown as Record<symbol, Map<string, Instance>>)[INSTANCES] ??= new Map());

function createPayments(options: MeterOptions) {
  if (!options.secret) throw new RivusError("missing_key", "Missing the meter's secret. Run `npx rivus-meter init` to create one.");
  const account = accountFrom(options.privateKey, "the provider's private key");
  const client = clientFor(account);
  return Mppx.create({
    secretKey: options.secret,
    methods: [tempo.session({ account, currency: PATH_USD, getClient: () => client, store: Store.memory(), sse: true })],
  });
}

// A meter for one provider: wrap the work you sell and Rivus quotes the price, opens the payment
// channel, times the work, bills each piece for the time it took, and settles when either side is done.
export function createMeter(options: MeterOptions): Meter {
  const perSecond = parseAmount(options.price);
  const perMs = Number(perSecond) / 1000;

  // Keys are read on the first request, not at import, so a build without them still succeeds.
  const instance = (): Instance => {
    const address = accountFrom(options.privateKey, "the provider's private key").address;
    let found = instances.get(address);
    if (!found) instances.set(address, (found = { mppx: createPayments(options), address }));
    return found;
  };

  const handler = (work: Work): Handler =>
    async function handle(request) {
      const result = await instance().mppx.session({
        amount: options.price,
        suggestedDeposit: options.deposit,
        unitType: options.unit ?? "second",
      })(request);

      // No payment yet: quote the price.
      if (result.status === 402) return result.challenge;
      // Vouchers and the close.
      if (request.method !== "GET") return result.withReceipt(new Response(null, { status: 204 }));

      // The paid stream.
      return result.withReceipt(async function* (stream) {
        // Opening the stream pays for the first second; work draws that down before anything more is charged.
        await stream.charge();
        let credit = perSecond;

        const job: Job = {
          signal: stream.signal,
          request,
          unit: (value, measured) => ({ [TIMED]: true, value, seconds: measured.seconds }) satisfies Timed,
        };
        const steps = work(job)[Symbol.asyncIterator]();

        try {
          while (true) {
            const startedAt = performance.now();
            const step = await steps.next();
            if (step.done) break;

            const timed = isTimed(step.value) ? step.value : null;
            const ms = timed ? timed.seconds * 1000 : performance.now() - startedAt;
            const cost = BigInt(Math.round(ms * perMs));
            const due = cost > credit ? cost - credit : BigInt(0);
            credit -= cost - due;
            // Waits for a fresh voucher from the buyer when the channel needs more headroom.
            if (due > BigInt(0)) await stream.charge(due);

            yield JSON.stringify({ value: timed ? timed.value : step.value, ms, cost: cost.toString() } satisfies WireUnit);
          }
        } finally {
          // The buyer left or the charge failed: let the work clean up.
          await steps.return?.();
        }
      });
    };

  return {
    handler,
    route(work) {
      const handle = handler(work);
      return { GET: handle, POST: handle };
    },
    get address() {
      return instance().address;
    },
    async balance() {
      return formatAmount(await balanceOf(instance().address));
    },
    price: options.price,
    deposit: options.deposit,
  };
}

function isTimed(value: unknown): value is Timed {
  return typeof value === "object" && value !== null && TIMED in value;
}
