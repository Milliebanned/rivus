"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

// Two commands an agent with a shell can run to pay this page's provider by itself. The address is
// wherever the page is being served from, so the commands are right on any deployment.
export function AgentPrompt() {
  const origin = useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => "http://localhost:3000",
  );
  const [copied, setCopied] = useState(false);
  const commands = ["npx rivus-meter init", `npx rivus-meter pay ${origin}/api/render --max 0.5`];

  async function copy() {
    try {
      await navigator.clipboard.writeText(commands.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard access can be refused; the commands are still selectable.
    }
  }

  return (
    <div className="max-w-xl overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs text-zinc-300">Give this to your agent</span>
        <button onClick={copy} className="rounded-md px-2 py-1 font-mono text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200">
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-[1.7] text-zinc-200">
        {commands.map((command) => (
          <span key={command} className="block">
            <span className="select-none text-amber-300/70">$ </span>
            {command}
          </span>
        ))}
      </pre>
      <p className="border-t border-white/10 px-4 py-2 text-xs text-zinc-500">
        It makes a testnet wallet, asks this page&apos;s provider for its price, pays by the second, and prints the settlement.
      </p>
    </div>
  );
}
