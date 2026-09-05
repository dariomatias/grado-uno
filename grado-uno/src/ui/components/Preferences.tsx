import { useStore } from '../store.tsx';
import type { Theme } from '../../application/index.ts';

/** Preferences sheet: theme, favorites, and destructive resets (§10.3). */
export function Preferences({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const { state, favorites } = store;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Preferences"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md space-y-5 overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preferences"
            className="min-h-[2.75rem] min-w-[2.75rem] rounded-lg text-slate-500"
          >
            ✕
          </button>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</legend>
          <div className="mt-1 inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
            {(['system', 'light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={state.theme === t}
                onClick={() => store.setTheme(t)}
                className={[
                  'min-h-[2.5rem] rounded-md px-3 text-sm capitalize',
                  state.theme === t
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <section aria-label="Saved favorites" className="space-y-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Favorites ({favorites.length})
          </div>
          {favorites.length === 0 ? (
            <p className="text-sm text-slate-400">No saved progressions yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {favorites.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => {
                      store.loadFavorite(f.id);
                      onClose();
                    }}
                    className="min-h-[2.25rem] flex-1 text-left"
                  >
                    <span className="block text-sm font-medium">{f.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {f.tonic} {f.mode}
                      {f.capo > 0 ? ` · capo ${f.capo}` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${f.name}`}
                    onClick={() => store.deleteFavorite(f.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-rose-600 dark:text-rose-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => store.resetPreferences()}
            className="min-h-[2.75rem] w-full rounded-lg border border-slate-300 text-sm dark:border-slate-700"
          >
            Reset preferences (keeps favorites)
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete all saved favorites? This cannot be undone.')) {
                store.deleteAllFavorites();
              }
            }}
            disabled={favorites.length === 0}
            className="min-h-[2.75rem] w-full rounded-lg text-sm text-rose-600 disabled:opacity-40 dark:text-rose-400"
          >
            Delete all favorites
          </button>
        </section>

        {!store.storageAvailable && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Storage is unavailable — changes last only for this session.
          </p>
        )}
      </div>
    </div>
  );
}
