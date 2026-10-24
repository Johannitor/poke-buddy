/** Level shared by the move prediction and the stat calculator. */
export function LevelControl({ level, onLevel }: { level: number; onLevel: (lv: number) => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-panel px-4 py-3 text-[13px]">
      <label className="flex flex-1 items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
        Level
        <input
          type="range"
          min={1}
          max={100}
          value={level}
          onChange={(e) => onLevel(Number(e.target.value))}
          className="min-w-32 max-w-[420px] flex-1 cursor-pointer accent-accent"
        />
        <output className="min-w-7 text-base font-bold normal-case tracking-normal tabular-nums text-text">{level}</output>
      </label>
      <span className="text-muted">
        <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-accent align-middle" />
        moves it knows when met at this level (wild / gift)
      </span>
    </div>
  );
}
