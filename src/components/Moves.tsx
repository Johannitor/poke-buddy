import { useState } from "react";
import { getJSON, mapLimit } from "../lib/api";
import { MOVE_TABS } from "../lib/constants";
import type { LearnMethod } from "../lib/constants";
import { useAsync } from "../lib/hooks";
import type { Move, Pokemon } from "../lib/pokeapi-types";
import { moveForVg, movesByMethod, movesKnownAt, pretty } from "../lib/pokemon";
import type { LearnedMove, MoveInfo } from "../lib/pokemon";
import { CategoryBadge, TypeBadge } from "./Badges";
import { Card } from "./Card";

const TH = "border-b border-line px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";
const TD = "px-2 py-[7px]";
const NUM = "text-right tabular-nums";

function NumCell({ value }: { value: number | null }) {
  return value ? <td className={`${TD} ${NUM}`}>{value}</td> : <td className={`${TD} ${NUM} text-[#565d6c]`}>—</td>;
}

function PowerCell({ m }: { m: MoveInfo }) {
  if (m.power) return <NumCell value={m.power} />;
  if (m.powerLabel !== "—") {
    return (
      <td className={`${TD} ${NUM} text-xs font-semibold text-gold`} title={m.powerNote ?? ""}>
        {m.powerLabel}
      </td>
    );
  }
  return <NumCell value={null} />;
}

export function Moves({ pokemon, vg, gameLabel, level, note = null, onOpenMove }: {
  pokemon: Pokemon;
  vg: string;
  gameLabel: string;
  level: number;
  note?: string | null;
  onOpenMove: (url: string) => void;
}) {
  const groups = movesByMethod(pokemon, vg);
  const [tab, setTab] = useState<LearnMethod>("level-up");
  // Fall back to the first non-empty tab (e.g. a Pokémon with no egg moves).
  const current = groups[tab].length ? tab : (MOVE_TABS.find((t) => groups[t.method].length)?.method ?? "level-up");
  const list = groups[current];

  const details = useAsync(
    () => mapLimit(list, 12, (m) => getJSON<Move>(m.url).then((mv) => moveForVg(mv, vg)).catch(() => null)),
    [pokemon.id, vg, current],
  );

  const showLevel = current === "level-up";
  const known = movesKnownAt(groups["level-up"], level);

  // Level-up tab only: highlight the predicted moveset, fade moves not learned yet.
  const rowState = (lm: LearnedMove) =>
    !showLevel ? "" : known.has(lm) ? "bg-accent/10 shadow-[inset_3px_0_0_var(--color-accent)]" : lm.level > level ? "opacity-40" : "";

  return (
    <Card title={`Moves · ${gameLabel}`}>
      <div className="mb-3 flex flex-wrap gap-1">
        {MOVE_TABS.filter((t) => groups[t.method].length).map((t) => (
          <button
            key={t.method}
            onClick={() => setTab(t.method)}
            className={`cursor-pointer rounded-full border bg-panel-2 px-3 py-1 text-[13px] ${
              t.method === current ? "border-accent text-text" : "border-line text-muted"
            }`}
          >
            {t.label}
            <span className="ml-1 text-[11px] opacity-60">{groups[t.method].length}</span>
          </button>
        ))}
      </div>

      {note && <p className="mb-3 text-[13px] text-muted">{note}</p>}

      {!list.length ? (
        <p className="text-muted">No move data for this game.</p>
      ) : details.status !== "done" ? (
        <p className="text-muted">Loading moves…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse whitespace-nowrap tabular-nums">
            <thead>
              <tr>
                {showLevel && <th className={TH}>Lv</th>}
                <th className={TH}>Move</th>
                <th className={TH}>Type</th>
                <th className={TH}>Category</th>
                <th className={`${TH} text-right`}>Pow</th>
                <th className={`${TH} text-right`}>Acc</th>
                <th className={`${TH} text-right`}>PP</th>
              </tr>
            </thead>
            <tbody>
              {list.map((lm, i) => {
                const d: MoveInfo = details.data[i] ?? {
                  name: pretty(lm.slug), type: "unknown", category: "status", power: null,
                  powerLabel: "—", powerNote: null, accuracy: null, pp: null, effectChance: null,
                };
                return (
                  <tr key={`${lm.slug}-${lm.level}`} onClick={() => onOpenMove(lm.url)} className={`cursor-pointer border-b border-[#20242d] hover:bg-[#1b1f27] ${rowState(lm)}`}>
                    {showLevel && <td className={`${TD} w-px text-muted`}>{lm.level || "—"}</td>}
                    <td className={`${TD} font-medium`}>{d.name}</td>
                    <td className={TD}>
                      <TypeBadge type={d.type} />
                    </td>
                    <td className={TD}>
                      <CategoryBadge category={d.category} />
                    </td>
                    <PowerCell m={d} />
                    <NumCell value={d.accuracy} />
                    <NumCell value={d.pp} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
