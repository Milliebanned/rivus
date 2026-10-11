#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { generatePrivateKey } from "viem/accounts";
import { Actions } from "viem/tempo";
import { createBuyer } from "./client.js";
import { RivusError, accountFrom, balanceOf, clientFor, formatAmount } from "./network.js";
import type { TrafficEvent } from "./types.js";

const ENV_PATH = ".env.local";
const KEYS = { provider: "PROVIDER_PRIVATE_KEY", buyer: "AGENT_PRIVATE_KEY", secret: "RIVUS_SECRET" } as const;
const GLYPHS: Record<TrafficEvent["kind"], string> = { note: "·", out: "→", in: "←", voucher: "⇄", done: "✓", fail: "✕" };

const USAGE = `rivus: pay-per-second billing on Tempo

  rivus init                     create testnet keys in ${ENV_PATH} and fund both wallets from the faucet
  rivus pay <url> [options]      buy metered work from a provider and print what was paid
      --max <pathUSD>            the most the session can cost (default 1)
      --max-price <pathUSD>      refuse a provider quoting more than this per second
      --stop-after <seconds>     stop early and take the refund
  rivus balance                  show both wallets' pathUSD balances

Keys are read from ${ENV_PATH} or the environment: ${KEYS.buyer} pays, ${KEYS.provider} gets paid.`;

const [command, ...rest] = process.argv.slice(2);
for (const file of [ENV_PATH, ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

try {
  if (command === "init") await init();
  else if (command === "pay") await pay(rest);
  else if (command === "balance") await balance();
  else console.log(USAGE);
} catch (error) {
  console.error(`\n${error instanceof RivusError ? error.message : error instanceof Error ? error.message : error}`);
  process.exit(1);
}

// Writes any missing keys to .env.local, leaving the ones already there, then tops both wallets up.
async function init() {
  const env = new Map<string, string>();
  if (existsSync(ENV_PATH)) {
    for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) env.set(match[1], match[2]);
    }
  }

  let changed = false;
  const ensure = (key: string, make: () => string) => {
    if (env.get(key)) return;
    env.set(key, make());
    changed = true;
  };
  ensure(KEYS.provider, generatePrivateKey);
  ensure(KEYS.buyer, generatePrivateKey);
  ensure(KEYS.secret, () => randomBytes(32).toString("hex"));

  if (changed) {
    writeFileSync(ENV_PATH, [...env].map(([key, value]) => `${key}=${value}`).join("\n") + "\n", { mode: 0o600 });
    console.log(`Wrote ${ENV_PATH} (testnet-only keys; never commit this file).`);
  }

  for (const role of ["provider", "buyer"] as const) {
    const account = accountFrom(env.get(KEYS[role]), KEYS[role]);
    process.stdout.write(`${role} ${account.address}: funding from faucet... `);
    await Actions.faucet.fundSync(clientFor(account), { account, timeout: 30_000 });
    console.log(`${formatAmount(await balanceOf(account.address))} pathUSD`);
  }
}

async function pay(args: string[]) {
  // Every option takes a value, so the URL is the one argument that neither is an option nor follows one.
  const url = args.find((arg, index) => !arg.startsWith("--") && !args[index - 1]?.startsWith("--"));
  if (!url) throw new Error("Usage: rivus pay <url> [--max 1] [--max-price 0.02] [--stop-after 5]");
  const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const stopAfter = option("--stop-after");

  const buyer = createBuyer({ privateKey: process.env[KEYS.buyer] });
  let startedAt = 0;
  const session = await buyer.open(url, {
    maxSpend: option("--max") ?? "1",
    maxPrice: option("--max-price"),
    onTraffic(event) {
      startedAt ||= event.at;
      console.log(`${((event.at - startedAt) / 1000).toFixed(2).padStart(7)}  ${GLYPHS[event.kind]} ${event.text}`);
    },
  });
  if (stopAfter) setTimeout(() => session.stop(), Number(stopAfter) * 1000);

  let units = 0;
  let seconds = 0;
  try {
    for await (const unit of session) {
      units += 1;
      seconds += unit.seconds;
    }
  } finally {
    // Whatever ended the stream, settle: the deposit must not stay locked.
    const receipt = await session.close();
    console.log(`\n${units} units, ${seconds.toFixed(2)} s of work`);
    console.log(`paid      ${receipt.paid} pathUSD`);
    console.log(`refunded  ${receipt.refunded} pathUSD`);
    if (receipt.txUrl) console.log(`settled   ${receipt.txUrl}`);
  }
}

async function balance() {
  for (const role of ["provider", "buyer"] as const) {
    const key = process.env[KEYS[role]];
    if (!key) continue;
    const { address } = accountFrom(key, KEYS[role]);
    console.log(`${role.padEnd(8)} ${address}  ${formatAmount(await balanceOf(address))} pathUSD`);
  }
}
