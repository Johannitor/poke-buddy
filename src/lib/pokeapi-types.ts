// The subset of PokéAPI response shapes this app reads.

export interface NamedRef {
  name: string;
  url: string;
}

interface Localized {
  language: NamedRef;
}

export interface PokemonSpeciesList {
  results: NamedRef[];
}

export interface PokemonSpecies {
  id: number;
  name: string;
  names: (Localized & { name: string })[];
  genera: (Localized & { genus: string })[];
  varieties: { is_default: boolean; pokemon: NamedRef }[];
  evolution_chain: { url: string };
}

interface TypeSlot {
  slot: number;
  type: NamedRef;
}

interface StatEntry {
  base_stat: number;
  stat: NamedRef;
}

export interface Pokemon {
  id: number;
  name: string;
  types: TypeSlot[];
  past_types?: { generation: NamedRef; types: TypeSlot[] }[];
  stats: StatEntry[];
  past_stats?: { generation: NamedRef; stats: StatEntry[] }[];
  sprites: {
    front_default: string | null;
    versions?: Record<string, Record<string, { front_default: string | null; animated?: { front_default: string | null } }>>;
  };
  moves: {
    move: NamedRef;
    version_group_details: {
      level_learned_at: number;
      move_learn_method: NamedRef;
      version_group: NamedRef;
      order: number | null; // position in the game's level-up learnset
    }[];
  }[];
}

export interface PokemonForm {
  name: string;
  version_group: NamedRef; // the game this form was introduced in
  is_battle_only: boolean;
  is_mega: boolean;
  names: (Localized & { name: string })[];
  form_names: (Localized & { name: string })[];
}

export interface EvolutionDetail {
  version_group?: NamedRef | null;
  trigger: NamedRef | null;
  item: NamedRef | null;
  held_item: NamedRef | null;
  trade_species: NamedRef | null;
  known_move: NamedRef | null;
  known_move_type: NamedRef | null;
  location: NamedRef | null;
  party_species: NamedRef | null;
  party_type: NamedRef | null;
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  gender: number | null;
  time_of_day: string;
  relative_physical_stats: number | null;
  needs_overworld_rain: boolean;
}

export interface ChainLink {
  species: NamedRef;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionChain {
  chain: ChainLink;
}

// Only the texts: a move's numbers come from the generated src/data/moves.json.
export interface Move {
  name: string;
  effect_entries: (Localized & { short_effect: string })[];
  flavor_text_entries: (Localized & { flavor_text: string; version_group: NamedRef })[];
}

interface DamageRelations {
  double_damage_from: NamedRef[];
  half_damage_from: NamedRef[];
  no_damage_from: NamedRef[];
}

export interface PokemonType {
  name: string;
  damage_relations: DamageRelations;
  past_damage_relations?: { generation: NamedRef; damage_relations: DamageRelations }[];
}
