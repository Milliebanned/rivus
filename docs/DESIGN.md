# Design — Rivus

## Three pages

- `/` is the landing page. From the top: a hero with a 3D stream backdrop and a tilting illustration of one session; a ticker of the Tempo pieces in use; a strip of live figures read from the chain (sessions settled, pathUSD paid and refunded, the latest settlements as explorer links); **Built on Tempo**, placed first among the sections so the chain is the first thing explained (what Tempo provides, what Rivus does with each piece, the stack in isometric 3D, network details); what the product does, with a drag-to-stop calculator, feature cards and a comparison against flat fees, invoices and prepaid credits; a five-chapter animated walkthrough of one payment session; the live demo; developer setup in four steps with the code for each; a pointer to the documentation; and where the pattern applies. A small pill shows what the visit itself would cost at the demo price; it charges nothing and can be dismissed.
- `/demo` is the demo on its own, sized to fit a 1440x900 window without scrolling. Use this one for screen recordings.
- `/docs` is the documentation as one long document: problem, solution, how a session works, why Tempo, quickstart, provider guide, buyer guide, using Rivus with AI agents (including prompts for a coding assistant), pricing, failure cases, reference, troubleshooting, limits, questions and a glossary. It prints on white pages; `public/rivus-docs.pdf` is that print, linked from the page as "Open as PDF". After editing the document, regenerate the PDF by opening `/docs`, choosing "Print or save as PDF", and saving over that file.

The hero card, the calculator and the visit meter are illustrations and say so; they move no funds. Everything in the live demo section is real: the figures come from the running session and its on-chain settlement. Animation is turned off for visitors who ask for reduced motion.

## What a visitor experiences in the demo

A single view with two things happening side by side: a canvas that renders a fractal image tile by tile, and a meter that shows, live, how many seconds of compute have elapsed and how much that has cost so far. The two are locked together on purpose — the image filling in and the number climbing should read as one event, not two separate widgets.

### Flow

1. **Start.** A single prominent control starts a render. No configuration is asked of the visitor — the job begins immediately, matching the pitch that this is automatic, frictionless metering, not a manual purchase flow.
2. **Rendering.** The canvas fills in progressively, tile by tile, as the server computes and streams them. The meter next to it updates in real time: elapsed compute-seconds, and cost accumulated in `pathUSD`, ticking up smoothly rather than jumping in large steps.
3. **Stop, anytime.** A visible Stop control cancels the render mid-way. On stop, the meter should visibly settle to a final number and show that the unused portion of the deposit was refunded — this moment is the clearest proof of the whole pitch ("you only pay for what happened") and deserves clear visual confirmation, not a silent state change.
4. **Completion or stop, either way.** Once the render finishes (or is stopped), show a link to the settled transaction on Tempo's public explorer. This is the moment that turns "trust us" into "check for yourself" — it should be easy to find, not buried.
5. **Provider panel.** A smaller, secondary panel shows the provider's balance ticking up as payment is received, visible at the same time as the buyer's meter. This is what makes the two-sided nature of the payment legible at a glance — a viewer should be able to look at the page and understand both "I am being charged" and "someone is being paid" without reading any explanation.
6. **Agent traffic.** A terminal-style pane beside the canvas lists every request the buyer agent makes to the provider as it happens: the first request and its 402 price quote, the channel opening, each signed voucher with its running total and how long the provider took to accept it, the close, and the settlement transaction (a link to the explorer). The lines are read off the agent's real requests and responses, not scripted, so the payment is as watchable as the render. The buyer and provider balances sit above it as one compact card.
7. **For developers.** A collapsed-by-default panel shows the actual server-side integration snippet used to meter the render endpoint. This exists specifically so a judge (or anyone else) can see in a few seconds that the mechanism is a reusable pattern, not bespoke code for this one demo.

## Why this layout

The core claim of the product is "exact, automatic, honest billing." Every element on the page should make that claim checkable rather than asserted: the image is visibly still rendering while the meter runs (proving the billing tracks real work), the Stop button visibly triggers a refund (proving unused funds come back), and the explorer link lets anyone verify the transaction independently (proving it isn't a mockup). Nothing on the page should require the viewer to take a claim on faith when it could instead be shown happening.

## Tone

Polished, but still plain and technical in what it says — numbers, real transaction links, and visible code are more persuasive here than marketing copy. The landing page gives a first-time visitor (hackathon judges, and eventually real engineering teams) the context in under a minute; the demo inside it still behaves like a technical instrument. Every figure on the page is either measured from this project or labelled as an illustration.

## Out of scope for this design

- No onboarding flow, no account creation, no human wallet-connect UX — the product is infrastructure for automatic, agent-driven payments, and the demo should reflect that rather than pretend to be a consumer app.
- No configuration options (render size, price, etc.) exposed in the UI for the hackathon version — keep the single, working path bulletproof rather than adding surface area that could break on camera.
