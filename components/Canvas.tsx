"use client";

import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import { DEFAULT_SPEC, type TileRect } from "@/lib/fractal";

export type CanvasHandle = {
  // `pixels` is base64 RGBA, as sent by the render endpoint.
  draw(tile: TileRect & { pixels: string }): void;
  clear(): void;
};

const { width, height, tileSize } = DEFAULT_SPEC;

type Props = {
  ref: Ref<CanvasHandle>;
  // Shown centred over the empty grid before any tile has arrived.
  overlay?: ReactNode;
  // Rendered inside the frame, under the image.
  footer?: ReactNode;
};

export function Canvas({ ref, overlay, footer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    draw(tile) {
      const context = canvasRef.current?.getContext("2d");
      if (!context) return;
      const bytes = Uint8ClampedArray.from(atob(tile.pixels), (char) => char.charCodeAt(0));
      context.putImageData(new ImageData(bytes, tile.width, tile.height), tile.x, tile.y);
    },
    clear() {
      canvasRef.current?.getContext("2d")?.clearRect(0, 0, width, height);
    },
  }));

  // The faint grid marks the tiles still to be computed; finished tiles paint over it.
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0d1117]">
      <div
        className="relative"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
          backgroundSize: `${(tileSize / width) * 100}% ${(tileSize / height) * 100}%`,
        }}
      >
        <canvas ref={canvasRef} width={width} height={height} className="block h-auto w-full" />
        {overlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            {overlay}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
