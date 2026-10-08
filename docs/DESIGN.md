# Design — Rivus

## What a visitor experiences

A single page with two things happening side by side: a canvas that renders a fractal image tile by tile, and a meter that shows, live, how many seconds of compute have elapsed and how much that has cost so far. The two are locked together on purpose — the image filling in and the number climbing should read as one event, not two separate widgets.

### Flow

1. **Start.** A single prominent control starts a render. No configuration is asked of the visitor — the job begins immediately, matching the pitch that this is automatic, frictionless metering, not a manual purchase flow.
2. **Rendering.** The canvas fills in progressively, tile by tile, as the server computes and streams them. The meter next to it updates in real time: elapsed compute-seconds, and cost accumulated in `pathUSD`, ticking up smoothly rather than jumping in large steps.
3. **Stop, anytime.** A visible Stop control cancels the render mid-way. On stop, the meter should visibly settle to a final number and show that the unused portion of the deposit was refunded — this moment is the clearest proof of the whole pitch ("you only pay for what happened") and deserves clear visual confirmation, not a silent state change.
4. **Completion or stop, either way.** Once the render finishes (or is stopped), show a link to the settled transaction on Tempo's public explorer. This is the moment that turns "trust us" into "check for yourself" — it should be easy to find, not buried.
5. **Provider panel.** A smaller, secondary panel shows the provider's balance ticking up as payment is received, visible at the same time as the buyer's meter. This is what makes the two-sided nature of the payment legible at a glance — a viewer should be able to look at the page and understand both "I am being charged" and "someone is being paid" without reading any explanation.
6. **For developers.** A collapsed-by-default panel shows the actual server-side integration snippet used to meter the render endpoint. This exists specifically so a judge (or anyone else) can see in a few seconds that the mechanism is a reusable pattern, not bespoke code for this one demo.

## Why this layout

The core claim of the product is "exact, automatic, honest billing." Every element on the page should make that claim checkable rather than asserted: the image is visibly still rendering while the meter runs (proving the billing tracks real work), the Stop button visibly triggers a refund (proving unused funds come back), and the explorer link lets anyone verify the transaction independently (proving it isn't a mockup). Nothing on the page should require the viewer to take a claim on faith when it could instead be shown happening.

## Tone

Plain and technical rather than promotional — numbers, real transaction links, and visible code are more persuasive here than marketing copy. The audience (hackathon judges, and eventually real engineering teams) is better convinced by a page that behaves like a technical instrument than one that behaves like a landing page.

## Out of scope for this design

- No onboarding flow, no account creation, no human wallet-connect UX — the product is infrastructure for automatic, agent-driven payments, and the demo should reflect that rather than pretend to be a consumer app.
- No configuration options (render size, price, etc.) exposed in the UI for the hackathon version — keep the single, working path bulletproof rather than adding surface area that could break on camera.
