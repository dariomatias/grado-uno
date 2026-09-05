import { useStore } from '../store.tsx';
import type { FretboardVM } from '../view-model.ts';

/**
 * Compact vertical fretboard window (design §7.2). Strings are columns (low E
 * at left, as if looking down at the neck); frets are rows. Emphasis is carried
 * by size/weight/fill as well as colour, and a note/interval toggle relabels
 * without moving positions.
 */
export function FretboardView({ fretboard }: { fretboard: FretboardVM }) {
  const { state, setLabelMode, shiftFretWindow, resetFretWindow } = useStore();
  const { window: win, positions, stringNames, stringCount } = fretboard;

  const byCell = new Map<string, (typeof positions)[number]>();
  for (const p of positions) byCell.set(`${p.stringIndex}-${p.fret}`, p);
  const frets = Array.from({ length: win.endFret - win.startFret + 1 }, (_, i) => win.startFret + i);

  return (
    <section aria-label="Fretboard" className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1" role="group" aria-label="Fret window">
          <button
            type="button"
            onClick={() => shiftFretWindow(-1)}
            disabled={win.startFret === 0}
            aria-label="Move window one fret lower"
            className="min-h-[2.25rem] min-w-[2.25rem] rounded-md border border-slate-300 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => shiftFretWindow(1)}
            aria-label="Move window one fret higher"
            className="min-h-[2.25rem] min-w-[2.25rem] rounded-md border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetFretWindow}
            className="min-h-[2.25rem] px-2 text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
          >
            Auto
          </button>
        </div>

        <div
          className="inline-flex rounded-lg border border-slate-300 p-0.5 text-xs dark:border-slate-700"
          role="group"
          aria-label="Label mode"
        >
          {(['notes', 'intervals'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={state.labelMode === mode}
              onClick={() => setLabelMode(mode)}
              className={[
                'min-h-[2rem] rounded-md px-2 capitalize',
                state.labelMode === mode
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300',
              ].join(' ')}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/*
        Horizontal orientation: frets run left→right, strings stack top→bottom
        with the high E on top and low E at the bottom (as read in tab). The nut
        is the thick wire at the left when the window starts at fret 0.
      */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `1.25rem repeat(${frets.length}, minmax(0, 1fr))` }}
      >
        {/* one row per string, from highest (top) to lowest (bottom) */}
        {Array.from({ length: stringCount }, (_, row) => {
          const stringIndex = stringCount - 1 - row;
          return (
            <div key={`string-${stringIndex}`} className="contents">
              <div className="flex h-9 items-center justify-center text-[0.65rem] text-slate-400">
                {stringNames[stringIndex]}
              </div>
              {frets.map((fret, col) => {
                const pos = byCell.get(`${stringIndex}-${fret}`);
                const nut = col === 0 && win.startFret === 0;
                return (
                  <div
                    key={`${stringIndex}-${fret}`}
                    className={[
                      'relative flex h-9 items-center justify-center',
                      'border-r border-slate-300 dark:border-slate-600',
                      nut
                        ? 'border-l-4 border-l-slate-400 dark:border-l-slate-500'
                        : '',
                    ].join(' ')}
                  >
                    {/* string line */}
                    <span
                      className="absolute inset-x-0 h-px bg-slate-300 dark:bg-slate-600"
                      aria-hidden="true"
                    />
                    {pos && <NoteDot label={pos.label} emphasis={pos.emphasis} />}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* fret-number row */}
        <div aria-hidden="true" />
        {frets.map((f) => (
          <div key={`num-${f}`} className="pt-1 text-center text-[0.65rem] tabular-nums text-slate-400">
            {f}
          </div>
        ))}
      </div>

      <p className="sr-only">{fretboard.textEquivalent}</p>
    </section>
  );
}

function NoteDot({ label, emphasis }: { label: string; emphasis: 'root' | 'chord' | 'scale' }) {
  const styles: Record<typeof emphasis, string> = {
    root: 'z-10 h-8 w-8 bg-slate-900 text-white ring-2 ring-amber-400 dark:bg-white dark:text-slate-900',
    chord: 'z-10 h-7 w-7 bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900',
    scale: 'h-5 w-5 border border-slate-300 bg-white text-[0.6rem] text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return (
    <span
      className={`relative flex items-center justify-center rounded-full text-[0.65rem] font-semibold ${styles[emphasis]}`}
    >
      {label}
    </span>
  );
}
