"use client";

import { useState } from "react";
import { PROVIDER_SNIPPET } from "../DevSnippet";
import { highlight } from "../highlight";

const BUYER_SNIPPET = `import { createBuyer } from "rivus-meter/client";

const buyer = createBuyer({ privateKey: process.env.AGENT_PRIVATE_KEY });

// Asks for the price, opens the channel and locks the deposit.
const session = await buyer.open("https://provider.example/api/render", {
  maxSpend: "1",        // the most this session can ever cost
  maxPrice: "0.02",     // walk away, before paying, from anything dearer
});

for await (const unit of session) {
  use(unit.value);      // one paid piece of work; break to stop paying
}

const receipt = await session.close();    // settles on-chain, refunds the rest
console.log(receipt.paid, receipt.refunded, receipt.txUrl);`;

const STEPS = [
  {
    tab: "Install",
    file: "terminal",
    title: "Install Rivus",
    body: "One package holds both sides and a command-line tool. Init creates testnet keys and funds the wallets, so the next step runs straight away. No contract to deploy, no account to open, no API key.",
    code: `npm install rivus-meter
npx rivus-meter init    # testnet keys in .env.local, both wallets funded from the faucet`,
    shell: true,
  },
  {
    tab: "Provider",
    file: "app/api/render/route.ts",
    title: "Hand the meter your work",
    body: "State a price per second and write the work as a generator. Rivus quotes the price, opens the channel, times each step, collects payment before delivering it, and settles when either side is done. This is the code behind the demo on this page, condensed.",
    code: PROVIDER_SNIPPET,
    shell: false,
  },
  {
    tab: "Buyer",
    file: "agent.ts",
    title: "Pay from an agent, or any client",
    body: "The buyer needs a key, a spending cap and, if it wants one, a price limit. Rivus answers the quote, signs every voucher and takes the refund; your code just reads the work.",
    code: BUYER_SNIPPET,
    shell: false,
  },
  {
    tab: "Pay from a terminal",
    file: "terminal",
    title: "Or pay with one command",
    body: "The same buyer as a command: it prints every exchange with the provider, then what was paid, what came back, and the settlement transaction. Handy for testing your endpoint, and for an agent that can run a shell.",
    code: `npx rivus-meter pay https://provider.example/api/render --max 0.5
npx rivus-meter pay https://provider.example/api/render --max-price 0.005    # refuses a dearer provider
npx rivus-meter pay https://provider.example/api/render --stop-after 5       # stops early, takes the refund`,
    shell: true,
  },
];

// Setup in four steps, each with the code it takes.
export function Developers() {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const active = STEPS[step];

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard access can be refused; the code is still selectable.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10">
      <ol className="flex flex-col gap-2">
        {STEPS.map((item, index) => (
          <li key={item.tab}>
            <button
              onClick={() => setStep(index)}
              aria-current={index === step}
              className={`w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${
                index === step ? "border-amber-300/30 bg-amber-300/[0.05]" : "border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                    index === step ? "bg-amber-400 text-zinc-950" : "border border-white/15 text-zinc-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={index === step ? "text-zinc-50" : "text-zinc-400"}>{item.title}</span>
              </span>
              {index === step && <span className="mt-2.5 block pl-9 text-sm leading-relaxed text-zinc-400">{item.body}</span>}
            </button>
          </li>
        ))}
      </ol>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d12] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="flex items-center gap-3">
            <span className="flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <i className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <i className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </span>
            <span className="font-mono text-xs text-zinc-500">{active.file}</span>
          </span>
          <button onClick={copy} className="rounded-md px-2 py-1 font-mono text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200">
            {copied ? "copied" : "copy"}
          </button>
        </div>
        <pre key={step} className="[animation:fade-up_0.5s_ease-out_both] min-h-[420px] overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-zinc-300">
          <code>{active.shell ? shell(active.code) : highlight(active.code)}</code>
        </pre>
      </div>
    </div>
  );
}

// Shell lines get a prompt, and anything after a # is dimmed.
function shell(code: string) {
  return code.split("\n").map((line, index) => {
    const [command, comment] = line.split(/(?=\s+#)/);
    return (
      <span key={index} className="block">
        <span className="select-none text-amber-300/70">$ </span>
        {command}
        {comment && <span className="text-zinc-500">{comment}</span>}
      </span>
    );
  });
}
