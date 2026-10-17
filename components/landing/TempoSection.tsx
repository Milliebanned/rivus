import { EXPLORER_URL, PATH_USD_DECIMALS, chain } from "rivus-meter";
import { Reveal } from "./Reveal";
import { Stack } from "./Stack";

const GIVES = [
  {
    tempo: "Machine Payments Protocol",
    rivus: "A provider states its price over HTTP 402 and a buyer pays without an account, a card or an invoice.",
  },
  {
    tempo: "TIP-20 payment channels",
    rivus: "The buyer's deposit sits in escrow on Tempo, and the unused part is returned by the chain, not by a promise.",
  },
  {
    tempo: "Fees paid in stablecoin",
    rivus: "Both sides hold only pathUSD. Opening and closing a session cost each of them under 0.0001 pathUSD in our runs.",
  },
  {
    tempo: "EVM-compatible tooling",
    rivus: "Rivus is a TypeScript package built on Tempo's mppx SDK and viem. There was no new contract to write or audit.",
  },
];

const NETWORK = [
  { label: "Network", value: chain.name },
  { label: "Chain ID", value: String(chain.id) },
  { label: "Settlement token", value: `pathUSD · TIP-20 · ${PATH_USD_DECIMALS} decimals` },
  { label: "Built on", value: "mppx · viem/tempo" },
];

// Why this is a Tempo project: what the chain provides, and what Rivus does with each piece.
export function TempoSection() {
  return (
    <section id="tempo" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-300/[0.07] via-white/[0.02] to-amber-300/[0.06]">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[110px]" />

          <div className="grid grid-cols-1 items-center gap-10 p-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:p-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">Built on Tempo</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-zinc-50 sm:text-[44px] sm:leading-[1.08]">
                Tempo made payments native.
                <br />
                <span className="text-zinc-400">Rivus makes them continuous.</span>
              </h2>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-400">
                Tempo is a payments-first chain: stablecoin settlement, low fees, and a protocol for machines to pay
                each other. Rivus exists because of that. Every payment on this page is a Tempo payment channel, opened,
                settled and refunded by Tempo itself.
              </p>
            </div>

            <Stack />
          </div>

          <div className="grid grid-cols-1 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2">
            {GIVES.map((item, index) => (
              <div key={item.tempo} className="bg-[#0a0c10] p-6 lg:p-8">
                <p className="flex items-center gap-3 text-zinc-50">
                  <span className="font-mono text-xs text-emerald-300">0{index + 1}</span>
                  {item.tempo}
                </p>
                <p className="mt-2 pl-8 text-sm leading-relaxed text-zinc-400">{item.rivus}</p>
              </div>
            ))}
          </div>

          <dl className="flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/10 bg-[#0a0c10] px-6 py-5 lg:px-8">
            {NETWORK.map((item) => (
              <div key={item.label}>
                <dt className="text-xs text-zinc-500">{item.label}</dt>
                <dd className="mt-0.5 font-mono text-sm text-zinc-200">{item.value}</dd>
              </div>
            ))}
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-full border border-emerald-300/30 px-4 py-2 text-sm text-emerald-200 transition-colors hover:border-emerald-300/60 hover:bg-emerald-300/10"
            >
              Open the Tempo explorer →
            </a>
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
