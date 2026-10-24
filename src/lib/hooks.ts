import { useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "done"; data: T };

/**
 * Run an async loader whenever `deps` change; stale results are dropped.
 * `deps` must be JSON-serialisable (ids, slugs, …): a result only counts for
 * the deps it was loaded with, so the render right after a change already
 * reports "loading" instead of the previous deps' data.
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<AsyncState<T> & { key: string }>({ status: "loading", key });
  useEffect(() => {
    let alive = true;
    load().then(
      (data) => alive && setState({ status: "done", data, key }),
      (error: Error) => alive && setState({ status: "error", error, key }),
    );
    return () => {
      alive = false;
    };
  }, [key]); // the caller lists what `load` depends on
  return state.key === key ? state : { status: "loading" };
}
