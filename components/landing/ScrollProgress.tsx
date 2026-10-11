"use client";

import { useEffect, useRef } from "react";

// A hairline under the navigation that fills as the page is read.
export function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty("transform", `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <span
      ref={bar}
      aria-hidden="true"
      className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-amber-400 to-emerald-300"
    />
  );
}
