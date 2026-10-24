import { getJSON } from "../lib/api";
import { attackTypes } from "../lib/constants";
import type { Gen } from "../lib/constants";
import { useAsync } from "../lib/hooks";
import type { PokemonType } from "../lib/pokeapi-types";
import { damageTaken } from "../lib/pokemon";
import { TypeBadge } from "./Badges";
import { Card } from "./Card";

const COLUMNS = [
  { mult: 4, label: "4×", cls: "bg-[#f07067]/20 text-[#ffb4ae]" },
  { mult: 2, label: "2×", cls: "bg-[#f07067]/20 text-[#ffb4ae]" },
  { mult: 1, label: "1×", cls: "text-[#565d6c]" },
  { mult: 0.5, label: "½×", cls: "bg-[#6fcf7a]/20 text-[#a8e6ae]" },
  { mult: 0.25, label: "¼×", cls: "bg-[#6fcf7a]/20 text-[#a8e6ae]" },
];

export function TypeMatchups({ types, gen }: { types: string[]; gen: Gen }) {
  const state = useAsync(() => Promise.all(types.map((t) => getJSON<PokemonType>(`/type/${t}/`))), [types.join(), gen]);

  let body;
  if (state.status === "loading") body = <p className="text-muted">Loading…</p>;
  else if (state.status === "error") body = <p className="text-muted">Couldn't load type data.</p>;
  else {
    const mult = damageTaken(state.data, gen);
    const all = attackTypes(gen);
    // One column per multiplier that occurs; types stack down the rows.
    const cols = COLUMNS.map((c) => ({ ...c, types: all.filter((t) => mult[t] === c.mult) })).filter((c) => c.types.length);
    const depth = Math.max(...cols.map((c) => c.types.length));
    // Immunities get their own line below the table, with full badges.
    const immune = all.filter((t) => mult[t] === 0);
    body = (
      <>
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} className="px-0.5 pb-1.5">
                  <span className={`inline-block min-w-[30px] rounded-md px-1.5 py-px text-xs font-bold ${c.cls}`}>{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: depth }, (_, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c.label} className="px-0.5 py-[3px]">
                    {c.types[i] && <TypeBadge type={c.types[i]} compact />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {immune.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">No effect from</span>
            {immune.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        )}
      </>
    );
  }
  return <Card title="Type matchups">{body}</Card>;
}
