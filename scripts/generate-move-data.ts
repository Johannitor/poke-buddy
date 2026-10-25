// Regenerates the static move data the app bundles, so the moves table needs
// no per-move requests:
//   src/data/moves.json     the table's columns for every move up to the newest supported gen
//   src/data/machines.json  which TM/HM teaches each move in every supported game
// Reads the CSV files PokéAPI itself is built from, pinned to one upstream
// commit so regenerating is reproducible. Re-run after adding a game to GENS
// (or after bumping POKEAPI_COMMIT) with `npm run generate:move-data`.
import { writeFile } from "node:fs/promises";
import { GEN_LIST, VG_RANK } from "../src/lib/constants.ts";
import type { MoveData } from "../src/lib/pokemon.ts";

// https://github.com/PokeAPI/pokeapi/tree/<commit>/data/v2/csv
const POKEAPI_COMMIT = "2bf639e5572812a67d2b94903fdcb9d095f5aeb2";
const ENGLISH = "9"; // languages.csv id of "en"
const FIRST_HM = 101; // machines.csv numbers HMs from 101 (= HM01)

type Row = Record<string, string>;

/** Minimal RFC 4180 parser: quoted fields may contain commas, quotes ("") and newlines. */
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') field += text[++i]; // "" is an escaped quote
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n") endRow();
    else if (c !== "\r") field += c;
  }
  if (field || row.length) endRow();
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

async function loadCsv(name: string): Promise<Row[]> {
  const url = `https://raw.githubusercontent.com/PokeAPI/pokeapi/${POKEAPI_COMMIT}/data/v2/csv/${name}.csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return parseCsv(await res.text());
}

const [moveRows, changelog, machineRows, moveNames, versionGroups, types, damageClasses, targets] = await Promise.all(
  ["moves", "move_changelog", "machines", "move_names", "version_groups", "types", "move_damage_classes", "move_targets"]
    .map(loadCsv),
);

/** id → identifier lookup for one of the small reference tables. */
const identifiers = (rows: Row[]) => new Map(rows.map((r) => [r.id, r.identifier]));
const typeName = identifiers(types);
const damageClassName = identifiers(damageClasses);
const targetName = identifiers(targets);
const vgName = identifiers(versionGroups);
const moveSlug = identifiers(moveRows);
const englishName = new Map(moveNames.filter((r) => r.local_language_id === ENGLISH).map((r) => [r.move_id, r.name]));

/** Empty CSV cells are nulls. */
const num = (cell: string) => (cell === "" ? null : Number(cell));

// ---------- machines.json: { [versionGroup]: { [moveSlug]: "hm03" } } ----------

const machineItem = (n: number) =>
  n >= FIRST_HM ? `hm${String(n - FIRST_HM + 1).padStart(2, "0")}` : `tm${String(n).padStart(2, "0")}`;

const vgs = Object.keys(VG_RANK).sort();
const machines: Record<string, Record<string, string>> = Object.fromEntries(vgs.map((vg) => [vg, {}]));
// HMs first, then TMs, each by number, so the JSON reads like the in-game list.
const machineOrder = (n: number) => (n >= FIRST_HM ? n - 1000 : n);
const supported = machineRows
  .filter((r) => vgName.get(r.version_group_id)! in machines)
  .sort((a, b) => machineOrder(Number(a.machine_number)) - machineOrder(Number(b.machine_number)));
for (const r of supported) machines[vgName.get(r.version_group_id)!][moveSlug.get(r.move_id)!] = machineItem(Number(r.machine_number));

for (const vg of vgs) {
  const count = Object.keys(machines[vg]).length;
  if (!count) throw new Error(`No machines found for ${vg}`);
  console.log(`${vg}: ${count} machines`);
}

// ---------- moves.json: { [moveSlug]: MoveData } ----------

const maxGen = Math.max(...GEN_LIST);
// A change at or before the oldest supported game never applies to it, so it's dropped.
const oldestRank = Math.min(...Object.values(VG_RANK));

const changesByMove = new Map<string, Row[]>();
for (const c of changelog
  .filter((c) => Number(c.changed_in_version_group_id) > oldestRank)
  .sort((a, b) => Number(a.changed_in_version_group_id) - Number(b.changed_in_version_group_id))) {
  changesByMove.set(c.move_id, [...(changesByMove.get(c.move_id) ?? []), c]);
}

function toMoveData(m: Row): MoveData {
  const past = (changesByMove.get(m.id) ?? []).map((c) => {
    // Only the fields that changed; an empty cell means "same as later".
    const entry: NonNullable<MoveData["past"]>[number] = { vg: Number(c.changed_in_version_group_id) };
    if (c.type_id) entry.type = typeName.get(c.type_id);
    if (c.power) entry.power = Number(c.power);
    if (c.accuracy) entry.accuracy = Number(c.accuracy);
    if (c.pp) entry.pp = Number(c.pp);
    if (c.effect_chance) entry.effectChance = Number(c.effect_chance);
    return entry;
  });
  return {
    name: englishName.get(m.id) ?? m.identifier,
    type: typeName.get(m.type_id) ?? "unknown",
    category: damageClassName.get(m.damage_class_id) ?? "status",
    power: num(m.power),
    accuracy: num(m.accuracy),
    pp: num(m.pp),
    priority: Number(m.priority),
    target: targetName.get(m.target_id) ?? "",
    effectChance: num(m.effect_chance),
    ...(past.length ? { past } : {}),
  };
}

const moves = moveRows
  .filter((m) => Number(m.generation_id) <= maxGen && Number(m.id) < 10000) // 10000+ are Colosseum/XD shadow moves
  .sort((a, b) => Number(a.id) - Number(b.id))
  .map((m) => [m.identifier, toMoveData(m)] as const);
if (moves.length < 600) throw new Error(`Only ${moves.length} moves found`);
console.log(`${moves.length} moves`);

// ---------- write ----------

const write = (file: string, text: string) => writeFile(new URL(`../src/data/${file}`, import.meta.url), text);
await write("machines.json", JSON.stringify(machines, null, 2) + "\n");
// One move per line keeps the file compact and its diffs readable.
await write("moves.json", `{\n${moves.map(([slug, m]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(m)}`).join(",\n")}\n}\n`);
console.log(`Wrote src/data/machines.json and src/data/moves.json from PokeAPI/pokeapi@${POKEAPI_COMMIT.slice(0, 10)}`);
