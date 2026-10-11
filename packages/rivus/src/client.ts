import { Challenge, Credential, Receipt as PaymentReceipt } from "mppx";
import { tempo } from "mppx/client";
import {
  RivusError,
  accountFrom,
  balanceOf,
  clientFor,
  formatAmount,
  parseAmount,
  short,
  txUrl,
  type Address,
} from "./network.js";
import type { Outcome, Receipt, TrafficEvent, Unit, WireUnit } from "./types.js";

export type BuyerOptions = {
  // The account that locks the deposit and signs the vouchers.
  privateKey: string | undefined;
};

export type OpenOptions = {
  // The most this session can ever cost, in pathUSD. It is locked when the session opens and whatever
  // isn't spent comes back on close.
  maxSpend: string;
  // Walk away, before any money moves, from a provider quoting more than this per second.
  maxPrice?: string;
  // Ends the session early; the same as calling `session.stop()`.
  signal?: AbortSignal;
  // Called for every exchange with the provider, as it happens.
  onTraffic?: (event: TrafficEvent) => void;
};

export type Session<Value = unknown> = AsyncIterable<Unit<Value>> & {
  // What the provider quoted, in pathUSD per `unit`.
  readonly price: string | null;
  readonly unit: string | null;
  readonly channelId: string | null;
  // Authorised to the provider so far, as a decimal pathUSD string.
  readonly spent: string;
  // Set once the stream has ended.
  readonly outcome: Outcome | null;
  // Stop paying. The stream ends after the unit in flight; call `close()` to settle.
  stop(): void;
  // Settles on-chain for the work delivered and returns the rest of the deposit. Always call it for a
  // session that opened, or the deposit stays locked.
  close(): Promise<Receipt>;
};

export type Buyer = {
  readonly address: Address;
  // The buyer's on-chain pathUSD balance, as a decimal string.
  balance(): Promise<string>;
  // Asks the provider for its price, opens a payment channel and starts the work.
  open<Value = unknown>(url: string | URL, options: OpenOptions): Promise<Session<Value>>;
};

const CLOSE_RETRY_DELAY_MS = 2_000;

type Manager = ReturnType<typeof tempo.session.manager>;
type Quote = { price: string | null; unit: string | null };
// The payment credential the buyer attaches to a request, as far as the traffic log reads it.
type Payment = { action: string; channelId?: string; cumulativeAmount?: string };

// A buyer: any program holding a funded key. It pays a metered endpoint for exactly the work it
// receives and never more than the cap it was given.
export function createBuyer(options: BuyerOptions): Buyer {
  const account = () => accountFrom(options.privateKey, "the buyer's private key");

  return {
    get address() {
      return account().address;
    },
    async balance() {
      return formatAmount(await balanceOf(account().address));
    },
    async open<Value>(url: string | URL, open: OpenOptions): Promise<Session<Value>> {
      const buyer = account();
      const report = (kind: TrafficEvent["kind"], text: string, href?: string) =>
        open.onTraffic?.({ kind, text, at: Date.now(), ...(href ? { href } : {}) });

      const cap = parseAmount(open.maxSpend);
      const balance = await balanceOf(buyer.address);
      if (balance < cap) {
        throw new RivusError(
          "insufficient_funds",
          `The buyer wallet holds ${formatAmount(balance)} pathUSD, less than the ${open.maxSpend} pathUSD this session may lock.`,
        );
      }

      report("note", `agent ${short(buyer.address)} · cap ${open.maxSpend} pathUSD`);

      const quote: Quote = { price: null, unit: null };
      // A refusal raised while reading the quote; kept so it surfaces as itself whatever wraps it on the way up.
      const refusal: { error: RivusError | null } = { error: null };
      const manager = tempo.session.manager({
        account: buyer,
        client: clientFor(buyer),
        maxDeposit: open.maxSpend,
        fetch: tracedFetch({ report, quote, refusal, maxPrice: open.maxPrice }),
      });

      // The stream only becomes abortable once the channel is open: cutting the open short could
      // leave a deposit in escrow with no channel on this side to close it.
      const stream = new AbortController();
      let events: AsyncIterable<string>;
      try {
        events = await manager.sse(url, { signal: stream.signal });
      } catch (error) {
        // If the provider failed after the channel opened, take the deposit back before reporting it.
        if (manager.opened) await closeWithRetry(manager).catch(() => {});
        throw refusal.error ?? error;
      }
      report("note", `${Number(formatAmount(depositOf(manager, cap)))} pathUSD locked in escrow`);
      if (open.signal?.aborted) stream.abort();
      else open.signal?.addEventListener("abort", () => stream.abort(), { once: true });

      let outcome: Outcome | null = null;
      let closed: Promise<Receipt> | null = null;

      async function* units(): AsyncGenerator<Unit<Value>> {
        try {
          for await (const event of events) {
            const unit: WireUnit = JSON.parse(event);
            yield {
              value: unit.value as Value,
              seconds: unit.ms / 1000,
              cost: formatAmount(unit.cost),
              spent: formatAmount(manager.cumulative),
            };
          }
          outcome = stream.signal.aborted ? "stopped" : "complete";
        } catch (error) {
          if (stream.signal.aborted) outcome = "stopped";
          else if (messageOf(error).includes("exceeds local maxDeposit")) outcome = "budget";
          else throw error;
        } finally {
          // Leaving the loop early is a stop: don't keep paying for work nobody is reading.
          if (!outcome) {
            outcome = "stopped";
            stream.abort();
          }
        }
      }

      return {
        [Symbol.asyncIterator]: units,
        get price() {
          return quote.price;
        },
        get unit() {
          return quote.unit;
        },
        get channelId() {
          return manager.channelId ?? null;
        },
        get spent() {
          return formatAmount(manager.cumulative);
        },
        get outcome() {
          return outcome;
        },
        stop() {
          stream.abort();
        },
        close() {
          return (closed ??= settle(manager, { cap, outcome, report }));
        },
      };
    },
  };
}

async function settle(
  manager: Manager,
  session: { cap: bigint; outcome: Outcome | null; report: (kind: TrafficEvent["kind"], text: string, href?: string) => void },
): Promise<Receipt> {
  if (!manager.opened) throw new RivusError("not_open", "This session has no open payment channel to close.");

  if (session.outcome === "stopped") session.report("note", "stopped by the buyer · closing channel");
  if (session.outcome === "budget") session.report("note", "spending cap reached · closing channel");

  const deposit = depositOf(manager, session.cap);

  const receipt = await closeWithRetry(manager);
  // `spent` is what the close actually moves on-chain. The highest accepted voucher can sit slightly
  // above it when the work is stopped between a voucher being signed and its work being charged.
  const paid = BigInt(receipt?.spent ?? receipt?.acceptedCumulative ?? manager.cumulative);
  const refunded = deposit > paid ? deposit - paid : BigInt(0);

  session.report("done", `provider paid ${formatAmount(paid)} pathUSD`);
  session.report("done", `buyer refunded ${formatAmount(refunded)} pathUSD`);

  return {
    paid: formatAmount(paid),
    refunded: formatAmount(refunded),
    deposit: formatAmount(deposit),
    channelId: receipt?.channelId ?? manager.channelId ?? null,
    txHash: receipt?.txHash ?? null,
    txUrl: receipt?.txHash ? txUrl(receipt.txHash) : null,
    outcome: session.outcome,
  };
}

// What the channel locked: the buyer's cap, or less when the provider asked for a smaller deposit.
function depositOf(manager: Manager, cap: bigint): bigint {
  const locked = (manager.state as { deposit?: string }).deposit;
  return locked ? BigInt(locked) : cap;
}

// The close is one on-chain transaction; a dropped connection shouldn't strand the deposit.
async function closeWithRetry(manager: Manager) {
  try {
    return await manager.close();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, CLOSE_RETRY_DELAY_MS));
    return manager.close();
  }
}

// Wraps fetch so every exchange with the provider is reported as it happens. The lines are read off
// the real requests and responses: the 402 challenge, the payment credential the buyer attaches, and
// the receipt the provider returns. It is also where an overpriced quote is refused.
function tracedFetch(context: {
  report: (kind: TrafficEvent["kind"], text: string, href?: string) => void;
  quote: Quote;
  refusal: { error: RivusError | null };
  maxPrice: string | undefined;
}): typeof fetch {
  const { report, quote } = context;
  let vouchers = 0;

  return async (input, init) => {
    const request = input instanceof Request ? input : null;
    const method = init?.method ?? request?.method ?? "GET";
    const path = new URL(request?.url ?? String(input)).pathname;
    const payment = paymentOf(new Headers(init?.headers ?? request?.headers));
    const amount = payment?.cumulativeAmount ? formatAmount(payment.cumulativeAmount) : null;

    if (!payment) report("out", `${method} ${path}`);
    else if (payment.action === "open") report("out", `${method} ${path} · open channel`);
    else if (payment.action === "close") report("out", `${method} ${path} · close${amount ? ` at ${amount}` : ""}`);
    else if (payment.action !== "voucher") report("out", `${method} ${path} · ${payment.action}`);

    const sentAt = performance.now();
    const response = await fetch(input, init);
    const took = `${Math.round(performance.now() - sentAt)} ms`;

    if (!payment) {
      if (response.status !== 402) report("in", `${response.status}`);
      else {
        report("in", "402 Payment Required");
        Object.assign(quote, quoteOf(response));
        report("note", quote.price ? `price ${Number(quote.price)} pathUSD per ${quote.unit ?? "unit"}` : "price not stated");

        if (context.maxPrice && quote.price && parseAmount(quote.price) > parseAmount(context.maxPrice)) {
          report("fail", `refused · above the ${context.maxPrice} limit`);
          context.refusal.error = new RivusError(
            "price_too_high",
            `The provider asks ${Number(quote.price)} pathUSD per ${quote.unit ?? "unit"}, above the ${context.maxPrice} limit. Nothing was paid.`,
          );
          throw context.refusal.error;
        }
      }
    } else if (payment.action === "voucher") {
      vouchers += 1;
      if (response.ok) report("voucher", `voucher #${vouchers} · ${amount} · ${took}`);
      else report("fail", `voucher #${vouchers} rejected · ${response.status}`);
    } else if (!response.ok) {
      report("fail", `${response.status} · ${payment.action} refused`);
    } else if (payment.action === "open") {
      report("in", `${response.status} stream open · channel ${short(payment.channelId ?? "")}`);
    } else if (payment.action === "close") {
      const txHash = receiptOf(response)?.txHash;
      report("in", `${response.status} settled on Tempo${txHash ? ` · tx ${short(txHash)}` : ""}`, txHash ? txUrl(txHash) : undefined);
    } else report("in", `${response.status} · ${took}`);

    return response;
  };
}

function paymentOf(headers: Headers): Payment | null {
  const header = headers.get("authorization");
  if (!header) return null;
  try {
    return Credential.deserialize<Payment>(header).payload;
  } catch {
    return null;
  }
}

// The price the provider quoted in its 402 challenge.
function quoteOf(response: Response): Quote {
  try {
    const { amount, unitType } = Challenge.fromResponse(response).request as { amount: string; unitType?: string };
    return { price: formatAmount(amount), unit: unitType ?? null };
  } catch {
    return { price: null, unit: null };
  }
}

function receiptOf(response: Response): { txHash?: string } | null {
  try {
    return PaymentReceipt.fromResponse(response) as { txHash?: string };
  } catch {
    return null;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
