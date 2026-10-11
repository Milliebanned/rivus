"use client";

import { useEffect, useRef, useState } from "react";

const CHAPTER_MS = 7_000;

const CHAPTERS = [
  {
    label: "The problem",
    title: "Usage is continuous. Billing isn't.",
    body: "A flat fee charges for time nobody used. An invoice needs trust and a billing relationship before any work starts. Prepaid credits leave money stranded. An autonomous agent can't do the paperwork for any of them.",
  },
  {
    label: "Open",
    title: "The buyer opens a payment channel",
    body: "The provider answers the first request with an HTTP 402 challenge. The buyer responds by locking a deposit in a TIP-20 payment channel on Tempo. Nothing has been paid yet; the deposit only sets the ceiling.",
  },
  {
    label: "Stream",
    title: "Work and payment move together",
    body: "As each unit of work is delivered, the buyer signs an EIP-712 voucher for a slightly higher running total. Vouchers are exchanged off-chain, so there is no gas and no block to wait for between units.",
  },
  {
    label: "Settle",
    title: "One transaction settles the session",
    body: "When the work finishes, or the buyer stops early, the provider closes the channel on-chain for the amount actually spent. Anyone can look the transaction up on the Tempo explorer.",
  },
  {
    label: "Refund",
    title: "The rest goes straight back",
    body: "The close pays the provider and returns the unused deposit to the buyer. On a real testnet run of this demo: 22.73 s of compute, 0.227300 pathUSD paid, 0.772700 pathUSD refunded.",
  },
];

const OLD_WAYS = [
  { name: "Flat fee", flaw: "Pays for idle time" },
  { name: "Invoice", flaw: "Trust first, money later" },
  { name: "Prepaid credits", flaw: "Unused balance is stranded" },
];

// An auto-advancing, clickable walkthrough of one payment session, in the manner of a short deck.
export function Story() {
  const root = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Only run the clock while the walkthrough is on screen.
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const running = playing && !hovered;

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setChapter((current) => (current + 1) % CHAPTERS.length), CHAPTER_MS);
    return () => clearTimeout(timer);
  }, [running, chapter]);

  const active = CHAPTERS[chapter];

  return (
    <div
      ref={root}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
    >
      <div className="grid grid-cols-5 border-b border-white/10">
        {CHAPTERS.map((item, index) => (
          <button
            key={item.label}
            onClick={() => setChapter(index)}
            aria-current={index === chapter}
            className={`relative px-2 py-3.5 text-left text-xs transition-colors sm:px-4 sm:text-sm ${
              index === chapter ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="mr-2 hidden font-mono text-[11px] text-zinc-600 sm:inline">0{index + 1}</span>
            {item.label}
            <span className="absolute inset-x-0 bottom-0 h-px bg-white/5">
              {index === chapter && (
                <span
                  key={`${chapter}-${running}`}
                  className="block h-full origin-left bg-amber-400"
                  style={running ? { animation: `chapter-progress ${CHAPTER_MS}ms linear forwards` } : undefined}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:p-10">
        <div key={chapter} className="[animation:fade-up_0.5s_ease-out_both] flex flex-col justify-center">
          <p className="font-mono text-xs text-amber-300">
            0{chapter + 1} / 0{CHAPTERS.length}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">{active.title}</h3>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">{active.body}</p>
        </div>

        {chapter === 0 ? <OldWays /> : <Diagram chapter={chapter} />}
      </div>
    </div>
  );
}

function OldWays() {
  return (
    <div className="flex aspect-[16/10] flex-col justify-center gap-3">
      {OLD_WAYS.map((way, index) => (
        <div
          key={way.name}
          className="[animation:fade-up_0.5s_ease-out_both] flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <span className="text-zinc-200">{way.name}</span>
          <span className="flex items-center gap-3 text-sm text-zinc-500">
            {way.flaw}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-400/10 text-xs text-red-300">✕</span>
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-5 py-4">
        <span className="text-zinc-50">Per-second, settled on-chain</span>
        <span className="flex items-center gap-3 text-sm text-amber-200">
          Exact, automatic, checkable
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300">✓</span>
        </span>
      </div>
    </div>
  );
}

const BUYER_LINES = ["", "locks 1.000000", "signs vouchers", "stops or finishes", "+0.772700 back"];
const PROVIDER_LINES = ["", "sends a 402 challenge", "does the work", "closes the channel", "+0.227300 paid"];
const ESCROW_LINES = ["", "1.000000 locked", "1.000000 locked", "settling", "0.000000"];

// Buyer and provider above, the chain below; dots show what is moving in the current chapter.
function Diagram({ chapter }: { chapter: number }) {
  return (
    <div className="relative aspect-[16/10] select-none text-xs sm:text-sm">
      <Node side="left" name="Buyer agent" line={BUYER_LINES[chapter]} tone={chapter === 4 ? "text-emerald-300" : "text-zinc-400"} lit={chapter === 1 || chapter === 2} />
      <Node side="right" name="Provider" line={PROVIDER_LINES[chapter]} tone={chapter === 4 ? "text-amber-300" : "text-zinc-400"} lit={chapter === 2 || chapter === 3} />

      {/* Off-chain lanes between the two parties. */}
      <Lane top="14%" label="vouchers" active={chapter === 2} direction="right" color="bg-amber-400" />
      <Lane top="29%" label="results" active={chapter === 2} direction="left" color="bg-sky-400" />

      {/* On-chain legs down to the channel. */}
      <Leg side="left" active={chapter === 1 || chapter === 4} direction={chapter === 4 ? "up" : "down"} color={chapter === 4 ? "bg-emerald-400" : "bg-amber-400"} label={chapter === 4 ? "refund" : chapter === 1 ? "deposit" : ""} />
      <Leg side="right" active={chapter === 3 || chapter === 4} direction={chapter === 4 ? "up" : "down"} color="bg-amber-400" label={chapter === 4 ? "payout" : chapter === 3 ? "close" : ""} />

      <div className="absolute inset-x-[4%] bottom-[5%] flex h-[24%] items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-[4%]">
        <span className="text-zinc-500">
          Tempo <span className="hidden sm:inline">· TIP-20 channel</span>
        </span>
        <span
          className={`rounded-lg border px-3 py-1.5 font-mono tabular-nums transition-colors duration-500 ${
            chapter === 4 ? "border-white/10 text-zinc-500" : "border-amber-300/40 bg-amber-300/[0.07] text-amber-200"
          }`}
        >
          escrow {ESCROW_LINES[chapter]}
        </span>
        <span className="text-zinc-500">{chapter >= 3 ? "1 settlement tx" : "pathUSD"}</span>
      </div>
    </div>
  );
}

function Node({ side, name, line, tone, lit }: { side: "left" | "right"; name: string; line: string; tone: string; lit: boolean }) {
  return (
    <div
      className={`absolute top-[6%] flex h-[34%] w-[27%] flex-col justify-center rounded-xl border bg-zinc-950 px-[3%] transition-colors duration-500 ${
        side === "left" ? "left-[4%]" : "right-[4%]"
      } ${lit ? "border-amber-300/40 shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]" : "border-white/10"}`}
    >
      <span className="text-zinc-100">{name}</span>
      <span className={`mt-1 font-mono text-[11px] transition-colors duration-500 sm:text-xs ${tone}`}>{line}</span>
    </div>
  );
}

function Lane({ top, label, active, direction, color }: { top: string; label: string; active: boolean; direction: "left" | "right"; color: string }) {
  return (
    <div className={`absolute inset-x-[33%] h-px transition-colors duration-500 ${active ? "bg-white/20" : "bg-white/[0.06]"}`} style={{ top }}>
      <span className={`absolute left-1/2 top-1.5 -translate-x-1/2 text-[11px] transition-colors duration-500 ${active ? "text-zinc-400" : "text-zinc-700"}`}>
        {direction === "right" ? `${label} →` : `← ${label}`}
      </span>
      {active &&
        [0, 1, 2, 3].map((dot) => (
          <span
            key={dot}
            className={`absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rounded-full ${color}`}
            style={{ animation: `travel-${direction} 1.6s linear ${dot * 0.4}s infinite both` }}
          />
        ))}
    </div>
  );
}

function Leg({ side, active, direction, color, label }: { side: "left" | "right"; active: boolean; direction: "up" | "down"; color: string; label: string }) {
  return (
    <div
      className={`absolute bottom-[29%] top-[40%] w-px transition-colors duration-500 ${side === "left" ? "left-[17.5%]" : "right-[17.5%]"} ${
        active ? "bg-white/20" : "bg-white/[0.06]"
      }`}
    >
      {label && (
        <span className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] text-zinc-400 ${side === "left" ? "left-3" : "right-3"}`}>
          {label} {direction === "down" ? "↓" : "↑"}
        </span>
      )}
      {active &&
        [0, 1].map((dot) => (
          <span
            key={`${direction}-${dot}`}
            className={`absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rounded-full ${color}`}
            style={{ animation: `travel-${direction} 1.8s linear ${dot * 0.9}s infinite both` }}
          />
        ))}
    </div>
  );
}
