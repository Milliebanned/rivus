import { EXPLORER_URL, addressOf, balanceOf } from "rivus-meter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// On-chain pathUSD balances of both parties, so the page can show each side of the payment.
export async function GET(): Promise<Response> {
  const agent = addressOf(process.env.AGENT_PRIVATE_KEY, "AGENT_PRIVATE_KEY");
  const provider = addressOf(process.env.PROVIDER_PRIVATE_KEY, "PROVIDER_PRIVATE_KEY");
  const [agentBalance, providerBalance] = await Promise.all([balanceOf(agent), balanceOf(provider)]);

  return Response.json({
    explorer: EXPLORER_URL,
    agent: { address: agent, balance: agentBalance.toString() },
    provider: { address: provider, balance: providerBalance.toString() },
  });
}
