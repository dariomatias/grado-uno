import { noteNameDisplay } from '../../domain/music-core/index.ts';
import { canAdd } from '../../domain/progression/index.ts';
import { useStore } from '../store.tsx';
import { FAMILY_STYLE } from '../family-styles.ts';
import { FretboardView } from './FretboardView.tsx';

/** Detail area for the selected degree (design §5.1). */
export function DegreeDetail() {
  const { vm, state, addSelectedToProgression } = useStore();
  const detail = vm.detail;
  if (!detail) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tap a degree above to explore it.
      </p>
    );
  }

  const style = FAMILY_STYLE[detail.family];
  const full = !canAdd(state.progression.length);

  return (
    <section aria-label="Selected degree detail" className="space-y-3" aria-live="polite">
      <div className={`rounded-xl border p-3 ${style.border} ${style.softBg}`}>
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{detail.degree.roman}</span>
              <span className="text-2xl font-semibold">{detail.symbol}</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">{detail.latinName}</div>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${style.softText}`}>
            {style.label} · {detail.degree.function.technical}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {detail.degree.function.summary}
        </p>

        {state.capo > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Capo {state.capo}: play a{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {detail.shape.symbol}
            </span>{' '}
            shape.
          </p>
        )}

        <div className="mt-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Safe notes
          </div>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {detail.targets.map((t) => (
              <li
                key={t.role}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                title={t.description}
              >
                <span className="font-semibold">{noteNameDisplay(t.spelling)}</span>
                <span className="ml-1 text-xs text-slate-400 capitalize">{t.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <FretboardView fretboard={detail.fretboard} />

      <button
        type="button"
        onClick={addSelectedToProgression}
        disabled={full}
        className="min-h-[2.75rem] w-full rounded-lg bg-slate-900 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900"
      >
        {full ? 'Progression full (8 max)' : `Add ${detail.symbol} to progression`}
      </button>
    </section>
  );
}
