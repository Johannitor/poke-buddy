import { getJSON } from "./lib/api";
import { GENS } from "./lib/constants";
import type { Gen } from "./lib/constants";
import { useAsync } from "./lib/hooks";
import type { PokemonSpeciesList } from "./lib/pokeapi-types";
import { idFromUrl, pretty } from "./lib/pokemon";
import { useHashRoute } from "./lib/route";
import type { SpeciesEntry } from "./lib/types";
import { Message } from "./components/Card";
import { Header } from "./components/Header";
import { PokemonView } from "./components/PokemonView";

async function loadSpecies(gen: Gen): Promise<SpeciesEntry[]> {
  const { maxId } = GENS[gen];
  const data = await getJSON<PokemonSpeciesList>(`/pokemon-species?limit=${maxId}`);
  return data.results
    .map((r) => ({ id: idFromUrl(r.url), slug: r.name, name: pretty(r.name) }))
    .filter((s) => s.id <= maxId)
    .sort((a, b) => a.id - b.id);
}

export default function App() {
  const [route, navigate] = useHashRoute();
  const species = useAsync(() => loadSpecies(route.gen), [route.gen]);
  const list = species.status === "done" ? species.data : [];

  let content;
  if (species.status === "error") content = <Message error>Couldn't reach PokéAPI ({species.error.message}).</Message>;
  else if (!route.slug) content = <Message>Search for a Pokémon to get started.</Message>;
  else if (species.status === "loading") content = <Message>Loading…</Message>;
  else {
    const entry = list.find((s) => s.slug === route.slug);
    content = entry ? (
      <PokemonView
        entry={entry}
        version={{ gen: route.gen, vg: route.vg }}
        form={route.form ?? null}
        onForm={(form) => navigate({ ...route, form })}
      />
    ) : (
      <Message>
        {pretty(route.slug)} isn't available in Gen {GENS[route.gen].roman}.
      </Message>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header route={route} species={list} navigate={navigate} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 p-5">{content}</main>
      <footer className="mx-auto max-w-3xl space-y-1.5 px-4 pb-6 pt-4 text-center text-xs text-muted">
        <p>
          All data comes from{" "}
          <a href="https://pokeapi.co" target="_blank" rel="noopener" className="font-semibold text-text underline">
            PokéAPI
          </a>{" "}
          — thank you for making it free and open ♥
        </p>
        <p className="opacity-75">
          Unofficial fan project, not affiliated with or endorsed by Nintendo, The Pokémon Company, Game Freak,
          Creatures Inc. or Niantic. Pokémon and all related names and images are trademarks of their respective owners.
        </p>
      </footer>
    </div>
  );
}
