export type Gen = 3 | 4 | 5 | 6;

export interface Game {
  vg: string;
  label: string;
  rank: number; // PokéAPI version-group id; chronological, see vgRank
  sprite: [string, string]; // keys into pokemon.sprites.versions
}

export interface GenInfo {
  roman: string;
  maxId: number;
  spriteSet: string; // one sprite set that covers every Pokémon of the gen
  games: Game[]; // the first is the default (the most complete one)
}

export const GENS: Record<Gen, GenInfo> = {
  3: {
    roman: "III",
    maxId: 386,
    spriteSet: "generation-iii/emerald",
    games: [
      { vg: "emerald", label: "Emerald", rank: 6, sprite: ["generation-iii", "emerald"] },
      { vg: "firered-leafgreen", label: "FireRed / LeafGreen", rank: 7, sprite: ["generation-iii", "firered-leafgreen"] },
      { vg: "ruby-sapphire", label: "Ruby / Sapphire", rank: 5, sprite: ["generation-iii", "ruby-sapphire"] },
    ],
  },
  4: {
    roman: "IV",
    maxId: 493,
    spriteSet: "generation-iv/platinum",
    games: [
      { vg: "platinum", label: "Platinum", rank: 9, sprite: ["generation-iv", "platinum"] },
      { vg: "heartgold-soulsilver", label: "HeartGold / SoulSilver", rank: 10, sprite: ["generation-iv", "heartgold-soulsilver"] },
      { vg: "diamond-pearl", label: "Diamond / Pearl", rank: 8, sprite: ["generation-iv", "diamond-pearl"] },
    ],
  },
  5: {
    roman: "V",
    maxId: 649,
    spriteSet: "generation-v/black-white",
    games: [
      { vg: "black-2-white-2", label: "Black 2 / White 2", rank: 14, sprite: ["generation-v", "black-white"] },
      { vg: "black-white", label: "Black / White", rank: 11, sprite: ["generation-v", "black-white"] },
    ],
  },
  6: {
    roman: "VI",
    maxId: 721,
    spriteSet: "generation-vi/x-y",
    games: [
      { vg: "omega-ruby-alpha-sapphire", label: "Omega Ruby / Alpha Sapphire", rank: 16, sprite: ["generation-vi", "omega-ruby-alpha-sapphire"] },
      { vg: "x-y", label: "X / Y", rank: 15, sprite: ["generation-vi", "x-y"] },
    ],
  },
};

export const DEFAULT_GEN: Gen = 5;

export const GEN_LIST = Object.keys(GENS).map(Number) as Gen[];
export const isGen = (n: number): n is Gen => n in GENS;

export const defaultGame = (gen: Gen) => GENS[gen].games[0];

/** Rank (version-group id) of every supported game, by version-group name. */
export const VG_RANK: Record<string, number> = Object.fromEntries(
  GEN_LIST.flatMap((g) => GENS[g].games.map((game) => [game.vg, game.rank])),
);

/** Generation a supported version group belongs to. */
export const genOfVg = (vg: string): Gen =>
  GEN_LIST.find((g) => GENS[g].games.some((x) => x.vg === vg)) ?? DEFAULT_GEN;

export const MOVE_TABS = [
  { method: "level-up", label: "Level-up" },
  { method: "machine", label: "TM / HM" },
  { method: "egg", label: "Egg" },
  { method: "tutor", label: "Tutor" },
] as const;

export type LearnMethod = (typeof MOVE_TABS)[number]["method"];

// Attacking types of Gen 2–5; Fairy arrived in Gen 6.
const BASE_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
  "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel",
];
export const attackTypes = (gen: Gen) => (gen >= 6 ? [...BASE_TYPES, "fairy"] : BASE_TYPES);

// Before Gen 4 a damaging move's category came from its type, not the move.
export const SPECIAL_TYPES_GEN3 = new Set(["fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"]);

export const TYPE_COLORS: Record<string, string> = {
  normal: "#9a9a7a", fire: "#e8762b", water: "#4f86e8", electric: "#e3b51c",
  grass: "#5fae3b", ice: "#5cbcbc", fighting: "#b7302a", poison: "#9a3f9a",
  ground: "#c9a24a", flying: "#8f7fe0", psychic: "#ec4f7d", bug: "#99ad1f",
  rock: "#ab9535", ghost: "#6a5694", dragon: "#6a39f0", dark: "#6b5547",
  steel: "#9a9ab8", fairy: "#df8fa6", unknown: "#5b7b78", shadow: "#5b7b78",
};

export const STAT_LABELS: Record<string, string> = {
  hp: "HP", attack: "Atk", defense: "Def",
  "special-attack": "SpA", "special-defense": "SpD", speed: "Spe",
};

// Slugs whose English display name can't be derived by just capitalising.
export const NAME_OVERRIDES: Record<string, string> = {
  "nidoran-f": "Nidoran♀", "nidoran-m": "Nidoran♂", "mr-mime": "Mr. Mime",
  "mime-jr": "Mime Jr.", farfetchd: "Farfetch’d", "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z", flabebe: "Flabébé",
};


const OHKO = "Knocks the target out in one hit if it lands. Fails against higher-level targets.";

// Moves without a regular base power (PokéAPI reports null, or 1 for Hidden Power).
export const POWER_NOTES: Record<string, [label: string, note: string]> = {
  "dragon-rage": ["40 HP", "Always deals exactly 40 HP of damage."],
  "sonic-boom": ["20 HP", "Always deals exactly 20 HP of damage."],
  "seismic-toss": ["= Lv", "Deals damage equal to the user's level."],
  "night-shade": ["= Lv", "Deals damage equal to the user's level."],
  psywave: ["≈ Lv", "Deals random damage between 0.5× and 1.5× the user's level."],
  "super-fang": ["½ HP", "Halves the target's current HP."],
  endeavor: ["HP diff", "Cuts the target's HP down to the user's current HP."],
  "final-gambit": ["User HP", "Deals damage equal to the user's remaining HP; the user faints."],
  counter: ["2× dmg", "Returns double the physical damage taken this turn."],
  "mirror-coat": ["2× dmg", "Returns double the special damage taken this turn."],
  "metal-burst": ["1.5× dmg", "Returns 1.5× the damage taken this turn."],
  bide: ["2× dmg", "Waits two turns, then returns double the damage taken."],
  fissure: ["OHKO", OHKO],
  guillotine: ["OHKO", OHKO],
  "horn-drill": ["OHKO", OHKO],
  "sheer-cold": ["OHKO", OHKO],
  "gyro-ball": ["1–150", "Stronger the slower the user is compared to the target."],
  "low-kick": ["20–120", "Stronger the heavier the target is."],
  "grass-knot": ["20–120", "Stronger the heavier the target is."],
  "heavy-slam": ["40–120", "Stronger the heavier the user is compared to the target."],
  "heat-crash": ["40–120", "Stronger the heavier the user is compared to the target."],
  return: ["1–102", "Stronger the higher the user's friendship."],
  frustration: ["1–102", "Stronger the lower the user's friendship."],
  flail: ["20–200", "Stronger the lower the user's HP."],
  reversal: ["20–200", "Stronger the lower the user's HP."],
  eruption: ["1–150", "Stronger the higher the user's HP."],
  "water-spout": ["1–150", "Stronger the higher the user's HP."],
  "crush-grip": ["1–121", "Stronger the higher the target's HP."],
  "wring-out": ["1–121", "Stronger the higher the target's HP."],
  punishment: ["60–200", "Stronger the more the target's stats have been raised."],
  "trump-card": ["40–200", "Stronger the fewer PP it has left."],
  "electro-ball": ["40–150", "Stronger the faster the user is compared to the target."],
  magnitude: ["10–150", "Power is rolled randomly each time it's used."],
  present: ["40–120", "Randomly deals 40, 80 or 120 power — or heals the target."],
  "natural-gift": ["60–80", "Type and power depend on the held Berry."],
  fling: ["10–130", "Throws the held item; power depends on the item."],
  "spit-up": ["100–300", "Stronger the more times Stockpile was used."],
  "hidden-power": ["30–70", "Type and power depend on the user's IVs."],
  "beat-up": ["Varies", "Each healthy party member attacks; power depends on their base Attack."],
};
