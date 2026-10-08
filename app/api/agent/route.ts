import { tempo } from "mppx/client";
import { DEPOSIT } from "@/lib/pricing";
import { EXPLORER_URL, accountFromEnv, clientFor, formatPathUsd, parsePathUsd, pathUsdBalance } from "@/lib/tempo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLOSE_RETRY_DELAY_MS = 2_000;

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
  let session: ReturnType<typeof tempo.session.manager> | undefined;

  try {
    const agent = accountFromEnv("AGENT_PRIVATE_KEY");
    const client = clientFor(agent);

    const balance = await pathUsdBalance(client, agent.address);
    if (balance < parsePathUsd(DEPOSIT)) {
      send("failed", {
        message: `The buyer wallet holds ${formatPathUsd(balance)} pathUSD, less than the ${DEPOSIT} pathUSD deposit. Run "npm run setup" to refill it from the testnet faucet.`,
      });
      return;
    }

    session = tempo.session.manager({ account: agent, client, maxDeposit: DEPOSIT });

    // The stream only becomes abortable once the channel is open: cutting the open short could
    // leave a deposit in escrow with no channel on this side to close it.
    const stream = new AbortController();
    const events = await session.sse(renderUrl, { signal: stream.signal });
    if (stop.aborted) stream.abort();
    else stop.addEventListener("abort", () => stream.abort(), { once: true });

    for await (const event of events) {
      send("tile", { ...JSON.parse(event), cumulative: session.cumulative.toString() });
    }
  } catch (error) {
    if (!stop.aborted) {
      const depositSpent = messageOf(error).includes("exceeds local maxDeposit");
      send("failed", {
        message: depositSpent
          ? `The ${DEPOSIT} pathUSD deposit ran out before the render finished. The render stopped there and the channel settled for the work done.`
          : messageOf(error),
      });
    }
  }

  if (!session?.opened) return;

  try {
    const receipt = await closeWithRetry(session);
    send("settled", {
      channelId: receipt?.channelId,
      settled: receipt?.acceptedCumulative ?? session.cumulative.toString(),
      deposit: parsePathUsd(DEPOSIT).toString(),
      txUrl: receipt?.txHash ? `${EXPLORER_URL}/tx/${receipt.txHash}` : null,
      stopped: stop.aborted,
    });
  } catch (error) {
    send("failed", { message: `Could not close the payment channel: ${messageOf(error)}` });
  }
}

async function closeWithRetry(session: ReturnType<typeof tempo.session.manager>) {
  try {
    return await session.close();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, CLOSE_RETRY_DELAY_MS));
    return session.close();
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
