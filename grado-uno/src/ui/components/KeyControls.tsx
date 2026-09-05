import { supportedTonics, type Mode } from '../../domain/music-core/index.ts';
import { CAPO_MAX } from '../../domain/capo/index.ts';
import { useStore } from '../store.tsx';

/** Key, mode, and capo selectors (design §5, §8). */
export function KeyControls() {
  const { state, setTonic, setMode, setCapo } = useStore();
  const tonics = supportedTonics(state.mode);

  return (
    <section aria-label="Key, mode, and capo" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Key</span>
        <select
          value={state.tonic}
          onChange={(e) => setTonic(e.target.value)}
          className="min-h-[2.75rem] rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-900"
        >
          {tonics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mode</span>
        <select
          value={state.mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="min-h-[2.75rem] rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Capo</span>
        <select
          value={state.capo}
          onChange={(e) => setCapo(Number(e.target.value))}
          className="min-h-[2.75rem] rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-900"
        >
          {Array.from({ length: CAPO_MAX + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? 'None' : `Fret ${i}`}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
