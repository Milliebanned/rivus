import { RivusError, addressOf, balanceOf, parseAmount } from "rivus-meter";
import { createBuyer, type Session } from "rivus-meter/client";
import { DEPOSIT } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One buyer key, so one render at a time. Kept on globalThis so Stop still finds the run after a dev reload.
const globalForAgent = globalThis as unknown as { rivusRuns?: Map<string, AbortController> };
const runs = (globalForAgent.rivusRuns ??= new Map());

type Send = (event: string, data: unknown) => void;

// The buyer agent: opens a payment channel to the provider's render endpoint, relays each paid tile
// to the browser, and closes the channel when the render ends or is stopped.
export async function GET(request: Request): Promise<Response> {
  const runId = new URL(request.url).searchParams.get("run");
  if (!runId) return Response.json({ error: "Missing run id." }, { status: 400 });

  const stop = new AbortController();
  const busy = runs.size > 0;
  if (!busy) runs.set(runId, stop);
  // If the browser goes away, stop paying.
  request.signal.addEventListener("abort", () => stop.abort());

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send: Send = (event, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // The browser has disconnected; settlement still runs.
        }
      };
      const end = () => {
        try {
          controller.close();
        } catch {
          // Already closed by the browser.
        }
      };

      // Reported in-stream because EventSource can't read the body of an error response.
      if (busy) {
        send("failed", { message: "A render is still running or settling. Try again in a few seconds." });
        return end();
      }

      run(new URL("/api/render", request.url), stop.signal, send).finally(() => {
        runs.delete(runId);
        end();
      });
    },
    cancel() {
      stop.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Stop: abort the run's stream; the GET handler above then closes the channel and reports the settlement.
export async function POST(request: Request): Promise<Response> {
  const runId = new URL(request.url).searchParams.get("run");
  runs.get(runId ?? "")?.abort();
  return new Response(null, { status: 204 });
}

async function run(renderUrl: URL, stop: AbortSignal, send: Send): Promise<void> {
  let session: Session<Record<string, unknown>> | undefined;

  try {
    const buyer = createBuyer({ privateKey: process.env.AGENT_PRIVATE_KEY });

    // Both balances as they stood before the channel opened, so the page can show what the run changed.
    const provider = addressOf(process.env.PROVIDER_PRIVATE_KEY, "PROVIDER_PRIVATE_KEY");
    const [agentBalance, providerBalance] = await Promise.all([balanceOf(buyer.address), balanceOf(provider)]);

    session = await buyer.open(renderUrl, {
      maxSpend: DEPOSIT,
      signal: stop,
      onTraffic: (event) => send("log", event),
    });
    send("started", { agent: agentBalance.toString(), provider: providerBalance.toString() });

    for await (const unit of session) {
      send("tile", { ...unit.value, cumulative: parseAmount(unit.spent).toString() });
    }

    if (session.outcome === "budget") {
      send("failed", {
        message: `The ${DEPOSIT} pathUSD deposit ran out before the render finished. The render stopped there and the channel settled for the work done.`,
      });
    }
  } catch (error) {
    if (!stop.aborted) {
      const underfunded = error instanceof RivusError && error.code === "insufficient_funds";
      send("failed", {
        message: underfunded ? `${messageOf(error)} Run "npm run setup" to refill it from the testnet faucet.` : messageOf(error),
      });
    }
  }

  if (!session?.channelId) return;

  try {
    const receipt = await session.close();
    send("settled", {
      channelId: receipt.channelId,
      settled: parseAmount(receipt.paid).toString(),
      deposit: parseAmount(receipt.deposit).toString(),
      txUrl: receipt.txUrl,
      stopped: stop.aborted,
    });
  } catch (error) {
    send("failed", { message: `Could not close the payment channel: ${messageOf(error)}` });
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
