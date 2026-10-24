import { useEffect, useState } from "react";
import { DEFAULT_GEN, GENS, defaultGame, isGen } from "./constants";
import type { Version } from "./types";

export interface Route extends Version {
  slug: string | null;
  form?: string | null; // variety name, e.g. "charizard-mega-x"; absent = default form
}

// The last picked gen/game is remembered so a plain reload (no hash) keeps it.
const VERSION_KEY = "poke-buddy:version";

function loadSavedVersion(): Partial<Version> {
  try {
    return JSON.parse(localStorage.getItem(VERSION_KEY) ?? "{}");
  } catch {
    return {}; // storage blocked or corrupt — fall back to defaults
  }
}

function saveVersion({ gen, vg }: Version) {
  try {
    localStorage.setItem(VERSION_KEY, JSON.stringify({ gen, vg }));
  } catch {
    // storage blocked or full; persisting is best-effort
  }
}

/** The hash wins; otherwise the saved version; otherwise the default gen's default game. */
function parseHash(): Route {
  const [g, vg, slug, form] = location.hash.slice(1).split("/");
  const saved = loadSavedVersion();
  const hashGen = Number(g);
  const gen = isGen(hashGen) ? hashGen : saved.gen && isGen(saved.gen) ? saved.gen : DEFAULT_GEN;
  const valid = (v?: string) => !!v && GENS[gen].games.some((x) => x.vg === v);
  return {
    gen,
    vg: valid(vg) ? vg : valid(saved.vg) ? saved.vg! : defaultGame(gen).vg,
    slug: slug || null,
    form: form || null,
  };
}

/** Route lives in the hash (`#gen/game/pokemon[/form]`) so pages are bookmarkable. */
export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  useEffect(() => saveVersion(route), [route.gen, route.vg]);
  const navigate = (r: Route) => {
    location.hash = routeHref(r).slice(1);
  };
  return [route, navigate];
}

export const routeHref = (r: Route) => `#${r.gen}/${r.vg}/${r.slug ?? ""}${r.slug && r.form ? `/${r.form}` : ""}`;
