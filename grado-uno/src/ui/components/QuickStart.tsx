import { WORSHIP_TEMPLATES } from '../../domain/worship-tips/index.ts';
import { useStore } from '../store.tsx';

/** Worship-template shortcuts, shown when the progression is empty (§7.3). */
export function QuickStart() {
  const { vm, loadTemplate } = useStore();
  if (vm.progression.slots.length > 0) return null;

  return (
    <section aria-label="Quick-start progressions" className="space-y-1.5">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Start with a common progression
      </div>
      <div className="flex flex-wrap gap-2">
        {WORSHIP_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => loadTemplate(t.degreeIndices)}
            className="min-h-[2.75rem] rounded-lg border border-slate-300 px-3 text-left text-sm dark:border-slate-700"
          >
            <span className="block font-semibold tabular-nums">{t.roman}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{t.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
