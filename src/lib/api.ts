const API = "https://pokeapi.co/api/v2";

// Two layers: an in-memory map for this page, and Cache Storage so responses
// survive reloads. Gen 4/5 data is frozen, so cached entries never expire —
// bump CACHE_NAME to throw everything away.
const CACHE_NAME = "pokeapi-v1";
const memory = new Map<string, Promise<unknown>>();
const persistent: Promise<Cache | null> =
  "caches" in window ? caches.open(CACHE_NAME).catch(() => null) : Promise.resolve(null);

async function fetchJSON(url: string): Promise<unknown> {
  const store = await persistent;
  const hit = await store?.match(url).catch(() => undefined);
  if (hit) return hit.json();

  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  store?.put(url, r.clone()).catch(() => {}); // quota errors etc. just skip caching
  return r.json();
}

/** Fetch a PokéAPI resource by absolute URL or API path (e.g. `/type/fire/`). */
export function getJSON<T>(url: string): Promise<T> {
  if (!url.startsWith("http")) url = API + url;
  let p = memory.get(url);
  if (!p) {
    p = fetchJSON(url);
    p.catch(() => memory.delete(url));
    memory.set(url, p);
  }
  return p as Promise<T>;
}
