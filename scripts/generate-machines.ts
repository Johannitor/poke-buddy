// Regenerates src/data/machines.json: which TM/HM teaches each move in every
// supported game. The games are frozen, so this only needs re-running when a
// game is added to GENS. Run with `npm run generate:machines`.
import { writeFile } from "node:fs/promises";
import { VG_RANK } from "../src/lib/constants.ts";

const ENDPOINT = "https://graphql.pokeapi.co/v1beta2";
const OUT = new URL("../src/data/machines.json", import.meta.url);

const QUERY = `query ($vgs: [String!]) {
  machine(where: { versiongroup: { name: { _in: $vgs } } }) {
    item { name }
    move { name }
    versiongroup { name }
  }
}`;

interface MachineRow {
  item: { name: string }; // "hm01", "tm24"
  move: { name: string };
  versiongroup: { name: string };
}

// HMs first, then TMs, each by number, so the JSON reads like the in-game list.
const machineOrder = (item: string) => (item.startsWith("hm") ? 0 : 1000) + Number(item.slice(2));

const vgs = Object.keys(VG_RANK).sort();
const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: QUERY, variables: { vgs } }),
});
if (!res.ok) throw new Error(`${res.status} from ${ENDPOINT}`);
const { data, errors } = await res.json();
if (errors) throw new Error(JSON.stringify(errors));

// { [versionGroup]: { [moveSlug]: "hm03" } }
const table: Record<string, Record<string, string>> = Object.fromEntries(vgs.map((vg) => [vg, {}]));
const rows = (data.machine as MachineRow[]).sort((a, b) => machineOrder(a.item.name) - machineOrder(b.item.name));
for (const { item, move, versiongroup } of rows) table[versiongroup.name][move.name] = item.name;

for (const vg of vgs) {
  const count = Object.keys(table[vg]).length;
  if (!count) throw new Error(`No machines returned for ${vg}`);
  console.log(`${vg}: ${count} machines`);
}
await writeFile(OUT, JSON.stringify(table, null, 2) + "\n");
console.log(`Wrote ${OUT.pathname}`);
