// pathUSD is a TIP-20 token with 6 decimals.
export function formatUsd(raw: bigint | string): string {
  return (Number(raw) / 1_000_000).toFixed(6);
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
