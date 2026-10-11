"use client";

// Opens the browser's print dialog, where "Save as PDF" produces the document on paper-white pages.
export function PrintButton({ className }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={className}>
      Print or save as PDF
    </button>
  );
}
