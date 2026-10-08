import { EXPLORER_URL, accountFromEnv, clientFor, pathUsdBalance } from "@/lib/tempo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// On-chain pathUSD balances of both parties, so the page can show each side of the payment.
export async function GET(): Promise<Response> {
  const agent = accountFromEnv("AGENT_PRIVATE_KEY");
  const provider = accountFromEnv("PROVIDER_PRIVATE_KEY");
  const client = clientFor(agent);

  const [agentBalance, providerBalance] = await Promise.all([
    pathUsdBalance(client, agent.address),
    pathUsdBalance(client, provider.address),
  ]);

  return Response.json({
    explorer: EXPLORER_URL,
    agent: { address: agent.address, balance: agentBalance.toString() },
    provider: { address: provider.address, balance: providerBalance.toString() },
  });
}
