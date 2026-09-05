import { useStore } from '../store.tsx';
import { FAMILY_STYLE } from '../family-styles.ts';

/** Horizontally-scrollable row of the seven degree cards (design §5). */
export function DegreeCards() {
  const { vm, state, selectDegree } = useStore();

  return (
    <section aria-label="Scale degrees">
      <div
        className="grid grid-cols-7 gap-1"
        role="listbox"
        aria-label="Degrees"
      >
        {vm.cards.map((card) => {
          const selected = state.selectedDegree === card.index;
          const style = FAMILY_STYLE[card.family];
          return (
            <button
              key={card.index}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => selectDegree(card.index)}
              className={[
                'min-h-[3.5rem] rounded-lg border px-0.5 py-1.5',
                'flex flex-col items-center justify-center gap-0.5 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 dark:ring-offset-slate-950',
                selected
                  ? style.selected
                  : `bg-white dark:bg-slate-900 ${style.border} text-slate-900 dark:text-slate-100`,
              ].join(' ')}
            >
              <span className="text-sm font-semibold leading-none tabular-nums">
                {card.roman}
              </span>
              <span className="text-[0.7rem] leading-none opacity-90">{card.symbol}</span>
              {!selected && (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${style.dot}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
