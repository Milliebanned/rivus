import Link from "next/link";
import type { ReactNode } from "react";
import { Dashboard } from "../Dashboard";
import { Logo } from "../Logo";
import { Calculator } from "./Calculator";
import { Developers } from "./Developers";
import { AgentPrompt } from "./AgentPrompt";
import { HeroMeter } from "./HeroMeter";
import { LiveLedger } from "./LiveLedger";
import { PageMeter } from "./PageMeter";
import { Reveal } from "./Reveal";
import { ScrollProgress } from "./ScrollProgress";
import { Story } from "./Story";
import { StreamField } from "./StreamField";
import { TempoSection } from "./TempoSection";
import { Tilt } from "./Tilt";

const NAV = [
  { href: "#tempo", label: "Why Tempo" },
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#demo", label: "Live demo" },
  { href: "#developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
];

const DOC_CHAPTERS = [
  "The problem and the solution",
  "How a session works, step by step",
  "Why Tempo, with network details",
  "Quickstart: run the demo",
  "Provider guide",
  "Buyer guide",
  "Using Rivus with AI agents",
  "Reference and troubleshooting",
];

const TICKER = [
  "Built on Tempo",
  "Machine Payments Protocol",
  "TIP-20 payment channels",
  "EIP-712 vouchers",
  "pathUSD settlement",
  "HTTP 402",
  "Moderato testnet",
];

// Film grain over the whole page, so the dark background doesn't read as flat.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FEATURES = [
  {
    title: "Billed for real work",
    body: "Each unit is charged for the CPU time it actually took, measured on the provider, not for a slot or a tier.",
    icon: "M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Stop at any moment",
    body: "The buyer can walk away mid-task. The provider keeps what it earned and the rest of the deposit returns on close.",
    icon: "M9 9h6v6H9zM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Checkable by anyone",
    body: "Every session ends in a transaction on Tempo. The page links to it, so the bill is evidence and not a claim.",
    icon: "m9 12 2 2 4-4M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z",
  },
  {
    title: "Made for agents",
    body: "No sign-up, no card, no invoice. A program holding a key can discover the price over HTTP 402 and pay for itself.",
    icon: "M8 10h.01M16 10h.01M9 15h6M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4l-2 3-2-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  },
  {
    title: "No gas between units",
    body: "Vouchers are signed and exchanged off-chain while the work streams. Only opening and closing the channel touch the chain.",
    icon: "M13 3 4 14h7l-1 7 9-11h-7l1-7Z",
  },
  {
    title: "Nothing custom to audit",
    body: "The channel mechanics are Tempo's own Machine Payments Protocol. Rivus adds the meter on top and no new contract.",
    icon: "M4 7l8-4 8 4-8 4-8-4Zm0 5 8 4 8-4M4 17l8 4 8-4",
  },
];

const COMPARE_ROWS = [
  "Pay only for what was used",
  "No account or contract first",
  "Unused funds returned automatically",
  "Bill can be verified independently",
  "Usable by an autonomous agent",
];
const COMPARE = [
  { name: "Flat fee", cells: ["no", "no", "no", "no", "no"] },
  { name: "Invoice", cells: ["yes", "no", "n/a", "no", "no"] },
  { name: "Prepaid credits", cells: ["partly", "no", "no", "no", "partly"] },
  { name: "Rivus", cells: ["yes", "yes", "yes", "yes", "yes"] },
];

const USES = [
  { title: "Compute and GPU rental", body: "Charge for the seconds a job ran, not the hour it was booked." },
  { title: "Model inference", body: "Bill each response for the time or tokens it consumed." },
  { title: "Paid APIs and data feeds", body: "Meter a stream of results without issuing keys or invoices." },
  { title: "Agent-to-agent services", body: "Let one program buy work from another with a spending ceiling." },
];

export function Landing() {
  return (
    <div className="relative flex-1 overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <Nav />
      <PageMeter />

      {/* Hero */}
      <section className="relative isolate">
        <StreamField className="absolute inset-0 -z-10 h-full w-full [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_80%,transparent)]" />
        <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/[0.07] blur-[120px]" />

        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-400 [animation:fade-up_0.6s_ease-out_both]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Built on Tempo · live on Moderato testnet
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.04] tracking-[-0.035em] text-zinc-50 [animation:fade-up_0.7s_ease-out_0.08s_both] sm:text-6xl lg:text-[64px]">
              Bill by the second.
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-300 bg-[length:200%_100%] bg-clip-text text-transparent [animation:sheen_9s_linear_infinite]">
                Refund the rest.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400 [animation:fade-up_0.7s_ease-out_0.16s_both]">
              Rivus is pay-per-second billing for compute and APIs. Customers are charged for exactly the work delivered,
              the session settles on-chain, and whatever they didn&apos;t use comes back automatically.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3 [animation:fade-up_0.7s_ease-out_0.24s_both]">
              <a
                href="#demo"
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-300"
              >
                Run the live demo
              </a>
              <a
                href="#developers"
                className="rounded-full border border-white/15 px-6 py-3 text-sm text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5"
              >
                See the integration →
              </a>
            </div>
            <div className="mt-8 [animation:fade-up_0.7s_ease-out_0.32s_both]">
              <AgentPrompt />
            </div>
          </div>

          <div className="[animation:fade-up_0.9s_ease-out_0.3s_both]">
            <HeroMeter />
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-t border-white/10 py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max [animation:marquee_38s_linear_infinite]">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {TICKER.map((item, index) => (
                <li key={item} className="flex items-center font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <span className={index === 0 ? "text-emerald-300" : ""}>{item}</span>
                  <span className="mx-8 h-1 w-1 rotate-45 bg-amber-400/70" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <LiveLedger />

      <TempoSection />

      {/* Product */}
      <Section id="product" eyebrow="What it does" title="A meter between a provider and whoever is paying">
        <p>
          A provider wraps an endpoint. A buyer locks a small deposit and starts receiving work. Each unit delivered is
          paid for as it arrives, and when either side is done, the session settles and the remainder is returned. No
          accounts, no invoices, no trust required in either direction.
        </p>
      </Section>

      <div className="mx-auto grid max-w-6xl gap-4 px-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2 lg:row-span-2">
          <Calculator />
        </Reveal>
        {FEATURES.slice(0, 2).map((feature, index) => (
          <Reveal key={feature.title} delay={(index + 1) * 90} className="h-full">
            <FeatureCard feature={feature} />
          </Reveal>
        ))}
      </div>
      <div className="mx-auto mt-4 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.slice(2).map((feature, index) => (
          <Reveal key={feature.title} delay={index * 80} className="h-full">
            <FeatureCard feature={feature} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-16 max-w-6xl px-6">
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500">
                <th className="px-5 py-4 font-normal">Compared with how usage is billed today</th>
                {COMPARE.map((option) => (
                  <th key={option.name} className={`px-4 py-4 text-center font-normal ${option.name === "Rivus" ? "bg-amber-300/[0.06] text-amber-200" : ""}`}>
                    {option.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, rowIndex) => (
                <tr key={row} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3.5 text-zinc-300">{row}</td>
                  {COMPARE.map((option) => (
                    <td key={option.name} className={`px-4 py-3.5 text-center ${option.name === "Rivus" ? "bg-amber-300/[0.06]" : ""}`}>
                      <Verdict value={option.cells[rowIndex]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* How it works */}
      <Section id="how" eyebrow="How it works" title="One session, start to finish">
        <p>Five short chapters. They advance on their own; hover to pause, or pick one.</p>
      </Section>
      <Reveal className="mx-auto max-w-6xl px-6">
        <Story />
      </Reveal>

      {/* Live demo */}
      <Section id="demo" eyebrow="Live demo" title="Watch a real session, and stop it whenever you like">
        <p>
          The provider below rents out CPU time to render a fractal. Press start and a buyer agent opens a channel, pays
          per second of compute as tiles arrive, and settles on Tempo testnet. The fractal is a stand-in for any metered
          job.
        </p>
      </Section>
      <Reveal className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[0_60px_160px_-60px_rgba(251,191,36,0.35)] sm:p-6">
          <Dashboard embedded />
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Recording or presenting?{" "}
          <Link href="/demo" className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-50">
            Open the demo on its own page
          </Link>
          .
        </p>
      </Reveal>

      {/* Developers */}
      <Section id="developers" eyebrow="For developers" title="Meter your own endpoint with one package">
        <p>
          Install one package. The meter times and bills your work, the buyer pays for it under a hard cap, and
          every session settles on Tempo.
        </p>
      </Section>
      <Reveal className="mx-auto max-w-6xl px-6">
        <Developers />
      </Reveal>

      {/* Documentation */}
      <Reveal className="mx-auto mt-28 max-w-6xl scroll-mt-24 px-6">
        <div id="docs" className="grid items-center gap-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] p-8 lg:grid-cols-2 lg:p-14">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300">Documentation</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-zinc-50 sm:text-[40px] sm:leading-[1.1]">
              Everything, written down
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-zinc-400">
              One document covers the whole project: the problem, the solution, how a session works, and every step to
              add it to your own service, your own buyer, or your own AI agent, including prompts you can paste into a
              coding assistant.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/docs" className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-300">
                Read the documentation
              </Link>
              <a href="/rivus-docs.pdf" className="rounded-full border border-white/15 px-6 py-3 text-sm text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5">
                Open as PDF →
              </a>
            </div>
          </div>

          <Tilt max={5} restX={4} restY={-8} className="mx-auto w-full max-w-md">
            <Link href="/docs" className="block rounded-2xl border border-white/10 bg-zinc-950/80 p-7 shadow-[0_40px_100px_-30px_rgba(251,191,36,0.3)] [transform-style:preserve-3d]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Rivus · documentation · v0.1.0</p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-zinc-50 [transform:translateZ(30px)]">
                Pay-per-second billing on Tempo
              </p>
              <ol className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm text-zinc-400 [transform:translateZ(16px)]">
                {DOC_CHAPTERS.map((chapter, index) => (
                  <li key={chapter} className="flex gap-3">
                    <span className="font-mono text-xs leading-5 text-amber-300/80">{String(index + 1).padStart(2, "0")}</span>
                    {chapter}
                  </li>
                ))}
              </ol>
            </Link>
          </Tilt>
        </div>
      </Reveal>

      {/* Use cases */}
      <Section eyebrow="Where it fits" title="Anything sold by the unit of work">
        <p>The demo renders a fractal because it is honest CPU time that is easy to watch. The same meter applies to:</p>
      </Section>
      <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {USES.map((use, index) => (
          <Reveal key={use.title} delay={index * 80} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <h3 className="text-zinc-100">{use.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{use.body}</p>
          </Reveal>
        ))}
      </div>

      {/* Closing */}
      <Reveal className="mx-auto mt-32 max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-300/[0.10] via-transparent to-emerald-300/[0.08] px-8 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">See it settle for yourself</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Start a render, stop it halfway, and follow the link to the transaction on the Tempo explorer.
          </p>
          <a href="#demo" className="mt-8 inline-block rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-300">
            Run the live demo
          </a>
        </div>
      </Reveal>

      <footer className="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-8 text-sm text-zinc-500">
        <span className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          Rivus
        </span>
        <span>Runs on Tempo Moderato testnet with faucet tokens. No real funds are involved.</span>
        <span>rivus-meter is built on Tempo&apos;s mppx and viem</span>
      </footer>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090c]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-zinc-50">
          <Logo className="h-7 w-7" />
          Rivus
        </a>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-zinc-50">
              {item.label}
            </Link>
          ))}
        </nav>
        <a href="#demo" className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white">
          Live demo
        </a>
      </div>
      <ScrollProgress />
    </header>
  );
}

function FeatureCard({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <Tilt max={4} className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgba(251,191,36,0.10),transparent_60%)]" />
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] [transform:translateZ(30px)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-amber-300" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={feature.icon} />
        </svg>
      </span>
      <h3 className="mt-5 text-lg font-medium text-zinc-50 [transform:translateZ(20px)]">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.body}</p>
    </Tilt>
  );
}

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-6xl scroll-mt-16 px-6 pb-12 pt-32">
      <div id={id} className="max-w-2xl scroll-mt-28">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-zinc-50 sm:text-[42px] sm:leading-[1.1]">{title}</h2>
        <div className="mt-5 text-[17px] leading-relaxed text-zinc-400">{children}</div>
      </div>
    </Reveal>
  );
}

function Verdict({ value }: { value: string }) {
  if (value === "yes") return <span className="text-emerald-300">✓</span>;
  if (value === "no") return <span className="text-zinc-600">✕</span>;
  return <span className="text-xs text-zinc-500">{value}</span>;
}
