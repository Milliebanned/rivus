"use client";

import { useEffect, useRef } from "react";
import type { TrafficEvent } from "rivus-meter";

// One line of the buyer agent's traffic, as reported by the Rivus buyer in app/api/agent/route.ts.
export type LogLine = TrafficEvent;

const MARKS: Record<LogLine["kind"], { glyph: string; glyphColor: string; textColor: string }> = {
  note: { glyph: "·", glyphColor: "text-zinc-500", textColor: "text-zinc-400" },
  out: { glyph: "→", glyphColor: "text-amber-300", textColor: "text-zinc-100" },
  in: { glyph: "←", glyphColor: "text-emerald-300", textColor: "text-zinc-100" },
  voucher: { glyph: "⇄", glyphColor: "text-zinc-500", textColor: "text-zinc-400" },
  done: { glyph: "✓", glyphColor: "text-emerald-300", textColor: "text-emerald-200" },
  fail: { glyph: "✕", glyphColor: "text-red-300", textColor: "text-red-200" },
};

// How close to the bottom the view must be for new lines to keep it pinned there.
const FOLLOW_WITHIN_PX = 24;

type Props = {
  lines: LogLine[];
  // Shows a cursor after the last line while the agent is still working.
  running: boolean;
  className?: string;
};

// The requests the buyer agent makes to the provider, as they happen: the payment is as watchable as the render.
export function Terminal({ lines, running, className = "" }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const following = useRef(true);

  useEffect(() => {
    const element = scroller.current;
    if (element && following.current) element.scrollTop = element.scrollHeight;
  }, [lines.length]);

  const startedAt = lines[0]?.at ?? 0;

  return (
    <section className={`flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a0c10] ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs">
        <span className="uppercase tracking-wider text-zinc-500">Agent traffic</span>
        <span className="font-mono text-zinc-500">agent ⇄ provider</span>
      </div>

      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget;
          following.current = element.scrollHeight - element.scrollTop - element.clientHeight < FOLLOW_WITHIN_PX;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[11.5px] leading-[19px] [scrollbar-width:thin]"
      >
        {lines.length === 0 ? (
          <p className="font-sans text-xs leading-relaxed text-zinc-500">
            Every request the buyer agent sends to the provider appears here as it happens: the price quote, the channel
            opening, each signed voucher and the settlement.
          </p>
        ) : (
          <ol>
            {lines.map((line, index) => {
              const mark = MARKS[line.kind];
              return (
                <li key={index} className="flex gap-2.5">
                  <span className="w-11 shrink-0 text-right tabular-nums text-zinc-600">
                    {((line.at - startedAt) / 1000).toFixed(2)}
                  </span>
                  <span className={`w-3.5 shrink-0 text-center ${mark.glyphColor}`}>{mark.glyph}</span>
                  <span className={`min-w-0 break-words ${mark.textColor}`}>
                    {line.href ? (
                      <a
                        href={line.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/25 underline-offset-2 hover:decoration-white/60"
                      >
                        {line.text}
                      </a>
                    ) : (
                      line.text
                    )}
                  </span>
                </li>
              );
            })}
            {running && (
              <li className="flex gap-2.5">
                <span className="w-11 shrink-0" />
                <span className="w-3.5 shrink-0 animate-pulse text-center text-amber-300">▍</span>
              </li>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}
