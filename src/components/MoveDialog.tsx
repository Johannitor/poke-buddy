import { useEffect, useRef } from "react";
import { getJSON } from "../lib/api";
import { useAsync } from "../lib/hooks";
import type { Move } from "../lib/pokeapi-types";
import { flavorTextForVg, moveForVg, pretty, shortEffect } from "../lib/pokemon";
import { CategoryBadge, TypeBadge } from "./Badges";

function MoveDetails({ url, vg }: { url: string; vg: string }) {
  const state = useAsync(() => getJSON<Move>(url), [url]);
  if (state.status === "loading") return <p className="text-muted">Loading…</p>;
  if (state.status === "error") return <p className="text-accent">Couldn't load move ({state.error.message}).</p>;

  const m = state.data;
  const d = moveForVg(m, vg);
  const flavor = flavorTextForVg(m, vg);
  const effect = shortEffect(m, d.effectChance);
  const facts: [string, string | number][] = [
    ["Power", d.powerLabel],
    ["Accuracy", d.accuracy ? `${d.accuracy}%` : "—"],
    ["PP", d.pp ?? "—"],
    ["Priority", m.priority > 0 ? `+${m.priority}` : m.priority],
    ["Target", pretty(m.target.name)],
  ];
  if (d.effectChance) facts.push(["Effect chance", `${d.effectChance}%`]);

  return (
    <>
      <h3 className="mb-2 pr-8 text-xl font-bold">{d.name}</h3>
      <div className="flex flex-wrap items-center gap-2.5">
        <TypeBadge type={d.type} />
        <CategoryBadge category={d.category} />
      </div>
      <dl className="my-4 grid grid-cols-3 gap-2">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-panel-2 px-2.5 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">{k}</dt>
            <dd className="mt-0.5 font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {d.powerNote && (
        <p className="mb-3 rounded-r-md border-l-[3px] border-gold bg-panel-2 px-2.5 py-2 text-[13px]">
          <span className="text-muted">Damage:</span> {d.powerNote}
        </p>
      )}
      {flavor && <p className="mb-2.5 italic">{flavor}</p>}
      {effect && (
        <p className="text-[13px]">
          <span className="text-muted">Effect:</span> {effect}
        </p>
      )}
    </>
  );
}

/** Native modal <dialog>: Esc, the × button and clicking the backdrop all close it. */
export function MoveDialog({ url, vg, onClose }: { url: string | null; vg: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (url && dlg && !dlg.open) dlg.showModal();
    if (!url && dlg?.open) dlg.close();
  }, [url]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clicks on the backdrop land on the <dialog> itself.
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-xl border border-line bg-panel p-0 text-text shadow-[0_20px_60px_rgba(0,0,0,0.6)] outline-none"
    >
      <div className="relative px-5 pb-5 pt-[18px]">
        <button
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="absolute right-4 top-3 cursor-pointer px-1 text-2xl leading-none text-muted outline-none hover:text-text focus-visible:text-text"
        >
          ×
        </button>
        {url && <MoveDetails url={url} vg={vg} />}
      </div>
    </dialog>
  );
}
