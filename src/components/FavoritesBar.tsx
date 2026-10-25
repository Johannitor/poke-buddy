import { GENS, GEN_LIST } from "../lib/constants";
import type { Favorites } from "../lib/favorites";
import { spriteFor } from "../lib/pokemon";
import { routeHref } from "../lib/route";
import type { Route } from "../lib/route";

/** Quick links to favorited Pokémon; each can be unfavorited in place. */
export function FavoritesBar({ favorites, route }: { favorites: Favorites; route: Route }) {
  if (!favorites.list.length) return null;
  const { maxId } = GENS[route.gen];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3 text-[13px]">
      <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-muted">Favorites</span>
      {favorites.list.map((f) => {
        const inGen = f.id <= maxId;
        // Species from a later gen have no sprite in this gen's set; use the first gen that has them.
        const spriteGen = inGen ? route.gen : GEN_LIST.find((g) => f.id <= GENS[g].maxId)!;
        return (
          <span
            key={f.slug}
            className={`flex items-center rounded-full border bg-panel-2 ${
              f.slug === route.slug ? "border-accent" : "border-line"
            } ${inGen ? "" : "opacity-50"}`}
            title={inGen ? undefined : `Not in Gen ${GENS[route.gen].roman}`}
          >
            <a
              href={routeHref({ ...route, slug: f.slug, form: null })}
              className="flex items-center gap-1 py-0.5 pl-1 pr-1.5 no-underline hover:text-text"
            >
              <img src={spriteFor(f.id, spriteGen)} alt="" loading="lazy" className="pixel size-7" />
              <span className="font-semibold">{f.name}</span>
            </a>
            <button
              onClick={() => favorites.toggle(f)}
              aria-label={`Unfavorite ${f.name}`}
              title="Unfavorite"
              className="mr-1 grid size-5 cursor-pointer place-items-center rounded-full text-muted hover:bg-line hover:text-text"
            >
              ×
            </button>
          </span>
        );
      })}
      <button
        onClick={favorites.clear}
        className="ml-auto cursor-pointer rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-text"
      >
        Clear all
      </button>
    </div>
  );
}
