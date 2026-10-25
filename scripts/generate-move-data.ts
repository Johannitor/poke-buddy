// Regenerates the static move data the app bundles, so the moves table needs
// no per-move requests:
//   src/data/moves.json     the table's columns for every move up to the newest supported gen
//   src/data/machines.json  which TM/HM teaches each move in every supported game
// The games are frozen, so this only needs re-running when a game is added to
// GENS. Run with `npm run generate:move-data`.
import { writeFile } from "node:fs/promises";
import { GEN_LIST, VG_RANK } from "../src/lib/constants.ts";
import type { MoveData } from "../src/lib/pokemon.ts";

const ENDPOINT = "https://graphql.pokeapi.co/v1beta2";

const QUERY = `query ($vgs: [String!], $maxGen: Int!) {
  machine(where: { versiongroup: { name: { _in: $vgs } } }) {
    item { name }
    move { name }
    versiongroup { name }
  }
  move(where: { generation_id: { _lte: $maxGen }, id: { _lt: 10000 } }, order_by: { id: asc }) {
    name power accuracy pp priority move_effect_chance
    type { name }
    movedamageclass { name }
    movetarget { name }
    movenames(where: { language: { name: { _eq: "en" } } }) { name }
    movechanges(order_by: { version_group_id: asc }) {
      version_group_id power accuracy pp move_effect_chance
      type { name }
    }
  }
}`;

type Named = { name: string } | null;

interface MachineRow {
  item: { name: string }; // "hm01", "tm24"
  move: { name: string };
  versiongroup: { name: string };
}

interface MoveValuesRow {
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  move_effect_chance: number | null;
  type: Named;
}

interface MoveRow extends MoveValuesRow {
  name: string;
  priority: number;
  movedamageclass: Named;
  movetarget: Named;
  movenames: { name: string }[];
  movechanges: (MoveValuesRow & { version_group_id: number })[];
}

const vgs = Object.keys(VG_RANK).sort();
const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: QUERY, variables: { vgs, maxGen: Math.max(...GEN_LIST) } }),
});
if (!res.ok) throw new Error(`${res.status} from ${ENDPOINT}`);
const { data, errors } = await res.json();
if (errors) throw new Error(JSON.stringify(errors));

// ---------- machines.json: { [versionGroup]: { [moveSlug]: "hm03" } } ----------

// HMs first, then TMs, each by number, so the JSON reads like the in-game list.
const machineOrder = (item: string) => (item.startsWith("hm") ? 0 : 1000) + Number(item.slice(2));

const machines: Record<string, Record<string, string>> = Object.fromEntries(vgs.map((vg) => [vg, {}]));
const machineRows = (data.machine as MachineRow[]).sort((a, b) => machineOrder(a.item.name) - machineOrder(b.item.name));
for (const { item, move, versiongroup } of machineRows) machines[versiongroup.name][move.name] = item.name;

for (const vg of vgs) {
  const count = Object.keys(machines[vg]).length;
  if (!count) throw new Error(`No machines returned for ${vg}`);
  console.log(`${vg}: ${count} machines`);
}

// ---------- moves.json: { [moveSlug]: MoveData } ----------

// A change at or before the oldest supported game never applies to it, so it's dropped.
const oldestRank = Math.min(...Object.values(VG_RANK));

function toMoveData(m: MoveRow): MoveData {
  const past = m.movechanges
    .filter((c) => c.version_group_id > oldestRank)
    .map((c) => {
      // Only the fields that changed; null means "same as later".
      const entry: NonNullable<MoveData["past"]>[number] = { vg: c.version_group_id };
      if (c.type) entry.type = c.type.name;
      if (c.power !== null) entry.power = c.power;
      if (c.accuracy !== null) entry.accuracy = c.accuracy;
      if (c.pp !== null) entry.pp = c.pp;
      if (c.move_effect_chance !== null) entry.effectChance = c.move_effect_chance;
      return entry;
    });
  return {
    name: m.movenames[0]?.name ?? m.name,
    type: m.type?.name ?? "unknown",
    category: m.movedamageclass?.name ?? "status",
    power: m.power,
    accuracy: m.accuracy,
    pp: m.pp,
    priority: m.priority,
    target: m.movetarget?.name ?? "",
    effectChance: m.move_effect_chance,
    ...(past.length ? { past } : {}),
  };
}

const moves = (data.move as MoveRow[]).map((m) => [m.name, toMoveData(m)] as const);
if (moves.length < 600) throw new Error(`Only ${moves.length} moves returned`);
console.log(`${moves.length} moves`);

// ---------- write ----------

const write = (file: string, text: string) => writeFile(new URL(`../src/data/${file}`, import.meta.url), text);
await write("machines.json", JSON.stringify(machines, null, 2) + "\n");
// One move per line keeps the file compact and its diffs readable.
await write("moves.json", `{\n${moves.map(([slug, m]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(m)}`).join(",\n")}\n}\n`);
console.log("Wrote src/data/machines.json and src/data/moves.json");
