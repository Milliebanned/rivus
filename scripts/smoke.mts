import { tempo } from "mppx/client";
import { Actions } from "viem/tempo";
import { EXPLORER_URL, PATH_USD, accountFromEnv, clientFor, formatPathUsd } from "../lib/tempo";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const MAX_DEPOSIT = process.env.MAX_DEPOSIT ?? "1";

const agent = accountFromEnv("AGENT_PRIVATE_KEY");
const provider = accountFromEnv("PROVIDER_PRIVATE_KEY");
const client = clientFor(agent);

const balance = async (address: `0x${string}`) =>
  (await Actions.token.getBalance(client, { account: address, token: PATH_USD })).amount;

const agentBefore = await balance(agent.address);
const providerBefore = await balance(provider.address);

const session = tempo.session.manager({ account: agent, client, maxDeposit: MAX_DEPOSIT });

console.log(`agent ${agent.address} -> ${BASE_URL}/api/render (deposit cap ${MAX_DEPOSIT} pathUSD)`);
const events = await session.sse(`${BASE_URL}/api/render`);

let units = 0;
let computeMs = 0;
try {
  for await (const event of events) {
    const tile = JSON.parse(event);
    units++;
    computeMs += tile.computeMs;
    console.log(
      `  tile ${tile.index + 1}/${tile.total}: ${tile.computeMs.toFixed(0)}ms, ${formatPathUsd(BigInt(tile.cost))} pathUSD  | cumulative voucher ${formatPathUsd(session.cumulative)} pathUSD`,
    );
  }
} catch (error) {
  // Still close below, so the deposit isn't left in escrow.
  console.log(`\nstream ended early: ${error instanceof Error ? error.message : error}`);
}

const receipt = await session.close();
console.log(`\nclosed channel ${receipt?.channelId}`);
console.log(`  units billed: ${receipt?.units}, settled: ${formatPathUsd(BigInt(receipt?.acceptedCumulative ?? 0))} pathUSD`);
console.log(receipt?.txHash ? `  settle tx: ${EXPLORER_URL}/tx/${receipt.txHash}` : "  settle tx: (not returned)");

await new Promise((r) => setTimeout(r, 5_000));
const agentAfter = await balance(agent.address);
const providerAfter = await balance(provider.address);
console.log(`\ntiles streamed: ${units} (${(computeMs / 1000).toFixed(2)}s of compute)`);
console.log(`agent spent:     ${formatPathUsd(agentBefore - agentAfter)} pathUSD (voucher total + channel-open gas)`);
console.log(`provider earned: ${formatPathUsd(providerAfter - providerBefore)} pathUSD (net of settle gas)`);
