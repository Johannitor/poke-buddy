import { useEffect, useState } from "react";
import type { SpeciesEntry } from "./types";

const FAVORITES_KEY = "poke-buddy:favorites";

function loadFavorites(): SpeciesEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return []; // storage blocked or corrupt — start empty
  }
}

export interface Favorites {
  list: SpeciesEntry[];
  has: (slug: string) => boolean;
  toggle: (entry: SpeciesEntry) => void;
  clear: () => void;
}

/** Favorited species, in the order they were added; persisted in localStorage. */
export function useFavorites(): Favorites {
  const [list, setList] = useState(loadFavorites);
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch {
      // storage blocked or full; persisting is best-effort
    }
  }, [list]);
  return {
    list,
    has: (slug) => list.some((f) => f.slug === slug),
    toggle: (entry) =>
      setList((l) =>
        l.some((f) => f.slug === entry.slug)
          ? l.filter((f) => f.slug !== entry.slug)
          : [...l, { id: entry.id, slug: entry.slug, name: entry.name }],
      ),
    clear: () => setList([]),
  };
}
