import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Actions } from "viem/tempo";
import { PATH_USD, clientFor, formatPathUsd } from "../lib/tempo";

const ENV_PATH = ".env.local";

const env = new Map<string, string>();
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env.set(match[1], match[2]);
  }
}

let changed = false;
function ensure(key: string, make: () => string) {
  if (!env.get(key)) {
    env.set(key, make());
    changed = true;
  }
}

ensure("PROVIDER_PRIVATE_KEY", generatePrivateKey);
ensure("AGENT_PRIVATE_KEY", generatePrivateKey);
ensure("MPP_SECRET_KEY", () => randomBytes(32).toString("hex"));

if (changed) {
  const body = [...env].map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  writeFileSync(ENV_PATH, body, { mode: 0o600 });
  console.log(`Wrote ${ENV_PATH} (testnet-only keys; never commit this file).`);
}

for (const role of ["PROVIDER", "AGENT"] as const) {
  const account = privateKeyToAccount(env.get(`${role}_PRIVATE_KEY`) as `0x${string}`);
  const client = clientFor(account);
  process.stdout.write(`${role.toLowerCase()} ${account.address}: funding from faucet... `);
  await Actions.faucet.fundSync(client, { account, timeout: 30_000 });
  const { amount } = await Actions.token.getBalance(client, { account, token: PATH_USD });
  console.log(`${formatPathUsd(amount)} pathUSD`);
}
