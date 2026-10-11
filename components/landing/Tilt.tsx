"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  // Largest rotation, in degrees, when the pointer is at an edge.
  max?: number;
  // Resting rotation, so a card can sit at an angle before anyone touches it.
  restX?: number;
  restY?: number;
};

// Tilts its children in 3D towards the pointer. Children can use translateZ to sit above the surface,
// and `--mx` / `--my` to place a highlight under the pointer.
export function Tilt({ children, className = "", max = 8, restX = 0, restY = 0 }: Props) {
  const surface = useRef<HTMLDivElement>(null);

  function move(event: PointerEvent<HTMLDivElement>) {
    const element = surface.current;
    if (!element || event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    element.style.setProperty("--rx", `${restX - y * max * 2}deg`);
    element.style.setProperty("--ry", `${restY + x * max * 2}deg`);
    element.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    element.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  }

  function leave() {
    const element = surface.current;
    if (!element) return;
    element.style.setProperty("--rx", `${restX}deg`);
    element.style.setProperty("--ry", `${restY}deg`);
  }

  return (
    <div className="h-full [perspective:1400px]" onPointerMove={move} onPointerLeave={leave}>
      <div
        ref={surface}
        className={`transition-transform duration-300 ease-out [transform-style:preserve-3d] ${className}`}
        style={{ transform: `rotateX(var(--rx, ${restX}deg)) rotateY(var(--ry, ${restY}deg))` }}
      >
        {children}
      </div>
    </div>
  );
}
