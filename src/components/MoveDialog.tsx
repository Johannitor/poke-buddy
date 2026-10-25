import { useEffect, useRef } from "react";
import { getJSON } from "../lib/api";
import { useAsync } from "../lib/hooks";
import type { Move } from "../lib/pokeapi-types";
import { flavorTextForVg, moveForVg, pretty, shortEffect } from "../lib/pokemon";
import { CategoryBadge, TypeBadge } from "./Badges";

/** In-game description and effect text: the only part of a move that needs a request. */
function MoveTexts({ slug, vg, effectChance }: { slug: string; vg: string; effectChance: number | null }) {
  const state = useAsync(() => getJSON<Move>(`/move/${slug}/`), [slug]);
  if (state.status === "loading") return <p className="text-[13px] text-muted">Loading description…</p>;
  if (state.status === "error") return <p className="text-[13px] text-muted">Couldn't load the description ({state.error.message}).</p>;

  const flavor = flavorTextForVg(state.data, vg);
  const effect = shortEffect(state.data, effectChance);
  return (
    <>
      {flavor && <p className="mb-2.5 italic">{flavor}</p>}
      {effect && (
        <p className="text-[13px]">
          <span className="text-muted">Effect:</span> {effect}
        </p>
      )}
    </>
  );
}

function MoveDetails({ slug, vg }: { slug: string; vg: string }) {
  const d = moveForVg(slug, vg);
  const facts: [string, string | number][] = [
    ["Power", d.powerLabel],
    ["Accuracy", d.accuracy ? `${d.accuracy}%` : "—"],
    ["PP", d.pp ?? "—"],
    ["Priority", d.priority > 0 ? `+${d.priority}` : d.priority],
    ["Target", d.target ? pretty(d.target) : "—"],
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
      <MoveTexts slug={slug} vg={vg} effectChance={d.effectChance} />
    </>
  );
}

/** Native modal <dialog>: Esc, the × button and clicking the backdrop all close it. */
export function MoveDialog({ slug, vg, onClose }: { slug: string | null; vg: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (slug && dlg && !dlg.open) dlg.showModal();
    if (!slug && dlg?.open) dlg.close();
  }, [slug]);

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
        {slug && <MoveDetails slug={slug} vg={vg} />}
      </div>
    </dialog>
  );
}
