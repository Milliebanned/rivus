import type { ReactNode } from "react";
import { highlight } from "../highlight";

// Building blocks for the long-form documentation page. Each is styled for the screen and
// restyled for paper by the print rules in app/globals.css.

export function Chapter({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="doc-chapter scroll-mt-24 border-t border-white/10 pt-12 first:border-0 first:pt-0">
      <p className="font-mono text-xs text-amber-300">{number}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">{title}</h2>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-4 text-xl font-medium text-zinc-100">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15.5px] leading-[1.75] text-zinc-300">{children}</p>;
}

export function K({ children }: { children: ReactNode }) {
  return <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">{children}</code>;
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5 text-[15.5px] leading-[1.7] text-zinc-300">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-amber-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="space-y-6">
      {items.map((item, index) => (
        <li key={item.title} className="doc-keep flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-300/40 font-mono text-xs text-amber-300">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="pt-0.5 font-medium text-zinc-100">{item.title}</p>
            {item.body}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Code({ file, children, plain = false }: { file?: string; children: string; plain?: boolean }) {
  return (
    <figure className="doc-keep overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12]">
      {file && <figcaption className="border-b border-white/10 px-4 py-2 font-mono text-xs text-zinc-500">{file}</figcaption>}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7] text-zinc-300">
        <code>{plain ? children : highlight(children)}</code>
      </pre>
    </figure>
  );
}

export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="doc-keep rounded-xl border border-amber-300/25 bg-amber-300/[0.05] px-5 py-4">
      <p className="text-sm font-medium text-amber-200">{title}</p>
      <div className="mt-1.5 text-[14.5px] leading-relaxed text-zinc-300">{children}</div>
    </aside>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="doc-keep overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-zinc-500">
            {head.map((cell) => (
              <th key={cell} className="px-4 py-3 font-normal">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/5 align-top last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-4 py-3 leading-relaxed ${cellIndex === 0 ? "text-zinc-100" : "text-zinc-400"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
