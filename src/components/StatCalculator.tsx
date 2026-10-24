import { STAT_LABELS } from "../lib/constants";
import { minStat } from "../lib/pokemon";
import { Card } from "./Card";

const KEYS = Object.keys(STAT_LABELS);

export function StatCalculator({ stats, level }: { stats: Record<string, number>; level: number }) {
  const total = KEYS.reduce((sum, k) => sum + (stats[k] ?? 0), 0);
  const cell = "px-2 py-2 text-right tabular-nums";

  return (
    <Card title="Stat calculator" className="mt-4">
      <p className="mb-2 text-[13px] text-muted">Min = 0 IVs, 0 EVs, hindering nature · level is set at the top</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
              <th />
              {KEYS.map((k) => (
                <th key={k} className={`${cell} font-semibold`}>
                  {STAT_LABELS[k]}
                </th>
              ))}
              <th className={`${cell} font-semibold`}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#20242d]">
              <td className="px-2 py-2 text-muted">Base</td>
              {KEYS.map((k) => (
                <td key={k} className={cell}>
                  {stats[k]}
                </td>
              ))}
              <td className={`${cell} text-muted`}>{total}</td>
            </tr>
            <tr className="border-b border-[#20242d]">
              <td className="px-2 py-2 text-muted">Min · Lv {level}</td>
              {KEYS.map((k) => (
                <td key={k} className={`${cell} font-bold`}>
                  {minStat(k, stats[k], level)}
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
