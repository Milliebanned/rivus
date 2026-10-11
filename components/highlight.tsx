import type { ReactNode } from "react";

const TOKEN =
  /(\/\/.*$)|("[^"]*")|\b(import|export|from|const|async|await|function|return|if|for|of|yield)\b|\b(\d+)\b/gm;
const TOKEN_COLORS = ["text-zinc-500", "text-emerald-300", "text-sky-300", "text-amber-300"];

// Just enough colouring to make a snippet scannable: comments, strings, keywords, numbers.
export function highlight(code: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    parts.push(code.slice(last, match.index));
    const kind = match.slice(1).findIndex((group) => group !== undefined);
    parts.push(
      <span key={match.index} className={TOKEN_COLORS[kind]}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  parts.push(code.slice(last));
  return parts;
}
