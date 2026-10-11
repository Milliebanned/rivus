import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/docs/PrintButton";
import { Chapter, Code, H3, K, List, Note, P, Steps, Table } from "@/components/docs/parts";
import * as sample from "@/components/docs/samples";
import { DEPOSIT, PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";
import { EXPLORER_URL, PATH_USD, chain } from "rivus-meter";

export const metadata: Metadata = {
  title: "Documentation · Rivus",
  description: "What Rivus is, how it works, and how to add pay-per-second billing to your own service or agent.",
};

const CHAPTERS = [
  { id: "overview", title: "Overview" },
  { id: "problem", title: "The problem" },
  { id: "solution", title: "The solution" },
  { id: "how-it-works", title: "How a session works" },
  { id: "tempo", title: "Why Tempo" },
  { id: "quickstart", title: "Quickstart: run the demo" },
  { id: "provider", title: "Provider guide" },
  { id: "buyer", title: "Buyer guide" },
  { id: "agents", title: "Using Rivus with AI agents" },
  { id: "pricing", title: "Designing your pricing" },
  { id: "edge-cases", title: "What happens when things go wrong" },
  { id: "reference", title: "Reference" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "limits", title: "Security and current limits" },
  { id: "faq", title: "Questions and answers" },
  { id: "glossary", title: "Glossary" },
];

const number = (id: string) => String(CHAPTERS.findIndex((chapter) => chapter.id === id) + 1).padStart(2, "0");

export default function Docs() {
  return (
    <div className="flex-1">
      <header className="doc-screen sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-zinc-50">
            <Logo className="h-7 w-7" />
            Rivus
            <span className="ml-1 rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs font-normal text-zinc-400">docs</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/demo" className="hidden rounded-full px-4 py-2 text-zinc-400 transition-colors hover:text-zinc-50 sm:block">
              Live demo
            </Link>
            <PrintButton className="hidden rounded-full border border-white/15 px-4 py-2 text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5 sm:block" />
            <a href="/rivus-docs.pdf" className="rounded-full bg-amber-400 px-4 py-2 font-medium text-zinc-950 transition-colors hover:bg-amber-300">
              Open as PDF
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="doc-screen hidden lg:block">
          <ol className="sticky top-28 space-y-1 text-sm">
            <li className="pb-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">Contents</li>
            {CHAPTERS.map((chapter, index) => (
              <li key={chapter.id}>
                <a href={`#${chapter.id}`} className="flex gap-3 rounded-md px-2 py-1.5 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-50">
                  <span className="font-mono text-xs leading-5 text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
                  {chapter.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="doc mx-auto w-full max-w-3xl space-y-12 rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 sm:px-12 sm:py-14">
          {/* Cover */}
          <div className="border-b border-white/10 pb-10">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300">Documentation</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
              Rivus: pay-per-second billing on Tempo
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-400">
              What it is, the problem it solves, how a payment session works, and every step needed to add it to your
              own service, your own buyer, or your own AI agent.
            </p>
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 font-mono text-xs text-zinc-500">
              <div>
                <dt className="inline">Version </dt>
                <dd className="inline text-zinc-300">0.1.0</dd>
              </div>
              <div>
                <dt className="inline">Network </dt>
                <dd className="inline text-zinc-300">{chain.name}</dd>
              </div>
              <div>
                <dt className="inline">Updated </dt>
                <dd className="inline text-zinc-300">October 2026</dd>
              </div>
            </dl>
          </div>

          <Chapter id="overview" number={number("overview")} title="Overview">
            <P>
              Rivus is billing infrastructure that lets a provider of compute or API access charge a customer by the
              second, or by any other small unit of work, and settle the result on the Tempo blockchain. The customer
              locks a deposit, pays for each unit as it is delivered, and automatically receives back whatever was not
              used. Neither side needs an account with the other, an invoice, or trust.
            </P>
            <P>
              It is built directly on Tempo&apos;s Machine Payments Protocol (MPP). Tempo provides the payment channel;
              Rivus provides the meter: an installable package, <K>rivus-meter</K>, with a provider side that times
              and bills your work, a buyer side that pays for it under a hard ceiling, and a command-line tool that
              does both from a terminal. The demo in this repository is built on that package.
            </P>
            <H3>Who this document is for</H3>
            <List
              items={[
                <><strong className="text-zinc-100">Providers</strong> who sell compute, inference, data or any API and want to charge for exactly what is consumed. Start at the provider guide.</>,
                <><strong className="text-zinc-100">Buyers</strong> who want to pay for metered work from code, with a hard spending ceiling. Start at the buyer guide.</>,
                <><strong className="text-zinc-100">Teams building AI agents</strong>, or building with a coding agent, who want the agent to pay for services or to add this billing for them. Start at the agents chapter.</>,
                <><strong className="text-zinc-100">Anyone evaluating the project</strong>. The first five chapters explain the idea without any code.</>,
              ]}
            />
            <Note title="Status">
              Everything described here runs today on Tempo&apos;s Moderato testnet with faucet-issued test tokens. No
              real funds are involved. Figures quoted as measured come from runs of this project on that network.
            </Note>
          </Chapter>

          <Chapter id="problem" number={number("problem")} title="The problem">
            <P>
              Usage of a compute or API service is continuous: a job runs for 23 seconds, a model produces 800 tokens, a
              feed delivers 40 results. The ways we charge for that usage are not continuous, and each one puts the
              mismatch on somebody.
            </P>
            <Table
              head={["How it is billed today", "What goes wrong"]}
              rows={[
                ["Flat fee or subscription", "The customer pays for capacity whether or not it is used. A job that stops early costs the same as one that runs to the end."],
                ["Invoice after use", "The provider does the work first and hopes to be paid. That needs a contract, a billing relationship and a collections process before the first request."],
                ["Prepaid credits", "The customer hands over money in advance. Whatever is not used stays with the provider, and getting it back is a support request."],
                ["Card on file", "Per-transaction fees make very small charges uneconomic, and a program cannot hold a card."],
              ]}
            />
            <P>
              The mismatch becomes a wall when the customer is software. An autonomous agent can decide in a moment that
              it needs ten seconds of GPU time or one call to a paid API. It cannot sign a contract, pass a credit
              check, or dispute an invoice. If agents are going to buy services from each other, payment has to be
              something a program can do on its own, in the same request as the work, for exactly the amount of work
              done.
            </P>
          </Chapter>

          <Chapter id="solution" number={number("solution")} title="The solution">
            <P>
              Rivus meters the work as it happens and moves the payment with it. The buyer never pays for more than it
              received, and the provider never delivers more than it has been paid for.
            </P>
            <List
              items={[
                <><strong className="text-zinc-100">Exact.</strong> Each unit is charged as it is delivered. In the demo a unit of work is billed for the CPU time it actually took, at {PRICE_PER_COMPUTE_SECOND} pathUSD per second.</>,
                <><strong className="text-zinc-100">Bounded.</strong> The buyer chooses a deposit. That deposit is the most the session can ever cost.</>,
                <><strong className="text-zinc-100">Refundable by construction.</strong> When the session closes, the chain pays the provider what was spent and returns the rest to the buyer. Nobody has to ask.</>,
                <><strong className="text-zinc-100">Stoppable.</strong> The buyer can stop at any moment and pays only for work already done.</>,
                <><strong className="text-zinc-100">Verifiable.</strong> Every session ends in one transaction on Tempo that anyone can look up.</>,
                <><strong className="text-zinc-100">Automatic.</strong> The whole exchange happens over HTTP between two programs holding keys. There is no sign-up and no checkout.</>,
              ]}
            />
            <H3>What Rivus is not</H3>
            <P>
              Rivus does not implement its own payment channel or smart contract. Tempo&apos;s protocol already provides
              that mechanism, and reimplementing it would add risk without adding anything. Rivus is the layer that
              turns the mechanism into a billing product: what to charge for, when to charge, how to handle a buyer who
              stops, and how to show both sides what happened.
            </P>
          </Chapter>

          <Chapter id="how-it-works" number={number("how-it-works")} title="How a session works">
            <P>
              One purchase is one session. A session has four stages. Only the first and the last touch the blockchain;
              everything in between is ordinary HTTP.
            </P>
            <Steps
              items={[
                {
                  title: "Challenge and open",
                  body: (
                    <P>
                      The buyer requests the provider&apos;s endpoint. The provider replies with HTTP status 402
                      (Payment Required) and a challenge that states the price per unit and a suggested deposit. The
                      buyer answers by opening a TIP-20 payment channel on Tempo and locking its deposit in escrow.
                      Nothing has been paid yet. The deposit only sets the ceiling.
                    </P>
                  ),
                },
                {
                  title: "Stream",
                  body: (
                    <P>
                      The provider starts the work and streams results back as server-sent events. Before each unit is
                      delivered, the provider charges for it. When the amount charged approaches what the buyer has
                      authorised, the buyer signs a new voucher: a small signed message (EIP-712) that says &quot;the
                      provider may claim up to this running total from my deposit&quot;. Vouchers are exchanged
                      off-chain, so there is no gas and no waiting for a block between units.
                    </P>
                  ),
                },
                {
                  title: "Close",
                  body: (
                    <P>
                      When the work is finished, or the buyer stops early, the buyer asks to close. The provider
                      submits one transaction to Tempo that settles the channel for the amount actually spent.
                    </P>
                  ),
                },
                {
                  title: "Refund",
                  body: (
                    <P>
                      That same close pays the provider and returns the unused part of the deposit to the buyer. The
                      buyer receives a receipt with the amount spent and the transaction hash.
                    </P>
                  ),
                },
              ]}
            />
            <H3>A real session, in numbers</H3>
            <Table
              head={["", "Amount (pathUSD)"]}
              rows={[
                ["Deposit locked by the buyer", "1.000000"],
                ["Compute delivered", "22.73 seconds, 216 tiles"],
                ["Paid to the provider", "0.227300"],
                ["Refunded to the buyer", "0.772700"],
                ["Network fee paid by the buyer", "0.000042"],
                ["Network fee paid by the provider", "0.000049"],
              ]}
            />
            <Note title="Spent, not authorised">
              A buyer can sign a voucher slightly ahead of the work, so the highest voucher can be a little above what
              was actually charged when a session is stopped mid-unit. The channel settles for the amount spent, and
              that is the figure Rivus reports. In testing, the reported amount matched the change in both
              wallets&apos; on-chain balances exactly, after fees.
            </Note>
          </Chapter>

          <Chapter id="tempo" number={number("tempo")} title="Why Tempo">
            <P>
              Tempo is a payments-first blockchain built for stablecoin settlement at high throughput and low cost.
              Rivus is built on it because Tempo already has, as part of the platform, the pieces that per-second
              billing needs.
            </P>
            <Table
              head={["Tempo provides", "Rivus uses it for"]}
              rows={[
                ["Machine Payments Protocol (MPP) and the mppx SDK", "The whole exchange: the 402 challenge, the session, the vouchers and the receipt."],
                ["TIP-20 payment channels", "Holding the buyer's deposit in escrow and returning the unused part on close."],
                ["EIP-712 signed vouchers", "Paying for each unit off-chain, with no gas and no delay between units."],
                ["Fees paid in stablecoin", "Both parties hold only pathUSD. There is no separate gas token to acquire, which matters for an agent with one wallet."],
                ["EVM compatibility", "Standard TypeScript tooling (viem) on both sides."],
              ]}
            />
            <H3>Network details</H3>
            <Table
              head={["Setting", "Value"]}
              rows={[
                ["Network", chain.name],
                ["Chain ID", <K key="id">{chain.id}</K>],
                ["RPC", <K key="rpc">{chain.rpcUrls.default.http[0]}</K>],
                ["Explorer", <K key="explorer">{EXPLORER_URL}</K>],
                ["Payment token", <>pathUSD, TIP-20, 6 decimals, at <K>{PATH_USD}</K></>],
                ["Packages", <><K>rivus-meter</K>, built on Tempo&apos;s <K>mppx</K> (the payment protocol) and <K>viem</K> (chain access)</>],
              ]}
            />
          </Chapter>

          <Chapter id="quickstart" number={number("quickstart")} title="Quickstart: run the demo">
            <P>
              The repository contains a complete, working example: a provider that rents out CPU time to render a
              fractal image, and a buyer agent that pays for it. Running it takes four commands and no accounts.
            </P>
            <H3>Before you start</H3>
            <List items={["Node.js 20.9 or later, and npm.", "An internet connection, to reach Tempo's testnet RPC and faucet.", "Nothing else. No wallet extension, no tokens, no API keys."]} />
            <H3>Steps</H3>
            <Code file="terminal" plain>
              {sample.QUICKSTART_SAMPLE}
            </Code>
            <Steps
              items={[
                {
                  title: "npm run setup",
                  body: (
                    <P>
                      Generates two fresh testnet keys (provider and buyer agent) and a server secret, writes them to{" "}
                      <K>.env.local</K> with owner-only permissions, and funds both wallets from Tempo&apos;s faucet.
                      It is safe to run again: existing keys are kept and the wallets are topped up.
                    </P>
                  ),
                },
                {
                  title: "npm run dev",
                  body: (
                    <P>
                      Starts the app. Open <K>http://localhost:3000</K> for the overview with the demo embedded, or{" "}
                      <K>http://localhost:3000/demo</K> for the demo on its own. Press <em>Start render</em>.
                    </P>
                  ),
                },
                {
                  title: "Watch a session",
                  body: (
                    <P>
                      The image fills in tile by tile while the meter counts compute time and cost. Beside it, the
                      balances card shows the buyer&apos;s deposit in escrow and the vouchers the provider has received,
                      and the agent traffic pane lists every request the buyer makes as it happens. Let it finish,
                      or press <em>Stop and refund the rest</em>. Either way a receipt appears with the amount paid,
                      the amount refunded, and a link to the settlement transaction on the Tempo explorer.
                    </P>
                  ),
                },
                {
                  title: "npm run smoke",
                  body: (
                    <P>
                      Runs the same purchase from the command line with no browser, using the package&apos;s own tool:{" "}
                      <K>rivus pay</K> opens a channel, pays for a full render, closes, and prints the settlement
                      transaction. Add <K>-- --stop-after 5</K> to stop early, or <K>-- --max-price 0.005</K> to watch
                      it refuse the price.
                    </P>
                  ),
                },
              ]}
            />
            <Code file=".env.local (created for you; never commit it)" plain>
              {sample.ENV_SAMPLE}
            </Code>
          </Chapter>

          <Chapter id="provider" number={number("provider")} title="Provider guide">
            <P>
              This chapter adds per-second billing to an endpoint you already have. You write the work; the meter
              quotes the price, opens the payment channel, times each piece of work, bills it, and settles when either
              side is done.
            </P>
            <Steps
              items={[
                {
                  title: "Install Rivus and create keys",
                  body: (
                    <>
                      <Code file="terminal" plain>
                        {sample.INSTALL_SAMPLE}
                      </Code>
                      <P>
                        The provider needs an account on Tempo: it receives the payments and it signs the transaction
                        that closes each channel, so it needs a little pathUSD for fees. <K>rivus init</K> creates one,
                        along with a buyer key for testing and a server secret, and funds both wallets on testnet. It
                        is safe to run again: existing keys are kept.
                      </P>
                    </>
                  ),
                },
                {
                  title: "Wrap the endpoint",
                  body: (
                    <>
                      <P>
                        Create a meter with your price, then hand it the work as an async generator. This is the whole
                        integration. One URL handles every stage of the session: the price quote, the paid stream, the
                        buyer&apos;s vouchers and the close.
                      </P>
                      <Code file="app/api/render/route.ts">{sample.METER_SAMPLE}</Code>
                    </>
                  ),
                },
                {
                  title: "Know what gets billed",
                  body: (
                    <P>
                      Each value you <K>yield</K> is delivered to the buyer and billed for the time it took to produce,
                      at your price per second. The meter collects payment before it delivers: if the buyer&apos;s
                      authorised total is not enough, the stream pauses until a new voucher arrives, so you never hand
                      over unpaid work. Pass <K>job.signal</K> into your work so it stops when the buyer leaves.
                    </P>
                  ),
                },
                {
                  title: "Next.js only: two settings",
                  body: (
                    <>
                      <P>
                        Load the package at runtime instead of bundling it, and run the route on the Node.js runtime,
                        not the Edge runtime, because the stream is long-lived.
                      </P>
                      <Code file="next.config.ts">{sample.NEXT_CONFIG_SAMPLE}</Code>
                    </>
                  ),
                },
                {
                  title: "Other servers",
                  body: (
                    <>
                      <P>
                        The meter is not tied to Next.js. It takes a standard <K>Request</K> and returns a standard{" "}
                        <K>Response</K>.
                      </P>
                      <Code file="server.ts">{sample.HANDLER_SAMPLE}</Code>
                    </>
                  ),
                },
                {
                  title: "Test it with a real buyer",
                  body: (
                    <>
                      <P>
                        Pay your own endpoint from a terminal. The tool prints every exchange, then what was paid, what
                        was refunded, and a link to the settlement transaction.
                      </P>
                      <Code file="terminal" plain>
                        {sample.CLI_SAMPLE}
                      </Code>
                    </>
                  ),
                },
              ]}
            />
          </Chapter>

          <Chapter id="buyer" number={number("buyer")} title="Buyer guide">
            <P>
              A buyer is any program with a funded key. Rivus handles the price quote, the channel and every voucher.
              Your code reads the work as it arrives and closes the session.
            </P>
            <Steps
              items={[
                {
                  title: "Install and fund",
                  body: (
                    <P>
                      Install <K>rivus-meter</K>. The buyer&apos;s wallet needs at least its spending cap in pathUSD,
                      plus a fraction of a cent for the fee on opening. On testnet, <K>npx rivus-meter init</K> creates and
                      funds one.
                    </P>
                  ),
                },
                {
                  title: "Open a session, read the work, close",
                  body: <Code file="buyer.ts">{sample.BUYER_SAMPLE}</Code>,
                },
                {
                  title: "Set a price limit",
                  body: (
                    <P>
                      The provider states its price before any money moves. With <K>maxPrice</K> set, a provider
                      quoting more is refused at that point: <K>open</K> throws a <K>RivusError</K> with the code{" "}
                      <K>price_too_high</K>, no channel is opened and nothing is paid.
                    </P>
                  ),
                },
                {
                  title: "Stop early when you have enough",
                  body: (
                    <>
                      <P>
                        Leave the loop, call <K>session.stop()</K>, or abort a signal. The payments end after the unit
                        in flight; closing the session then settles for the work already done and refunds the rest.
                      </P>
                      <Code file="buyer.ts">{sample.STOP_SAMPLE}</Code>
                    </>
                  ),
                },
                {
                  title: "Watch the traffic",
                  body: (
                    <>
                      <P>
                        <K>onTraffic</K> reports every exchange with the provider as it happens, read off the real
                        requests and responses. The agent traffic pane in the demo is this callback, printed.
                      </P>
                      <Code file="buyer.ts">{sample.TRAFFIC_SAMPLE}</Code>
                    </>
                  ),
                },
                {
                  title: "Read the receipt",
                  body: (
                    <Table
                      head={["Field", "Meaning"]}
                      rows={[
                        [<K key="p">paid</K>, "What the session cost, as a decimal pathUSD string. This is the amount the close moved on-chain."],
                        [<K key="r">refunded</K>, "What came back to the buyer: the deposit less the amount paid."],
                        [<K key="d">deposit</K>, "What was locked when the session opened."],
                        [<K key="t">txUrl</K>, <>The settlement transaction on the Tempo explorer. <K>txHash</K> is the hash alone.</>],
                        [<K key="c">channelId</K>, "The identifier of the payment channel that was used."],
                        [<K key="o">outcome</K>, <>How the stream ended: <K>complete</K>, <K>stopped</K> by the buyer, or <K>budget</K> when the cap was reached.</>],
                      ]}
                    />
                  ),
                },
              ]}
            />
            <Note title="Two rules for buyers">
              Set <K>maxSpend</K> to the most you are willing to spend on the session: the stream stops when it is
              reached. And always close a session that opened, including after an error, or the deposit stays locked in
              the channel.
            </Note>
          </Chapter>

          <Chapter id="agents" number={number("agents")} title="Using Rivus with AI agents">
            <P>
              There are two different things people mean by this, and both are supported: an agent that{" "}
              <em>pays</em> for services while it works, and a coding agent that <em>builds</em> the integration into
              your product for you.
            </P>

            <H3>Your agent as the buyer</H3>
            <P>
              An autonomous agent is the customer this kind of billing was designed for. It has no card and signs no
              contract, but it can hold a key. Give it a wallet with a small balance and a tool that buys metered work
              with a ceiling.
            </P>
            <Steps
              items={[
                {
                  title: "Give the agent its own wallet",
                  body: (
                    <P>
                      Create a key used only by the agent and fund it with only what you are prepared for it to spend.
                      The balance of that wallet is the agent&apos;s total budget, enforced by the chain.
                    </P>
                  ),
                },
                {
                  title: "Expose one tool",
                  body: (
                    <>
                      <P>
                        Wrap the buyer in a function your agent framework can call. The agent supplies the URL and a
                        budget for this purchase, and gets back what it spent.
                      </P>
                      <Code file="tools/buy-metered-work.ts">{sample.TOOL_SAMPLE}</Code>
                    </>
                  ),
                },
                {
                  title: "Describe the tool to the model",
                  body: (
                    <P>
                      In the tool description, say what it buys, that it is billed by the unit, that <K>budget</K> is a
                      hard ceiling in pathUSD, and that the agent should stop the purchase as soon as it has what it
                      needs. Agents that understand they are paying by the second stop sooner.
                    </P>
                  ),
                },
                {
                  title: "Keep the key away from the model",
                  body: (
                    <P>
                      The private key lives in the tool&apos;s server-side environment. The model only ever sees the
                      tool&apos;s inputs and its result. Never place a key in a prompt.
                    </P>
                  ),
                },
              ]}
            />

            <H3>Building with a coding agent</H3>
            <P>
              If you build with an AI coding assistant, you can hand it the integration. The two prompts below contain
              everything it needs and tell it how to prove the result works. Fill in the parts in angle brackets and
              paste the prompt into your assistant from the root of your project.
            </P>
            <Code file="Prompt: add per-second billing to my endpoint (provider)" plain>
              {sample.PROVIDER_PROMPT}
            </Code>
            <Code file="Prompt: let my project pay for metered work (buyer)" plain>
              {sample.BUYER_PROMPT}
            </Code>
            <H3>Checking what the assistant built</H3>
            <List
              items={[
                "Ask it to run a session and show you the transaction on the Tempo explorer. A link you can open is better evidence than a passing test.",
                "Compare the receipt's spent amount with the change in the buyer's balance. They should differ only by a network fee of well under 0.0001 pathUSD.",
                "Stop a session halfway and confirm the refund arrives. This is the path most likely to be skipped.",
                <>Search the changes for the private key and for <K>NEXT_PUBLIC</K>. Neither should appear.</>,
                "Confirm it did not add a smart contract. If it did, it has misunderstood the task.",
              ]}
            />
          </Chapter>

          <Chapter id="pricing" number={number("pricing")} title="Designing your pricing">
            <P>
              A meter has one price: pathUSD per second of work. It is stated to the buyer in the price quote before
              anything is paid. What counts as a second of work can be decided in two ways.
            </P>
            <H3>Let Rivus time it</H3>
            <P>
              By default the meter clocks how long each step of your generator takes, from the moment it asks for the
              next value until that value is ready, and bills that. Time spent waiting for the buyer&apos;s payment is
              not counted. This suits work whose cost is the time it occupies: a rented machine, a model call, a
              long-running query.
            </P>
            <H3>Report your own measurement</H3>
            <P>
              When the work measures itself more precisely, pass that figure with <K>job.unit(value, {"{ seconds }"})</K>{" "}
              and it is billed instead. The demo does this: the renderer times the CPU work of each tile, so a tile
              that took 0.31 seconds is charged exactly 0.0031 pathUSD and time parked between tiles is never billed.
            </P>
            <Code file="app/api/render/route.ts">{sample.MEASURED_SAMPLE}</Code>
            <Note title="The minimum charge">
              The first second is paid as the stream opens, which makes {PRICE_PER_COMPUTE_SECOND} pathUSD the least a
              session of the demo can cost. The meter treats that second as credit and draws it down before charging
              anything more, so the buyer is not charged twice for it.
            </Note>
            <H3>Choosing a price</H3>
            <P>
              The price is yours to set, down to 0.000001 pathUSD per second. A buyer sees it before paying and can
              refuse it automatically with a price limit, so an endpoint that charges more than its work is worth
              simply loses the sale, at no cost to the buyer for having asked.
            </P>
            <H3>Choosing a deposit</H3>
            <P>
              Suggest a deposit that comfortably covers a typical session. The demo suggests {DEPOSIT} pathUSD for a job
              that costs about 0.23. A deposit that is too small ends the stream early; one that is larger than needed
              costs the buyer nothing, because the difference comes back on close.
            </P>
          </Chapter>

          <Chapter id="edge-cases" number={number("edge-cases")} title="What happens when things go wrong">
            <Table
              head={["Situation", "What happens"]}
              rows={[
                ["The buyer stops mid-session", "The stream ends, the channel closes for the work done, and the rest is refunded. A unit already in progress when the stop arrives may still be charged."],
                ["The price is above the buyer's limit", "The buyer refuses at the price quote. No channel is opened and nothing is paid."],
                ["The buyer's connection drops", "In the demo, the buyer agent notices the browser has gone, stops the stream and settles for the work done."],
                ["The deposit runs out", "The stream stops at the ceiling and the channel settles for the full deposit. The buyer is never charged more than it locked."],
                ["The buyer's wallet is underfunded", "The buyer checks its balance before opening and reports the shortfall. No channel is opened."],
                ["Closing fails once", "The buyer retries the close after two seconds before reporting a failure."],
                ["The provider fails after the channel opened", "The buyer closes the channel and takes the deposit back before reporting the error."],
                ["Two sessions from one buyer key", "The demo runs one at a time and tells the second caller to try again shortly."],
              ]}
            />
          </Chapter>

          <Chapter id="reference" number={number("reference")} title="Reference">
            <H3>Environment variables</H3>
            <Table
              head={["Name", "Used by", "Purpose"]}
              rows={[
                [<K key="p">PROVIDER_PRIVATE_KEY</K>, "Provider", "Receives payments and signs the close transaction."],
                [<K key="a">AGENT_PRIVATE_KEY</K>, "Buyer", "Locks the deposit and signs vouchers."],
                [<K key="m">RIVUS_SECRET</K>, "Provider", "A random secret that signs the price quotes the meter issues."],
              ]}
            />
            <H3>The command-line tool</H3>
            <Table
              head={["Command", "What it does"]}
              rows={[
                [<K key="i">rivus init</K>, "Creates any missing keys in .env.local and funds both wallets from the testnet faucet."],
                [<K key="p">rivus pay &lt;url&gt;</K>, <>Buys metered work and prints the traffic and the receipt. Options: <K>--max</K> (spending cap, default 1), <K>--max-price</K> (price limit per second), <K>--stop-after</K> (seconds).</>],
                [<K key="b">rivus balance</K>, "Shows both wallets' pathUSD balances."],
              ]}
            />
            <H3>Routes in the demo</H3>
            <Table
              head={["Route", "What it does"]}
              rows={[
                [<K key="r">GET, POST /api/render</K>, "The provider's metered endpoint. Answers 402 until paid, then streams tiles."],
                [<K key="a">GET /api/agent?run=ID</K>, "The buyer agent. Pays the render endpoint and relays progress to the browser as server-sent events."],
                [<K key="s">POST /api/agent?run=ID</K>, "Stops that run. The agent then closes the channel."],
                [<K key="b">GET /api/balances</K>, "The on-chain pathUSD balance of both parties."],
              ]}
            />
            <H3>Events sent to the browser</H3>
            <Table
              head={["Event", "Contents"]}
              rows={[
                [<K key="s">started</K>, "Both balances as they stood before the channel opened."],
                [<K key="t">tile</K>, "One rendered tile, its compute time, and the running total authorised."],
                [<K key="l">log</K>, "One line of the buyer's traffic with the provider, as reported by onTraffic."],
                [<K key="e">settled</K>, "Amount spent, deposit, the settlement transaction link, and whether the run was stopped."],
                [<K key="f">failed</K>, "A message. A settlement can still follow if a channel was open."],
              ]}
            />
            <H3>Where things live</H3>
            <Table
              head={["File", "Role"]}
              rows={[
                [<K key="0">packages/rivus/src/server.ts</K>, "The meter: quoting, timing, billing and settling a provider's work."],
                [<K key="8">packages/rivus/src/client.ts</K>, "The buyer: price limit, spending cap, traffic reporting, close and refund."],
                [<K key="9">packages/rivus/src/cli.ts</K>, "The rivus command-line tool."],
                [<K key="1">app/api/render/route.ts</K>, "The demo's metered endpoint, built on the meter."],
                [<K key="2">app/api/agent/route.ts</K>, "The demo's buyer agent, built on the buyer."],
                [<K key="5">lib/pricing.ts</K>, "The demo's price per compute-second and deposit."],
                [<K key="6">lib/fractal.ts</K>, "The compute engine being sold."],
              ]}
            />
          </Chapter>

          <Chapter id="troubleshooting" number={number("troubleshooting")} title="Troubleshooting">
            <Table
              head={["Symptom", "Cause and fix"]}
              rows={[
                ["The metered route returns 500 in Next.js", <>The bundler tried to bundle the package. Add <K>rivus-meter</K> to <K>serverExternalPackages</K>.</>],
                ["The stream is cut off after a few seconds", <>The route is on the Edge runtime. Set <K>runtime = &quot;nodejs&quot;</K>.</>],
                ["A \"Missing ...\" error about a key or the secret", <>There is no <K>.env.local</K>, or it predates the package. Run <K>npm run setup</K>.</>],
                ["The buyer reports too little pathUSD", <>Run <K>npm run setup</K> again to top the wallets up from the faucet.</>],
                ["\"A render is still running or settling\"", "The previous session has not finished closing. Wait a few seconds."],
                ["Balances look unchanged right after a session", "The RPC can lag the settlement by a block or two. Read the balance again."],
              ]}
            />
          </Chapter>

          <Chapter id="limits" number={number("limits")} title="Security and current limits">
            <List
              items={[
                "Testnet only. This build targets Tempo Moderato and uses faucet tokens. It has not been run on mainnet.",
                "Keys stay on the server. Neither key is ever sent to the browser; in the demo the buyer runs server-side for that reason.",
                "The demo generates its keys locally and stores them in a file that is excluded from version control. Use a secrets manager for anything beyond a demo.",
                "Channel state is held in memory. If the provider process restarts during a session, that state is lost. A production provider needs durable storage for it.",
                "One buyer key runs one session at a time in the demo.",
                "The buyer's exposure is limited to its deposit. The provider's exposure is limited to one unit of work, because it charges before it delivers.",
                "No custom smart contract is involved, so there is no contract of ours to audit. The channel logic is Tempo's.",
              ]}
            />
            <H3>Open-source components</H3>
            <P>
              The <K>rivus-meter</K> package is built on Tempo&apos;s <K>mppx</K> for the payment protocol and{" "}
              <K>viem</K> for chain access. The demo application uses Next.js with React and Tailwind CSS.
            </P>
          </Chapter>

          <Chapter id="faq" number={number("faq")} title="Questions and answers">
            <H3>Is the fractal the product?</H3>
            <P>
              No. It is a stand-in chosen because it is real CPU work that is easy to watch for half a minute. The
              product is the meter, which applies to any work that can be billed for the time it takes.
            </P>
            <H3>Does every unit cost a transaction fee?</H3>
            <P>
              No. Units are paid for with signed vouchers exchanged off-chain. The chain is involved when the channel
              opens and when it closes. In our runs that cost each side under 0.0001 pathUSD for the whole session.
            </P>
            <H3>What stops the provider from claiming more than it delivered?</H3>
            <P>
              It can only claim what the buyer has signed for, and the buyer signs as work arrives. If the work stops
              arriving, the buyer stops signing and closes.
            </P>
            <H3>What stops the buyer from taking work and not paying?</H3>
            <P>
              The provider charges before it delivers each unit, and the deposit is already locked on-chain. The most a
              buyer can take without paying is the unit in flight.
            </P>
            <H3>Do I need to hold a separate token for gas?</H3>
            <P>No. On Tempo, fees are paid in the stablecoin itself. Both parties hold only pathUSD.</P>
            <H3>Can a person use this from a wallet, not a program?</H3>
            <P>
              Not in this build. It is designed for keys held by software. A wallet-based buyer would be a different
              front end on the same protocol.
            </P>
          </Chapter>

          <Chapter id="glossary" number={number("glossary")} title="Glossary">
            <Table
              head={["Term", "Meaning"]}
              rows={[
                ["Buyer", "The party paying for work. Often an autonomous agent."],
                ["Provider", "The party doing the work and being paid."],
                ["Session", "One purchase, from opening a channel to closing it."],
                ["Payment channel", "An on-chain escrow between two parties that lets them exchange many payments off-chain and settle once."],
                ["Deposit", "What the buyer locks in the channel. The ceiling on what the session can cost."],
                ["Voucher", "A message signed by the buyer authorising the provider to claim up to a running total."],
                ["Settlement", "The on-chain close of the channel: the provider is paid and the remainder is refunded."],
                ["HTTP 402", "The Payment Required status code. The provider uses it to state its price."],
                ["MPP", "Tempo's Machine Payments Protocol, implemented by the mppx SDK."],
                ["TIP-20", "Tempo's token standard. pathUSD is a TIP-20 token."],
                ["EIP-712", "The standard for signing structured data, used for vouchers."],
                ["pathUSD", "The test stablecoin used for payments on Moderato. It has 6 decimals."],
                ["Moderato", "Tempo's public testnet."],
              ]}
            />
          </Chapter>
        </article>
      </div>
    </div>
  );
}
