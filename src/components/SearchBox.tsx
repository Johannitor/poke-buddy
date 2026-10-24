import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Gen } from "../lib/constants";
import { dexNo, spriteFor } from "../lib/pokemon";
import type { SpeciesEntry } from "../lib/types";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

function findMatches(species: SpeciesEntry[], q: string): SpeciesEntry[] {
  q = q.trim();
  if (!q) return [];
  if (/^#?\d+$/.test(q)) {
    const n = String(Number(q.replace("#", "")));
    return species.filter((s) => String(s.id).startsWith(n)).slice(0, 8);
  }
  const nq = norm(q);
  const starts: SpeciesEntry[] = [];
  const contains: SpeciesEntry[] = [];
  for (const s of species) {
    const n = norm(s.name);
    if (n.startsWith(nq)) starts.push(s);
    else if (n.includes(nq)) contains.push(s);
  }
  return [...starts, ...contains].slice(0, 8);
}

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

export function SearchBox({ species, gen, onSelect }: { species: SpeciesEntry[]; gen: Gen; onSelect: (s: SpeciesEntry) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = findMatches(species, query);

  // Ctrl/⌘+K anywhere, or "/" when not typing elsewhere, jumps to the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
      const modK = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey);
      if (modK || (e.key === "/" && !typing)) {
        e.preventDefault();
        document.querySelector<HTMLDialogElement>("dialog[open]")?.close();
        input.current?.focus();
        input.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const choose = (s: SpeciesEntry) => {
    setQuery("");
    input.current?.blur();
    onSelect(s);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!matches.length) return;
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      if (matches[active]) choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative ml-auto min-w-48 max-w-md flex-1">
      <input
        ref={input}
        type="search"
        value={query}
        placeholder="Search Pokémon (name or #)…"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="peer w-full rounded-lg border border-line bg-panel-2 px-3 py-2 outline-none placeholder:text-muted focus:border-[#4a5263]"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[5px] border border-b-2 border-line bg-panel px-1.5 font-sans text-[11px] text-muted peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>

      {open && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-[340px] overflow-y-auto rounded-lg border border-line bg-panel-2 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {matches.map((s, i) => (
            <li
              key={s.id}
              // mousedown (not click) so the choice lands before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1 ${i === active ? "bg-[#2b303b]" : ""}`}
            >
              <img src={spriteFor(s.id, gen)} alt="" loading="lazy" className="pixel size-9" />
              <span>{s.name}</span>
              <span className="ml-auto text-xs tabular-nums text-muted">{dexNo(s.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
