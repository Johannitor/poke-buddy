import type { ReactNode } from "react";
import { GENS, GEN_LIST, defaultGame, isGen } from "../lib/constants";
import type { Route } from "../lib/route";
import type { SpeciesEntry } from "../lib/types";
import { SearchBox } from "./SearchBox";

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="flex items-center overflow-hidden rounded-lg border border-line bg-panel-2">
      <span className="pl-2.5 pr-2 text-xs uppercase tracking-wide text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent px-2 py-1.5 outline-none [&>option]:bg-panel-2"
      >
        {children}
      </select>
    </label>
  );
}

export function Header({ route, species, navigate }: { route: Route; species: SpeciesEntry[]; navigate: (r: Route) => void }) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-line bg-bg/90 px-5 py-3 backdrop-blur">
      <div className="text-[17px] font-bold">
        Poké<span className="text-accent">Buddy</span>
      </div>

      <div className="flex gap-2">
        <Select
          label="Gen"
          value={String(route.gen)}
          onChange={(v) => {
            const gen = Number(v);
            if (isGen(gen)) navigate({ ...route, gen, vg: defaultGame(gen).vg });
          }}
        >
          {GEN_LIST.map((g) => (
            <option key={g} value={g}>
              {GENS[g].roman}
            </option>
          ))}
        </Select>
        <Select label="Game" value={route.vg} onChange={(vg) => navigate({ ...route, vg })}>
          {GENS[route.gen].games.map((g) => (
            <option key={g.vg} value={g.vg}>
              {g.label}
            </option>
          ))}
        </Select>
      </div>

      <SearchBox species={species} gen={route.gen} onSelect={(s) => navigate({ ...route, slug: s.slug, form: null })} />
    </header>
  );
}
