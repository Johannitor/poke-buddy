import type { ReactNode } from "react";
import { TYPE_COLORS } from "../lib/constants";
import { pretty } from "../lib/pokemon";

// ---------- icons (16×16, white; drawn in the spirit of the in-game ones) ----------

const SHADE = "rgba(0,0,0,.35)";
const Line = ({ d, w = 1.6 }: { d: string; w?: number }) => (
  <path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

const BURST = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 ? 3.2 : 7.5;
  const a = (i * Math.PI) / 8 - Math.PI / 2;
  return `${(8 + r * Math.cos(a)).toFixed(2)},${(8 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

const CATEGORY_ICONS: Record<string, ReactNode> = {
  physical: <polygon points={BURST} fill="#ffd23f" stroke="#fff3b0" strokeWidth={0.8} />,
  special: (
    <>
      <circle cx="8" cy="8" r="6.3" fill="none" stroke="#fff" strokeWidth={1.6} />
      <circle cx="8" cy="8" r="3.6" fill="#a9bdff" />
      <circle cx="8" cy="8" r="1.5" fill="#fff" />
    </>
  ),
  status: (
    <>
      <circle cx="8" cy="8" r="6.3" fill="none" stroke="#fff" strokeWidth={1.5} />
      <path d="M8 1.7a6.3 6.3 0 0 1 0 12.6a3.15 3.15 0 0 1 0-6.3a3.15 3.15 0 0 0 0-6.3z" fill="#fff" />
    </>
  ),
};

const TYPE_ICONS: Record<string, ReactNode> = {
  normal: <circle cx="8" cy="8" r="5.3" fill="none" stroke="#fff" strokeWidth={2.2} />,
  fire: <path d="M8 1c.5 2.6 4.5 4.3 4.5 8.2a4.5 4.5 0 0 1-9 .4c0-2 1.2-3.3 2-4 .1 1.4.7 2.3 1.6 2.6C6.6 5.6 7.2 3 8 1z" />,
  water: <path d="M8 1.5S3 7.3 3 10.3a5 5 0 0 0 10 0C13 7.3 8 1.5 8 1.5z" />,
  electric: <path d="M9.5 1 3.5 9h4l-1.2 6 6.2-8.2h-4.1L9.5 1z" />,
  grass: (
    <path
      fillRule="evenodd"
      d="M13.8 2.2C7 2 2.6 5.3 2.6 10.3c0 1.3.4 2.4 1 3.3l-1 1 .7.7 1-1c.9.6 2 .9 3.2.9 5.1 0 6.6-5.6 6.3-13zM5 12.2c1.6-2.8 3.8-4.8 6.3-6.2-2.1 1.8-3.8 3.9-5.3 6.8z"
    />
  ),
  ice: <Line d="M8 1.5v13M2.4 4.75l11.2 6.5M2.4 11.25l11.2-6.5M6.3 2.8 8 4.3l1.7-1.5M6.3 13.2 8 11.7l1.7 1.5" />,
  fighting: (
    <>
      <path d="M3 7h10v3.5A3.5 3.5 0 0 1 9.5 14h-3A3.5 3.5 0 0 1 3 10.5z" />
      <circle cx="4.6" cy="5.6" r="1.6" />
      <circle cx="7.2" cy="4.8" r="1.6" />
      <circle cx="9.8" cy="4.8" r="1.6" />
      <circle cx="12.4" cy="5.6" r="1.6" />
    </>
  ),
  poison: (
    <>
      <circle cx="7" cy="10" r="4.5" />
      <circle cx="11.6" cy="4.4" r="2.3" />
      <circle cx="5" cy="3.2" r="1.4" />
    </>
  ),
  ground: <path d="M1 13.5 6 5l2.6 4.3L10.5 7l4.5 6.5z" />,
  flying: <path d="M1.5 4c3.5 0 8.5.6 12.5 4.2-1.2.2-2.4.1-3.5-.2 1 .7 1.7 1.6 2 2.6-1.3 0-2.6-.4-3.7-1 .6.8.9 1.7.9 2.7C5.4 12 2.6 8.6 1.5 4z" />,
  psychic: <Line w={1.8} d="M8 8.2a1 1 0 0 1 1.6-.6 2.2 2.2 0 0 1-.6 3.4 3.6 3.6 0 0 1-4.6-2A5 5 0 0 1 6.7 2.6 6 6 0 0 1 14 7" />,
  bug: (
    <>
      <ellipse cx="8" cy="9.5" rx="4.5" ry="5" />
      <path d="M8 5v9.5" stroke={SHADE} />
      <Line w={1.4} d="M5.8 4 4.2 1.8M10.2 4l1.6-2.2" />
    </>
  ),
  rock: (
    <>
      <path d="M5 2.5h5.5L14 6.5 12.5 13H4L2 7.5z" />
      <path d="M5 2.5 7 7l5.5-.5M7 7l-3 6" fill="none" stroke={SHADE} />
    </>
  ),
  ghost: (
    <>
      <path d="M8 1.5a5 5 0 0 0-5 5v8l1.7-1.4 1.6 1.4L8 13.1l1.7 1.4 1.6-1.4 1.7 1.4v-8a5 5 0 0 0-5-5z" />
      <circle cx="6.2" cy="6.8" r="1.1" fill={SHADE} />
      <circle cx="9.8" cy="6.8" r="1.1" fill={SHADE} />
    </>
  ),
  dragon: <path d="M3 2c2.5 2 3.5 5.5 3 11-1.2-3.5-2.6-6.6-3-11zM7.5 1.5c2.5 2.5 3.2 6.3 2.4 12-1-3.7-2.3-7.5-2.4-12zM12 2.5c2 2.5 2.3 6 1.3 10.5-.8-3.3-1.7-6.7-1.3-10.5z" />,
  dark: <path d="M10.5 1.8a6.5 6.5 0 1 0 3.7 10.6 5.2 5.2 0 0 1-3.7-10.6z" />,
  steel: <path fillRule="evenodd" d="M8 1.2 14 4.6v6.8L8 14.8 2 11.4V4.6zM8 5.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z" />,
  fairy: <path d="M7 1c.6 3.6 1.4 4.4 5 5-3.6.6-4.4 1.4-5 5-.6-3.6-1.4-4.4-5-5 3.6-.6 4.4-1.4 5-5zM12.5 9.5c.3 1.5.6 1.8 2 2-1.4.3-1.7.6-2 2-.3-1.4-.6-1.7-2-2 1.4-.2 1.7-.5 2-2z" />,
  unknown: <text x="8" y="12.8" textAnchor="middle" fontSize="12" fontWeight="700">?</text>,
};

const CATEGORY_COLORS: Record<string, [string, string]> = {
  physical: ["#d8432c", "#b02a17"],
  special: ["#56658f", "#3c4766"],
  status: ["#9a979c", "#77747a"],
};

// ---------- badges ----------

const BADGE =
  "items-center gap-1 rounded-md py-0.5 text-[11px] font-bold uppercase " +
  "whitespace-nowrap text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)] [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 flex-none fill-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
      {children}
    </svg>
  );
}

/** Type chip; `compact` drops the icon and centres the label (for narrow table cells). */
export function TypeBadge({ type, compact = false }: { type: string; compact?: boolean }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.unknown;
  const background = `linear-gradient(color-mix(in srgb, ${c} 88%, #fff), color-mix(in srgb, ${c} 80%, #000))`;
  if (compact) {
    return (
      <span className={`${BADGE} flex w-full justify-center text-[10px]`} style={{ background }}>
        {pretty(type)}
      </span>
    );
  }
  return (
    <span className={`${BADGE} inline-flex pl-1 pr-2 tracking-wide`} style={{ background }}>
      <Icon>{TYPE_ICONS[type] ?? TYPE_ICONS.unknown}</Icon>
      {pretty(type)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const [top, bottom] = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.status;
  return (
    <span className={`${BADGE} inline-flex pl-1 pr-2 tracking-wide`} style={{ background: `linear-gradient(${top}, ${bottom})` }}>
      <Icon>{CATEGORY_ICONS[category]}</Icon>
      {pretty(category)}
    </span>
  );
}
