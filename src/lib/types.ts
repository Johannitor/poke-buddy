import type { Gen } from "./constants";

/** The game the user picked; everything gen-specific is resolved against it. */
export interface Version {
  gen: Gen;
  vg: string;
}

/** One entry of the species list the search box offers. */
export interface SpeciesEntry {
  id: number;
  slug: string;
  name: string;
}
