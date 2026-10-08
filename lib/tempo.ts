import { createClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Actions, Chain } from "viem/tempo";

export const chain = Chain.testnet;

// pathUSD on Moderato; TIP-20 with 6 decimals.
export const PATH_USD = "0x20c0000000000000000000000000000000000000" as const;
export const PATH_USD_DECIMALS = 6;

export const EXPLORER_URL = chain.blockExplorers?.default?.url ?? "https://explore.testnet.tempo.xyz";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Run \`npm run setup\` to create .env.local.`);
  return value;
}

export function accountFromEnv(name: string) {
  return privateKeyToAccount(requireEnv(name) as Hex);
}

export function clientFor(account: ReturnType<typeof privateKeyToAccount>) {
  return createClient({ account, chain, pollingInterval: 1_000, transport: http() });
}

export function parsePathUsd(amount: string): bigint {
  return BigInt(Math.round(Number(amount) * 10 ** PATH_USD_DECIMALS));
}

export async function pathUsdBalance(client: ReturnType<typeof clientFor>, address: `0x${string}`): Promise<bigint> {
  return (await Actions.token.getBalance(client, { account: address, token: PATH_USD })).amount;
}

export function formatPathUsd(raw: bigint): string {
  return (Number(raw) / 10 ** PATH_USD_DECIMALS).toFixed(6);
}
