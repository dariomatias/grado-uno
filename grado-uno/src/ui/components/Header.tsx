/** Compact app header with the preferences entry point (design §5). */
export function Header({ onOpenPreferences }: { onOpenPreferences: () => void }) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Grado Uno</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Key, degrees, and safe notes
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenPreferences}
        aria-label="Open preferences"
        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-300 text-lg dark:border-slate-700"
      >
        ⚙
      </button>
    </header>
  );
}
