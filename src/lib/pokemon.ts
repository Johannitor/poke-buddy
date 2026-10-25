import { GENS, MOVE_TABS, NAME_OVERRIDES, POWER_NOTES, SPECIAL_TYPES_GEN3, VG_RANK, attackTypes, genOfVg } from "./constants";
import type { Gen, LearnMethod } from "./constants";
import type { ChainLink, EvolutionDetail, Move, MoveValues, NamedRef, Pokemon, PokemonForm, PokemonType } from "./pokeapi-types";
import type { Version } from "./types";
import MACHINES from "../data/machines.json";

const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

// ---------- small helpers ----------

export const idFromUrl = (url: string) => Number(url.match(/\/(\d+)\/?$/)![1]);

export const pretty = (slug: string) =>
  NAME_OVERRIDES[slug] ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const isEnglish = (entry: { language: NamedRef }) => entry.language.name === "en";

/** The English entry of a localized list (names, genera, effects, …), if any. */
export const english = <T extends { language: NamedRef }>(entries: T[] | undefined): T | undefined =>
  entries?.find(isEnglish);

export const englishName = (names: { language: NamedRef; name: string }[] | undefined, fallback: string) =>
  english(names)?.name ?? pretty(fallback);

const ROMAN_VALUES: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };
const genNumber = (ref: NamedRef) => ROMAN_VALUES[ref.name.replace("generation-", "")] ?? 99;

// Version-group ids (Game.rank) are chronological except Colosseum (12) and XD (13),
// which are Gen 3 spin-offs released alongside Gen 4/5.
function vgRank(ref: NamedRef) {
  const id = idFromUrl(ref.url);
  return id === 12 || id === 13 ? 7.5 : id;
}

export const dexNo = (id: number) => `#${String(id).padStart(3, "0")}`;

export const spriteFor = (id: number, gen: Gen) => `${SPRITES}/versions/${GENS[gen].spriteSet}/${id}.png`;

// ---------- alternate forms ----------

/** One Pokémon variety of a species (default form, Mega, Rotom appliance, …). */
export interface Variety {
  pokemon: Pokemon;
  form: PokemonForm | null; // null if it couldn't be loaded
  isDefault: boolean;
}

/** Newest supported game; forms introduced after it are never shown. */
export const LATEST_RANK = Math.max(...Object.values(VG_RANK));

export const introducedBy = (form: PokemonForm, rank: number) => vgRank(form.version_group) <= rank;

/** The varieties that exist in the given game. The default one always does. */
export function varietiesInGame(varieties: Variety[], vg: string): Variety[] {
  return varieties.filter((v) => v.isDefault || (v.form && introducedBy(v.form, VG_RANK[vg])));
}

/** Full name for headings, e.g. "Mega Charizard X" or "Heat Rotom". */
export const varietyTitle = (v: Variety, speciesName: string) =>
  (!v.isDefault && english(v.form?.names)?.name) || speciesName;

/** Short name for the form switcher, e.g. "Attack Forme" or "Mega Charizard X". */
export const varietyLabel = (v: Variety, speciesName: string) =>
  english(v.form?.form_names)?.name || (!v.isDefault && english(v.form?.names)?.name) || speciesName;

// ---------- generation-correct data ----------

// past_types / past_stats / past_damage_relations entries describe values held
// up to and including their `generation`.
function pastForGen<T extends { generation: NamedRef }>(entries: T[] | undefined, gen: Gen): T | undefined {
  return (entries ?? [])
    .filter((e) => genNumber(e.generation) >= gen)
    .sort((a, b) => genNumber(a.generation) - genNumber(b.generation))[0];
}

export function typesForGen(p: Pokemon, gen: Gen): string[] {
  return (pastForGen(p.past_types, gen)?.types ?? p.types).map((t) => t.type.name);
}

export function statsForGen(p: Pokemon, gen: Gen): Record<string, number> {
  const stats = Object.fromEntries(p.stats.map((s) => [s.stat.name, s.base_stat]));
  const later = (p.past_stats ?? [])
    .filter((e) => genNumber(e.generation) >= gen)
    .sort((a, b) => genNumber(b.generation) - genNumber(a.generation)); // apply oldest last
  for (const entry of later) for (const s of entry.stats) if (s.stat.name in stats) stats[s.stat.name] = s.base_stat;
  return stats;
}

export interface MoveInfo {
  name: string;
  type: string;
  category: string;
  power: number | null;
  powerLabel: string;
  powerNote: string | null;
  accuracy: number | null;
  pp: number | null;
  effectChance: number | null;
}

/** Stand-in for a move whose details couldn't be loaded. */
export const placeholderMove = (slug: string): MoveInfo => ({
  name: pretty(slug), type: "unknown", category: "status", power: null,
  powerLabel: "—", powerNote: null, accuracy: null, pp: null, effectChance: null,
});

// past_values entries hold the values that applied *before* their version group.
export function moveForVg(m: Move, vg: string): MoveInfo {
  const rank = VG_RANK[vg];
  const later = (m.past_values ?? [])
    .filter((e) => vgRank(e.version_group) > rank)
    .sort((a, b) => vgRank(a.version_group) - vgRank(b.version_group));
  const pick = <K extends keyof MoveValues>(field: K): MoveValues[K] => {
    const hit = later.find((e) => e[field] !== null && e[field] !== undefined);
    return hit ? hit[field] : m[field];
  };

  const type = pick("type")?.name ?? "unknown";
  // Gen 3 and earlier: damaging moves are physical or special by type.
  let category = m.damage_class?.name ?? "status";
  if (category !== "status" && genOfVg(vg) <= 3) category = SPECIAL_TYPES_GEN3.has(type) ? "special" : "physical";

  let power = pick("power");
  let powerLabel = power ? String(power) : "—";
  let powerNote: string | null = null;
  if (category !== "status" && (power === null || power <= 1)) {
    [powerLabel, powerNote] = POWER_NOTES[m.name] ?? ["Varies", null];
    power = null;
  }
  return {
    name: englishName(m.names, m.name),
    type,
    category,
    power,
    powerLabel,
    powerNote,
    accuracy: pick("accuracy"),
    pp: pick("pp"),
    effectChance: pick("effect_chance"),
  };
}

// In-game description from the selected game, else the closest earlier one.
export function flavorTextForVg(m: Move, vg: string): string {
  const entries = m.flavor_text_entries.filter(isEnglish);
  const rank = VG_RANK[vg];
  const best = entries
    .filter((e) => vgRank(e.version_group) <= rank)
    .sort((a, b) => vgRank(b.version_group) - vgRank(a.version_group))[0];
  // PokéAPI keeps the games' line-break hyphens as soft hyphens (U+00AD).
  return (best ?? entries[0])?.flavor_text.replace(/\s+/g, " ").replace(/­ /g, "").trim() ?? "";
}

export function shortEffect(m: Move, effectChance: number | null): string {
  return (english(m.effect_entries)?.short_effect ?? "")
    .replaceAll("$effect_chance", String(effectChance ?? ""));
}

// ---------- type matchups ----------

/** Damage multiplier for every attacking type of the gen against the given defending types. */
export function damageTaken(types: PokemonType[], gen: Gen): Record<string, number> {
  const mult = Object.fromEntries(attackTypes(gen).map((t) => [t, 1]));
  for (const type of types) {
    const rel = pastForGen(type.past_damage_relations, gen)?.damage_relations ?? type.damage_relations;
    for (const t of rel.double_damage_from) if (t.name in mult) mult[t.name] *= 2;
    for (const t of rel.half_damage_from) if (t.name in mult) mult[t.name] *= 0.5;
    for (const t of rel.no_damage_from) if (t.name in mult) mult[t.name] = 0;
  }
  return mult;
}

// ---------- stat calculator ----------

// Gen 3+ stat formula with IV 0, EV 0 and a hindering (×0.9) nature.
export function minStat(key: string, base: number, level: number): number {
  if (key === "hp") return base === 1 ? 1 : Math.floor((2 * base * level) / 100) + level + 10; // Shedinja
  return Math.floor((Math.floor((2 * base * level) / 100) + 5) * 0.9);
}

// ---------- evolution ----------

// Pick the evolution details that applied in the selected game: the most recent
// version group at or before it (older entries like Eevee's stones still apply).
function detailsForVg(details: EvolutionDetail[], vg: string): EvolutionDetail[] {
  const rank = VG_RANK[vg];
  const rankOf = (d: EvolutionDetail) => (d.version_group ? vgRank(d.version_group) : 0);
  const applicable = details.filter((d) => rankOf(d) <= rank);
  if (!applicable.length) return [];
  const best = Math.max(...applicable.map(rankOf));
  return applicable.filter((d) => rankOf(d) === best);
}

function describeDetail(d: EvolutionDetail): string {
  const parts: string[] = [];
  const trig = d.trigger?.name;
  if (trig === "use-item" && d.item) parts.push(`Use ${pretty(d.item.name)}`);
  else if (trig === "trade") parts.push("Trade");
  else if (trig === "shed") parts.push("Lv. 20, spare slot + Poké Ball");
  else if (trig === "level-up") parts.push(d.min_level ? `Lv. ${d.min_level}` : "Level up");
  else if (trig) parts.push(pretty(trig));

  if (d.held_item) parts.push(`holding ${pretty(d.held_item.name)}`);
  if (d.trade_species) parts.push(`for ${pretty(d.trade_species.name)}`);
  if (d.min_happiness) parts.push("high friendship");
  if (d.min_beauty) parts.push("high Beauty");
  if (d.min_affection) parts.push("high affection");
  if (d.known_move) parts.push(`knowing ${pretty(d.known_move.name)}`);
  if (d.known_move_type) parts.push(`knowing a ${pretty(d.known_move_type.name)} move`);
  if (d.location) parts.push(`at ${pretty(d.location.name.replace(/^(hoenn|kanto|sinnoh|unova|kalos)-/, ""))}`);
  if (d.gender === 1) parts.push("(female)");
  if (d.gender === 2) parts.push("(male)");
  if (d.time_of_day) parts.push(`(${d.time_of_day})`);
  if (d.party_species) parts.push(`with ${pretty(d.party_species.name)} in party`);
  if (d.party_type) parts.push(`with a ${pretty(d.party_type.name)} type in party`);
  if (d.relative_physical_stats === 1) parts.push("Atk > Def");
  if (d.relative_physical_stats === -1) parts.push("Atk < Def");
  if (d.relative_physical_stats === 0) parts.push("Atk = Def");
  if (d.needs_overworld_rain) parts.push("in rain");
  return parts.join(", ").replace(/, \(/g, " (");
}

export interface EvoNode {
  id: number;
  slug: string;
  how: string;
}

/**
 * Flatten the chain into stages, dropping species from later generations.
 * A dropped species' evolutions take its place, so Gen 4 babies don't hide
 * their chain in Gen 3 (Happiny → Chansey → Blissey shows Chansey → Blissey).
 */
export function evolutionStages(chain: ChainLink, version: Version): EvoNode[][] {
  const maxId = GENS[version.gen].maxId;
  const stages: EvoNode[][] = [];
  (function walk(node: ChainLink, depth: number) {
    const id = idFromUrl(node.species.url);
    if (id > maxId) {
      node.evolves_to.forEach((child) => walk(child, depth));
      return;
    }
    const how = depth === 0
      ? ""
      : [...new Set(detailsForVg(node.evolution_details, version.vg).map(describeDetail))].join(" / ");
    (stages[depth] ??= []).push({ id, slug: node.species.name, how });
    node.evolves_to.forEach((child) => walk(child, depth + 1));
  })(chain, 0);
  return stages;
}

// ---------- moves ----------

export interface LearnedMove {
  url: string;
  slug: string;
  level: number;
  order: number | null;
}

/**
 * The moves a Pokémon knows when the game generates it at `level` (wild, gift):
 * walk the level-up learnset in order, add every move learned at or below that
 * level, skip ones already known, and let each new move push out the oldest.
 * Expects `levelUp` sorted the way movesByMethod sorts it.
 */
export function movesKnownAt(levelUp: LearnedMove[], level: number): Set<LearnedMove> {
  const learned = levelUp.filter((m) => m.level <= level);
  const known: string[] = [];
  for (const m of learned) {
    if (known.includes(m.slug)) continue;
    known.push(m.slug);
    if (known.length > 4) known.shift();
  }
  // Returns learnset entries rather than slugs: a move listed at several levels
  // is marked once, at its last listing up to `level`. (Relearning it doesn't
  // change its slot, so which moves get pushed out is decided above.)
  return new Set(known.map((slug) => learned.findLast((m) => m.slug === slug)!));
}

export function movesByMethod(p: Pokemon, vg: string): Record<LearnMethod, LearnedMove[]> {
  const groups = Object.fromEntries(MOVE_TABS.map((t) => [t.method, [] as LearnedMove[]])) as Record<LearnMethod, LearnedMove[]>;
  for (const m of p.moves) {
    for (const d of m.version_group_details) {
      if (d.version_group.name !== vg) continue;
      const method = d.move_learn_method.name as LearnMethod;
      groups[method]?.push({ url: m.move.url, slug: m.move.name, level: d.level_learned_at, order: d.order });
    }
  }
  // Same-level moves keep the game's learnset order: it decides which four a
  // freshly generated Pokémon knows (the last four at or below its level).
  const byOrder = (a: LearnedMove, b: LearnedMove) => (a.order ?? Infinity) - (b.order ?? Infinity);
  groups["level-up"].sort((a, b) => a.level - b.level || byOrder(a, b) || a.slug.localeCompare(b.slug));
  for (const k of ["machine", "egg", "tutor"] as const) groups[k].sort((a, b) => a.slug.localeCompare(b.slug));
  return groups;
}

// ---------- TMs / HMs ----------

/** A TM or HM slot in one game, e.g. HM01 or TM24. */
export interface MachineNumber {
  kind: "hm" | "tm";
  number: number;
}

// Generated by scripts/generate-machines.ts: { [versionGroup]: { [moveSlug]: "hm03" } }.
const MACHINE_ITEMS: Record<string, Record<string, string>> = MACHINES;

/** The TM/HM that teaches a move in the given game, if any. */
export function machineForVg(slug: string, vg: string): MachineNumber | null {
  const match = MACHINE_ITEMS[vg]?.[slug]?.match(/^(hm|tm)(\d+)$/);
  return match ? { kind: match[1] as MachineNumber["kind"], number: Number(match[2]) } : null;
}

export const machineLabel = (m: MachineNumber) => `${m.kind.toUpperCase()}${String(m.number).padStart(2, "0")}`;

const MACHINE_GROUPS = [
  { kind: "hm", title: "HM" },
  { kind: "tm", title: "TM" },
] as const;

/** HMs first, then TMs, each by number; moves whose machine is unknown go last. */
export function groupByMachine<T extends { machine: MachineNumber | null }>(rows: T[]): { title: string; rows: T[] }[] {
  const byNumber = (a: T, b: T) => a.machine!.number - b.machine!.number;
  const groups: { title: string; rows: T[] }[] = MACHINE_GROUPS.map(({ kind, title }) => ({
    title,
    rows: rows.filter((r) => r.machine?.kind === kind).sort(byNumber),
  }));
  groups.push({ title: "Other", rows: rows.filter((r) => !r.machine) });
  return groups.filter((g) => g.rows.length);
}
