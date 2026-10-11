import { createPublicClient, http, parseAbiItem } from "viem";
import { PATH_USD, chain, type Address } from "rivus-meter";

// Tempo's payment-channel escrow on Moderato. A settlement is one transaction in which it pays
// the provider for the work and returns the rest of the deposit to the buyer.
const ESCROW = "0x4d50500000000000000000000000000000000000";
const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 amount)");
// The RPC serves at most this many blocks per log query (about 17 hours of chain).
const CHUNK = BigInt(100_000);
// How far back the first read goes: about two and a half weeks.
const LOOKBACK_CHUNKS = 24;
// The public RPC rate-limits bursts, so queries go out a few at a time and a refused one is retried.
const PARALLEL = 3;
const RETRIES = 5;
const FRESH_FOR_MS = 10_000;

export type Settlement = { txHash: string; block: string; paid: string; refunded: string };

type Ledger = { scannedTo: bigint; readAt: number; settlements: Map<string, Settlement>; reading: Promise<void> | null };

// Kept for the life of the process, so only blocks that are new since the last read are queried.
const cache = globalThis as unknown as { rivusLedgers?: Map<string, Ledger> };
const ledgers = (cache.rivusLedgers ??= new Map());

const times = new Map<string, number>();

// Every session a provider has settled, read from the chain: nothing here is recorded by the app itself.
export async function settlementsOf(provider: Address): Promise<Settlement[]> {
  let ledger = ledgers.get(provider);
  if (!ledger) ledgers.set(provider, (ledger = { scannedTo: BigInt(0), readAt: 0, settlements: new Map(), reading: null }));

  if (Date.now() - ledger.readAt > FRESH_FOR_MS) {
    const current = ledger;
    current.reading ??= read(provider, current).finally(() => (current.reading = null));
    await current.reading;
  }
  return [...ledger.settlements.values()].sort((a, b) => Number(BigInt(b.block) - BigInt(a.block)));
}

async function read(provider: Address, ledger: Ledger): Promise<void> {
  const client = createPublicClient({ chain, transport: http() });
  const head = await client.getBlockNumber();
  const oldest = head > CHUNK * BigInt(LOOKBACK_CHUNKS) ? head - CHUNK * BigInt(LOOKBACK_CHUNKS) : BigInt(0);
  const from = ledger.scannedTo > oldest ? ledger.scannedTo + BigInt(1) : oldest;

  const ranges: { fromBlock: bigint; toBlock: bigint }[] = [];
  for (let start = from; start <= head; start += CHUNK) {
    ranges.push({ fromBlock: start, toBlock: start + CHUNK - BigInt(1) < head ? start + CHUNK - BigInt(1) : head });
  }

  const payments = (
    await inBatches(ranges, (range) =>
      client.getLogs({ address: PATH_USD, event: TRANSFER, args: { from: ESCROW, to: provider }, ...range }),
    )
  ).flat();

  await inBatches(
    payments.filter((payment) => !ledger.settlements.has(payment.transactionHash)),
    async (payment) => {
      // The refund is the escrow's other transfer in the same transaction.
      const receipt = await client.getTransactionReceipt({ hash: payment.transactionHash });
      const refunded = receipt.logs
        .filter((log) => log.address.toLowerCase() === PATH_USD && topicAddress(log.topics[1]) === ESCROW)
        .filter((log) => topicAddress(log.topics[2]) !== provider.toLowerCase())
        .reduce((sum, log) => sum + BigInt(log.data), BigInt(0));

      ledger.settlements.set(payment.transactionHash, {
        txHash: payment.transactionHash,
        block: payment.blockNumber.toString(),
        paid: (payment.args.amount ?? BigInt(0)).toString(),
        refunded: refunded.toString(),
      });
    },
  );

  ledger.scannedTo = head;
  ledger.readAt = Date.now();
}

async function inBatches<Item, Result>(items: Item[], task: (item: Item) => Promise<Result>): Promise<Result[]> {
  const results: Result[] = [];
  for (let start = 0; start < items.length; start += PARALLEL) {
    results.push(...(await Promise.all(items.slice(start, start + PARALLEL).map((item) => retrying(() => task(item))))));
  }
  return results;
}

async function retrying<Result>(task: () => Promise<Result>): Promise<Result> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt === RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
}

function topicAddress(topic: string | undefined): string {
  return topic ? `0x${topic.slice(26)}`.toLowerCase() : "";
}

// When a block was produced, in epoch milliseconds.
export async function blockTime(block: string): Promise<number> {
  const known = times.get(block);
  if (known) return known;
  const client = createPublicClient({ chain, transport: http() });
  const time = Number((await retrying(() => client.getBlock({ blockNumber: BigInt(block) }))).timestamp) * 1000;
  times.set(block, time);
  return time;
}
