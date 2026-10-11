import { createClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Actions, Chain } from "viem/tempo";

// Rivus 0.1 runs on Tempo's public testnet, Moderato (chain ID 42431).
export const chain = Chain.testnet;

// pathUSD on Moderato; TIP-20 with 6 decimals.
export const PATH_USD = "0x20c0000000000000000000000000000000000000" as const;
export const PATH_USD_DECIMALS = 6;

export const EXPLORER_URL = chain.blockExplorers?.default?.url ?? "https://explore.testnet.tempo.xyz";

export type Address = `0x${string}`;
export type Account = ReturnType<typeof privateKeyToAccount>;

// `name` is the setting the key was expected in, so the error says what to fix.
export function accountFrom(privateKey: string | undefined, name: string): Account {
  if (!privateKey) throw new RivusError("missing_key", `Missing ${name}. Run \`npx rivus-meter init\` to create testnet keys.`);
  return privateKeyToAccount(privateKey as Hex);
}

export function clientFor(account: Account) {
  return createClient({ account, chain, pollingInterval: 1_000, transport: http() });
}

// "0.01" -> 10000n. Amounts cross the public API as decimal pathUSD strings and are raw units inside.
export function parseAmount(amount: string): bigint {
  return BigInt(Math.round(Number(amount) * 10 ** PATH_USD_DECIMALS));
}

// 10000n -> "0.010000".
export function formatAmount(raw: bigint | string): string {
  return (Number(raw) / 10 ** PATH_USD_DECIMALS).toFixed(PATH_USD_DECIMALS);
}

// On-chain pathUSD balance of any address, in raw units.
export async function balanceOf(address: Address): Promise<bigint> {
  const client = createClient({ chain, transport: http() });
  return (await Actions.token.getBalance(client, { account: address, token: PATH_USD })).amount;
}

export function addressOf(privateKey: string | undefined, name = "the private key"): Address {
  return accountFrom(privateKey, name).address;
}

export function txUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}

export function short(hex: string): string {
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

export type RivusErrorCode = "missing_key" | "insufficient_funds" | "price_too_high" | "not_open";

// Failures Rivus itself decides on, as opposed to network or protocol errors passed through from below.
export class RivusError extends Error {
  constructor(
    public readonly code: RivusErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RivusError";
  }
}
