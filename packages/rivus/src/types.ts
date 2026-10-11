// One exchange between a buyer and a provider, reported as it happens. `text` is ready to print.
export type TrafficEvent = {
  kind: "note" | "out" | "in" | "voucher" | "done" | "fail";
  text: string;
  // When the buyer saw it, in epoch milliseconds.
  at: number;
  // A link that proves the line, e.g. the settlement transaction on the explorer.
  href?: string;
};

// One paid piece of work, as the buyer receives it. Amounts are decimal pathUSD strings.
export type Unit<Value = unknown> = {
  value: Value;
  // The working time this unit was billed for.
  seconds: number;
  cost: string;
  // Authorised to the provider so far in this session, this unit included.
  spent: string;
};

// How a session's stream ended: the work finished, the buyer stopped it, or the spending cap was reached.
export type Outcome = "complete" | "stopped" | "budget";

// What a closed session came to. Amounts are decimal pathUSD strings.
export type Receipt = {
  paid: string;
  refunded: string;
  deposit: string;
  channelId: string | null;
  txHash: string | null;
  // The settlement transaction on the Tempo explorer.
  txUrl: string | null;
  outcome: Outcome | null;
};

// What the provider sends for each unit, as one server-sent event.
export type WireUnit = { value: unknown; ms: number; cost: string };
