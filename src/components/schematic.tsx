import type { ReactNode } from "react";
import type { Family } from "@/lib/fasteners";
import { cn } from "@/lib/cn";

type Props = {
  family: Family;
  active: string | null;
  letters: string[];
  className?: string;
};

function has(letters: string[], key: string) {
  return letters.includes(key);
}

function hexPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function flatHex(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function Tone({ on, children }: { on: boolean; children: ReactNode }) {
  return <g className={on ? "text-primary" : "text-foreground"}>{children}</g>;
}

function HCallout({
  x1,
  x2,
  y,
  label,
  on,
  show,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  on: boolean;
  show: boolean;
}) {
  if (!show || x2 - x1 < 24) return null;
  const mid = (x1 + x2) / 2;
  return (
    <g className={on ? "text-primary" : "text-muted-foreground"}>
      <line x1={x1} x2={x1} y1={y - 14} y2={y + 3} stroke="currentColor" strokeWidth="1" />
      <line x1={x2} x2={x2} y1={y - 14} y2={y + 3} stroke="currentColor" strokeWidth="1" />
      <line x1={x1 + 6} x2={x2 - 6} y1={y} y2={y} stroke="currentColor" strokeWidth={on ? 1.7 : 1} />
      <path d={`M${x1 + 7} ${y - 3} L${x1} ${y} L${x1 + 7} ${y + 3}`} fill="currentColor" />
      <path d={`M${x2 - 7} ${y - 3} L${x2} ${y} L${x2 - 7} ${y + 3}`} fill="currentColor" />
      <text x={mid} y={y - 6} textAnchor="middle" fontSize="13" fill="currentColor">
        {label}
      </text>
    </g>
  );
}

function VCallout({
  x,
  y1,
  y2,
  label,
  on,
  show,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
  on: boolean;
  show: boolean;
}) {
  if (!show || Math.abs(y2 - y1) < 16) return null;
  const top = Math.min(y1, y2);
  const bot = Math.max(y1, y2);
  const mid = (top + bot) / 2;
  return (
    <g className={on ? "text-primary" : "text-muted-foreground"}>
      <line x1={x - 14} x2={x + 3} y1={top} y2={top} stroke="currentColor" strokeWidth="1" />
      <line x1={x - 14} x2={x + 3} y1={bot} y2={bot} stroke="currentColor" strokeWidth="1" />
      <line x1={x} x2={x} y1={top + 5} y2={bot - 5} stroke="currentColor" strokeWidth={on ? 1.7 : 1} />
      <text x={x - 6} y={mid + 4} textAnchor="end" fontSize="13" fill="currentColor">
        {label}
      </text>
    </g>
  );
}

function BoltSketch({ family, active, letters }: Props) {
  const headOn = active != null && ["K", "S", "E", "F", "R"].includes(active);
  const threadOn = active === "B" || active === "P";
  const sunk = family === "countersunk";
  const button = family === "button";
  const socket = family === "socket" || family === "set-screw";
  const flange = family === "hex-flange";
  const square = family === "square-bolt";
  const setScrew = family === "set-screw";
  const under = 108;
  const end = 300;
  const thread = 210;
  const top = 78;
  const bot = 122;

  return (
    <svg viewBox="0 0 460 220" className="h-auto w-full text-foreground" role="img">
      <title>Fastener schematic</title>
      <line x1="40" x2="320" y1="100" y2="100" stroke="currentColor" strokeDasharray="3 4" className="text-muted-foreground" />
      <Tone on={headOn}>
        {setScrew ? null : sunk ? (
          <path d={`M${under} ${top + 6} L62 100 L${under} ${bot - 6}`} fill="none" stroke="currentColor" strokeWidth="1.7" />
        ) : button ? (
          <path d={`M${under} ${top} Q46 62 46 100 Q46 138 ${under} ${bot}`} fill="none" stroke="currentColor" strokeWidth="1.7" />
        ) : square ? (
          <rect x="40" y="64" width="68" height="72" fill="none" stroke="currentColor" strokeWidth="1.7" />
        ) : (
          <path d={`M44 72 H${under} V128 H44 L34 116 V84 Z`} fill="none" stroke="currentColor" strokeWidth="1.7" />
        )}
        {socket && !setScrew ? <path d="M44 88 H64 L58 100 L64 112 H44" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
        {setScrew ? <path d="M70 86 H88 L82 100 L88 114 H70" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
        {flange ? <path d={`M${under - 8} 128 H146 V140 H${under - 8}`} fill="none" stroke="currentColor" strokeWidth="1.6" /> : null}
      </Tone>
      <Tone on={Boolean(threadOn || active === "D" || active === "L")}>
        <path
          d={`M${setScrew ? 88 : under} ${top} H${end} V${bot} H${setScrew ? 88 : under}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </Tone>
      <Tone on={threadOn}>
        {Array.from({ length: 6 }, (_, index) => {
          const x = thread + index * 13;
          return <path key={x} d={`M${x} ${top} l7 8 l-7 8 l7 8 l-7 12`} fill="none" stroke="currentColor" strokeWidth="1" />;
        })}
      </Tone>
      <HCallout x1={setScrew ? 88 : under} x2={end} y={168} label="L" on={active === "L"} show={has(letters, "L")} />
      <HCallout x1={thread} x2={end} y={196} label="B" on={active === "B"} show={has(letters, "B")} />
      <VCallout x={18} y1={72} y2={128} label="K" on={active === "K"} show={has(letters, "K") && !setScrew} />
      <VCallout x={318} y1={top} y2={bot} label="D" on={active === "D"} show={has(letters, "D")} />
      <g transform="translate(390 100)">
        {socket ? (
          <>
            <circle r="36" fill="none" stroke="currentColor" strokeWidth="1.6" className={active === "E" ? "text-primary" : "text-foreground"} />
            <polygon points={hexPoints(0, 0, 14)} fill="none" stroke="currentColor" strokeWidth="1.5" className={active === "S" ? "text-primary" : "text-foreground"} />
          </>
        ) : (
          <polygon
            points={square ? "-28,-28 28,-28 28,28 -28,28" : flatHex(0, 0, 32)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className={active === "S" || active === "E" ? "text-primary" : "text-foreground"}
          />
        )}
        <text y="4" textAnchor="middle" fontSize="12" fill="currentColor" className={active === "S" ? "text-primary" : "text-muted-foreground"}>
          {has(letters, "S") ? "S" : ""}
        </text>
      </g>
      {has(letters, "P") ? (
        <text x={thread + 8} y={70} fontSize="13" fill="currentColor" className={active === "P" ? "text-primary" : "text-muted-foreground"}>
          P
        </text>
      ) : null}
      {has(letters, "F") ? (
        <text x={120} y={156} fontSize="13" fill="currentColor" className={active === "F" ? "text-primary" : "text-muted-foreground"}>
          F
        </text>
      ) : null}
    </svg>
  );
}

function NutSketch({ family, active, letters }: Props) {
  const cap = family === "cap-nut";
  const wing = family === "wing-nut";
  const square = family === "square-nut";
  const flange = family === "flange-nut";
  const slotted = family === "slotted-nut";
  return (
    <svg viewBox="0 0 460 210" className="h-auto w-full" role="img">
      <title>Nut schematic</title>
      <g transform="translate(130 96)">
        {wing ? (
          <path
            d="M-70 -6 Q-64 -40 -18 -16 L-18 16 Q-64 40 -70 6 Z M70 -6 Q64 -40 18 -16 L18 16 Q64 40 70 6 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        ) : null}
        <polygon
          points={square ? "-42,-42 42,-42 42,42 -42,42" : hexPoints(0, 0, 52)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className={active === "S" || active === "E" ? "text-primary" : "text-foreground"}
        />
        <circle r="18" fill="none" stroke="currentColor" strokeWidth="1.4" />
        {slotted ? <path d="M0 -52 V-32 M-24 -44 L-14 -30 M24 -44 L14 -30" stroke="currentColor" strokeWidth="1.5" /> : null}
        {flange ? (
          <circle r="66" fill="none" stroke="currentColor" strokeWidth="1.4" className={active === "F" ? "text-primary" : "text-muted-foreground"} />
        ) : null}
        <text y="5" textAnchor="middle" fontSize="13" fill="currentColor" className={active === "S" ? "text-primary" : "text-muted-foreground"}>
          {has(letters, "S") ? "S" : ""}
        </text>
      </g>
      <g transform="translate(330 100)">
        {cap ? (
          <path d="M-32 -22 Q0 -64 32 -22" fill="none" stroke="currentColor" strokeWidth="1.6" className={active === "K" ? "text-primary" : "text-foreground"} />
        ) : null}
        <rect
          x="-32"
          y="-22"
          width="64"
          height="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className={active === "T" ? "text-primary" : "text-foreground"}
        />
        <path d="M-14 -22 V22 M14 -22 V22" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
        {flange ? <path d="M-48 22 H48 V32 H-48 Z" fill="none" stroke="currentColor" strokeWidth="1.5" /> : null}
        <HCallout x1={-32} x2={32} y={58} label="T" on={active === "T"} show={has(letters, "T")} />
      </g>
    </svg>
  );
}

function WasherSketch({ family, active, letters }: Props) {
  const square = family === "square-washer";
  const spring = family === "spring-washer";
  const taper = family === "taper-washer";
  return (
    <svg viewBox="0 0 460 200" className="h-auto w-full" role="img">
      <title>Washer schematic</title>
      <g transform="translate(120 90)">
        {square ? (
          <rect x="-48" y="-48" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="1.7" className={active === "A" ? "text-primary" : "text-foreground"} />
        ) : (
          <circle r="48" fill="none" stroke="currentColor" strokeWidth="1.7" className={active === "E" ? "text-primary" : "text-foreground"} />
        )}
        <circle r="18" fill="none" stroke="currentColor" strokeWidth="1.6" className={active === "D" ? "text-primary" : "text-foreground"} />
        {spring ? <path d="M12 -14 Q28 0 10 16" fill="none" stroke="currentColor" strokeWidth="1.6" /> : null}
        <text y="4" textAnchor="middle" fontSize="13" fill="currentColor" className={active === "D" ? "text-primary" : "text-muted-foreground"}>
          {has(letters, "D") ? "D" : ""}
        </text>
        <text y="68" textAnchor="middle" fontSize="13" fill="currentColor" className={active === "E" || active === "A" ? "text-primary" : "text-muted-foreground"}>
          {square ? (has(letters, "A") ? "A" : "") : has(letters, "E") ? "E" : ""}
        </text>
      </g>
      <g transform="translate(300 90)">
        {taper ? (
          <path d="M-60 16 L70 16 L70 -4 L-60 -18 Z" fill="none" stroke="currentColor" strokeWidth="1.7" className={active === "T" ? "text-primary" : "text-foreground"} />
        ) : spring ? (
          <path d="M-60 -8 H70 V16 H-60 Z M-60 -8 L-40 -20 H70" fill="none" stroke="currentColor" strokeWidth="1.6" />
        ) : (
          <rect x="-60" y="-12" width="130" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" className={active === "T" ? "text-primary" : "text-foreground"} />
        )}
        <text x="84" y="4" fontSize="13" fill="currentColor" className={active === "T" ? "text-primary" : "text-muted-foreground"}>
          {has(letters, "T") ? "T" : ""}
        </text>
      </g>
    </svg>
  );
}

function PinSketch({ family, active, letters }: Props) {
  const clevis = family === "clevis";
  const taper = family === "taper-pin";
  return (
    <svg viewBox="0 0 460 180" className="h-auto w-full" role="img">
      <title>Pin schematic</title>
      <line x1="40" x2="400" y1="80" y2="80" stroke="currentColor" strokeDasharray="3 4" className="text-muted-foreground" />
      {clevis ? <path d="M48 64 H86 V56 H108 V104 H86 V96 H48 Z" fill="none" stroke="currentColor" strokeWidth="1.7" /> : null}
      {taper ? (
        <path d="M90 70 L380 76 V84 L90 90 Z" fill="none" stroke="currentColor" strokeWidth="1.7" className={active === "D" || active === "L" ? "text-primary" : "text-foreground"} />
      ) : (
        <path d={`M${clevis ? 108 : 70} 66 H380 V94 H${clevis ? 108 : 70} Z`} fill="none" stroke="currentColor" strokeWidth="1.7" />
      )}
      {clevis ? <circle cx="330" cy="80" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /> : null}
      {!taper && !clevis ? <path d="M70 66 L58 80 L70 94 M380 66 L392 80 L380 94" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
      <HCallout x1={clevis ? 86 : 70} x2={380} y={132} label="L" on={active === "L"} show={has(letters, "L")} />
      <text x="400" y="84" fontSize="13" fill="currentColor" className={active === "D" ? "text-primary" : "text-muted-foreground"}>
        {has(letters, "D") ? "D" : ""}
      </text>
    </svg>
  );
}

export function Schematic({ family, active, letters, className }: Props) {
  const pin = family === "clevis" || family === "dowel" || family === "taper-pin";
  const nut = family.endsWith("nut");
  const washer = family.endsWith("washer");
  return (
    <div className={cn("text-foreground", className)}>
      {pin ? (
        <PinSketch family={family} active={active} letters={letters} />
      ) : nut ? (
        <NutSketch family={family} active={active} letters={letters} />
      ) : washer ? (
        <WasherSketch family={family} active={active} letters={letters} />
      ) : (
        <BoltSketch family={family} active={active} letters={letters} />
      )}
    </div>
  );
}

export function FamilyIcon({ family }: { family: Family }) {
  const pin = family === "clevis" || family === "dowel" || family === "taper-pin";
  const nut = family.endsWith("nut");
  const washer = family.endsWith("washer");
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-14 text-foreground" aria-hidden="true">
      {pin ? (
        <path d="M8 16 H50 V24 H8 Z M50 16 L58 20 L50 24" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : washer ? (
        <>
          <circle cx="32" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="32" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : nut ? (
        <polygon points={hexPoints(32, 20, 14)} fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <>
          <path d="M10 12 H22 V28 H10 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M22 15 H54 V25 H22 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}
