// pathUSD is a TIP-20 token with 6 decimals.
export function formatUsd(raw: bigint | string): string {
  return (Number(raw) / 1_000_000).toFixed(6);
}

// Wallet balances run to six or seven figures on the faucet, so they get thousands separators.
export function formatBalance(raw: bigint | string): string {
  return (Number(raw) / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

export function formatDelta(raw: bigint): string {
  const zero = BigInt(0);
  if (raw === zero) return formatUsd(raw);
  return `${raw > zero ? "+" : "−"}${formatUsd(raw > zero ? raw : -raw)}`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
