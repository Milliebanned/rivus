import type { CSSProperties } from "react";

const LAYERS = [
  { name: "Your service", detail: "any metered endpoint", face: "border-white/25 bg-white/[0.12]", ink: "text-zinc-200" },
  { name: "Rivus", detail: "session · charge · receipt", face: "border-amber-300/60 bg-amber-300/[0.28]", ink: "text-amber-200" },
  { name: "Machine Payments Protocol", detail: "channels · vouchers", face: "border-sky-300/40 bg-sky-300/[0.18]", ink: "text-sky-200" },
  { name: "Tempo", detail: "pathUSD settlement", face: "border-emerald-300/50 bg-emerald-300/[0.22]", ink: "text-emerald-200" },
];

const GAP = 58;
const TILT_DEGREES = 58;
// How far apart the slabs appear on screen once tilted: the labels use it to line up with them.
const SCREEN_GAP = GAP * Math.sin((TILT_DEGREES * Math.PI) / 180);

// The stack as four slabs in isometric 3D, each labelled where it sits.
export function Stack() {
  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[440px] [animation:float_8s_ease-in-out_infinite]">
      <div className="absolute left-[34%] top-[60%] h-[180px] w-[180px] [transform-style:preserve-3d] [transform:translate(-50%,-50%)_rotateX(58deg)_rotateZ(-45deg)]">
        {LAYERS.map((layer, index) => (
          <div
            key={layer.name}
            className={`absolute inset-0 rounded-2xl border backdrop-blur-sm [transform:translateZ(var(--lift))] ${layer.face}`}
            style={{ "--lift": `${(LAYERS.length - 1 - index) * GAP}px` } as CSSProperties}
          >
            <span className="absolute inset-3 rounded-xl border border-white/10" />
          </div>
        ))}
      </div>

      {/* Labels sit level with their slabs. */}
      <ol className="absolute left-[62%] top-[60%] w-[46%]">
        {LAYERS.map((layer, index) => (
          <li
            key={layer.name}
            className="absolute left-0 flex -translate-y-1/2 items-center gap-3 whitespace-nowrap"
            style={{ top: `${(index - (LAYERS.length - 1)) * SCREEN_GAP}px` }}
          >
            <span className="h-px w-6 bg-white/20" />
            <span>
              <span className={`block text-sm ${layer.ink}`}>{layer.name}</span>
              <span className="block text-xs text-zinc-500">{layer.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
