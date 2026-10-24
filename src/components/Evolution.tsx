import { routeHref } from "../lib/route";
import type { ChainLink } from "../lib/pokeapi-types";
import { evolutionStages, pretty, spriteFor } from "../lib/pokemon";
import type { Version } from "../lib/types";
import { Card } from "./Card";

// Stages share the width and line up from the top; all cards have the same
// height, so parallel branches (e.g. Wurmple) stay in matching rows.
export function Evolution({ chain, currentId, version }: { chain: ChainLink; currentId: number; version: Version }) {
  const stages = evolutionStages(chain, version);

  return (
    <Card title="Evolution">
      {stages.length < 2 ? (
        <p className="text-muted">Does not evolve.</p>
      ) : (
        <div className="flex items-start gap-1.5">
          {stages.map((stage, i) => (
            <div key={i} className="contents">
              {i > 0 && <span className="mt-[46px] flex-none text-base text-muted">→</span>}
              <div
                className={
                  stage.length > 3
                    ? "grid min-w-0 flex-[2_1_0] grid-cols-2 gap-1.5"
                    : "flex min-w-0 flex-[1_1_0] flex-col gap-1.5"
                }
              >
                {stage.map((s) => (
                  <a
                    key={s.id}
                    href={routeHref({ ...version, slug: s.slug })}
                    title={s.how}
                    className={`flex h-[134px] min-w-0 flex-col items-center rounded-lg border bg-panel-2 p-1.5 text-center no-underline hover:border-[#4a5263] ${
                      s.id === currentId ? "border-accent" : "border-transparent"
                    }`}
                  >
                    <img src={spriteFor(s.id, version.gen)} alt="" loading="lazy" className="pixel size-14 flex-none" />
                    <span className="max-w-full truncate text-[13px] font-semibold">{pretty(s.slug)}</span>
                    {s.how && <span className="line-clamp-4 text-[11px] leading-[1.3] text-muted">{s.how}</span>}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
