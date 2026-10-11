// Two stacked waves: a stream, and the two sides of a payment channel. Same mark as app/icon.svg.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" className="fill-amber-400" />
      <path
        d="M6 12c3.3-3 6.7-3 10 0s6.7 3 10 0M6 20c3.3-3 6.7-3 10 0s6.7 3 10 0"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-zinc-950"
      />
    </svg>
  );
}
