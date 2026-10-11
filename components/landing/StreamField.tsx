"use client";

import { useEffect, useRef } from "react";

const COLUMNS = 120;
const ROWS = 28;
const SPACING = 0.3;
// Every fourth line carries a pulse of amber: a payment moving along the stream.
const PULSE_EVERY = 4;

// The hero backdrop: a surface of lines in perspective, rippling like a stream.
// Drawn by hand on a 2D canvas, so it needs no 3D library.
export function StreamField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let onScreen = true;

    function resize() {
      const box = canvas!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(now: number) {
      const t = now / 1000;
      const focal = height * 0.95;
      const horizon = height * 0.3;
      const halfSpan = ((COLUMNS - 1) / 2) * SPACING;
      context!.clearRect(0, 0, width, height);

      for (let row = ROWS - 1; row >= 0; row--) {
        const z = 1.7 + row * 0.36;
        const depth = 1 - row / ROWS;
        const project = (x: number): [number, number] => {
          const y =
            Math.sin(x * 0.5 + t * 0.7) * 0.26 + Math.sin(z * 0.9 - t * 1.1) * 0.2 + Math.sin((x + z) * 0.3 + t * 0.35) * 0.12;
          return [width / 2 + (x * focal) / z, horizon + ((1.5 - y) * focal) / z];
        };

        context!.beginPath();
        for (let column = 0; column < COLUMNS; column++) {
          const [screenX, screenY] = project(column * SPACING - halfSpan);
          if (column === 0) context!.moveTo(screenX, screenY);
          else context!.lineTo(screenX, screenY);
        }
        context!.strokeStyle = `rgba(170, 190, 230, ${0.04 + depth * 0.2})`;
        context!.lineWidth = 1;
        context!.stroke();

        if (row % PULSE_EVERY !== 1) continue;
        const reach = (width / 2 / focal) * z + 1;
        const pulseX = ((t * (0.9 + (row % 3) * 0.35) + row * 2.3) % (reach * 2)) - reach;
        const [pulseScreenX, pulseScreenY] = project(pulseX);
        const radius = 26 / z + 4;
        const glow = context!.createRadialGradient(pulseScreenX, pulseScreenY, 0, pulseScreenX, pulseScreenY, radius);
        glow.addColorStop(0, `rgba(251, 191, 36, ${0.35 + depth * 0.55})`);
        glow.addColorStop(1, "rgba(251, 191, 36, 0)");
        context!.fillStyle = glow;
        context!.fillRect(pulseScreenX - radius, pulseScreenY - radius, radius * 2, radius * 2);
      }

      if (!still && onScreen) frame = requestAnimationFrame(draw);
    }

    resize();
    frame = requestAnimationFrame(draw);

    const resized = new ResizeObserver(() => {
      resize();
      if (still) draw(0);
    });
    resized.observe(canvas);

    // Stop drawing once the hero has scrolled away.
    const seen = new IntersectionObserver(([entry]) => {
      const wasOnScreen = onScreen;
      onScreen = entry.isIntersecting;
      if (onScreen && !wasOnScreen && !still) frame = requestAnimationFrame(draw);
    });
    seen.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      seen.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
