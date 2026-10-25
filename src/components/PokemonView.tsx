import { useState } from "react";
import { getJSON } from "../lib/api";
import { GENS } from "../lib/constants";
import { useAsync } from "../lib/hooks";
import type { EvolutionChain, Pokemon, PokemonForm, PokemonSpecies } from "../lib/pokeapi-types";
import {
  LATEST_RANK, dexNo, english, englishName, introducedBy, spriteFor, statsForGen, typesForGen,
  varietiesInGame, varietyLabel, varietyTitle,
} from "../lib/pokemon";
import type { Variety } from "../lib/pokemon";
import type { SpeciesEntry, Version } from "../lib/types";
import { TypeBadge } from "./Badges";
import { Card, Message } from "./Card";
import { Evolution } from "./Evolution";
import { MoveDialog } from "./MoveDialog";
import { LevelControl } from "./LevelControl";
import { Moves } from "./Moves";
import { StatCalculator } from "./StatCalculator";
import { TypeMatchups } from "./TypeMatchups";

// A variety's default form shares its name, so it can be fetched without the
// (much larger) Pokémon resource; that tells us which game introduced it.
const loadForm = (name: string) => getJSON<PokemonForm>(`/pokemon-form/${name}/`).catch(() => null);

async function loadPokemon(id: number) {
  const species = await getJSON<PokemonSpecies>(`/pokemon-species/${id}/`);
  const forms = await Promise.all(species.varieties.map((v) => loadForm(v.pokemon.name)));

  // Skip forms from games newer than the ones we support (Alolan, Gigantamax, …).
  const wanted = species.varieties
    .map((v, i) => ({ ref: v, form: forms[i] }))
    .filter(({ ref, form }) => ref.is_default || (form && introducedBy(form, LATEST_RANK)));

  const [varieties, chain] = await Promise.all([
    Promise.all(
      wanted.map(async ({ ref, form }): Promise<Variety> => ({
        pokemon: await getJSON<Pokemon>(ref.pokemon.url),
        form,
        isDefault: ref.is_default,
      })),
    ),
    getJSON<EvolutionChain>(species.evolution_chain.url),
  ]);
  return { species, varieties, chain };
}

export function PokemonView({
  entry,
  version,
  form,
  onForm,
  favorite,
  onToggleFavorite,
}: {
  entry: SpeciesEntry;
  version: Version;
  form: string | null;
  onForm: (form: string | null) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const state = useAsync(() => loadPokemon(entry.id), [entry.id]);
  const [level, setLevel] = useState(50);
  const [openMove, setOpenMove] = useState<string | null>(null);

  if (state.status === "loading") return <Message>Loading {entry.name}…</Message>;
  if (state.status === "error") return <Message error>Failed to load {entry.name} ({state.error.message}).</Message>;

  const { species, chain } = state.data;
  const speciesName = englishName(species.names, species.name);
  const available = varietiesInGame(state.data.varieties, version.vg);
  const base = available.find((v) => v.isDefault) ?? available[0];
  // A form that doesn't exist in this game (e.g. a Mega before X/Y) falls back to the default.
  const current = available.find((v) => v.pokemon.name === form) ?? base;
  const { pokemon } = current;

  // Some forms have no learnset of their own for a game (e.g. Deoxys in Emerald is
  // filed under Speed Forme); borrow one from the default form, else any other form.
  const hasMoves = (v: Variety) =>
    v.pokemon.moves.some((m) => m.version_group_details.some((d) => d.version_group.name === version.vg));
  const movesFrom = [current, base, ...available].find(hasMoves) ?? current;

  const game = GENS[version.gen].games.find((g) => g.vg === version.vg)!;
  const versionSprites = pokemon.sprites.versions?.[game.sprite[0]]?.[game.sprite[1]];
  const sprite =
    (version.gen === 5 && versionSprites?.animated?.front_default) ||
    versionSprites?.front_default ||
    (current.isDefault ? spriteFor(species.id, version.gen) : pokemon.sprites.front_default);
  const name = varietyTitle(current, speciesName);
  const genus = english(species.genera)?.genus ?? "";
  const types = typesForGen(pokemon, version.gen);
  const battleOnly = current.form?.is_battle_only;

  return (
    <>
      <LevelControl level={level} onLevel={setLevel} />
      <div className="grid items-start gap-4 min-[900px]:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="grid size-28 flex-none place-items-center rounded-xl bg-panel-2">
                {sprite && <img src={sprite} alt={name} className="pixel max-h-24 max-w-24" />}
              </div>
              <div className="min-w-0">
                <div className="tabular-nums text-muted">{dexNo(species.id)}</div>
                <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight">
                  {name}
                  <button
                    onClick={onToggleFavorite}
                    aria-pressed={favorite}
                    aria-label={favorite ? "Unfavorite" : "Favorite"}
                    title={favorite ? "Unfavorite" : "Favorite"}
                    className={`cursor-pointer text-xl leading-none ${favorite ? "text-[#f5c542]" : "text-muted hover:text-text"}`}
                  >
                    {favorite ? "★" : "☆"}
                  </button>
                </h1>
                <div className="mb-2 text-[13px] text-muted">
                  {genus}
                  {battleOnly && <> · {current.form?.is_mega ? "Mega Evolution, " : ""}battle only</>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>
              </div>
            </div>

            {available.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3" role="group" aria-label="Form">
                {available.map((v) => (
                  <button
                    key={v.pokemon.name}
                    onClick={() => onForm(v.isDefault ? null : v.pokemon.name)}
                    aria-pressed={v === current}
                    className={`cursor-pointer rounded-full border bg-panel-2 px-3 py-1 text-xs ${
                      v === current ? "border-accent text-text" : "border-line text-muted hover:text-text"
                    }`}
                  >
                    {varietyLabel(v, speciesName)}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <TypeMatchups types={types} gen={version.gen} />
          <Evolution chain={chain.chain} currentId={species.id} version={version} />
        </div>

        <Moves
          pokemon={movesFrom.pokemon}
          vg={version.vg}
          gameLabel={game.label}
          level={level}
          note={movesFrom === current ? null : `Same moves as ${varietyTitle(movesFrom, speciesName)}.`}
          onOpenMove={setOpenMove}
        />
      </div>

      <StatCalculator stats={statsForGen(pokemon, version.gen)} level={level} />
      <MoveDialog slug={openMove} vg={version.vg} onClose={() => setOpenMove(null)} />
    </>
  );
}
