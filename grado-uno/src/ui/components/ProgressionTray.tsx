import { useState } from 'react';
import { isPlayableLength } from '../../domain/progression/index.ts';
import { TEMPO_MAX, TEMPO_MIN } from '../../application/index.ts';
import { useStore } from '../store.tsx';
import { FAMILY_STYLE } from '../family-styles.ts';

/** Collapsible progression tray + editor, playback, tips, favorites (§9). */
export function ProgressionTray() {
  const store = useStore();
  const { vm, activeIndex } = store;
  const slots = vm.progression.slots;
  const [expanded, setExpanded] = useState(true);
  const [favName, setFavName] = useState('');

  if (slots.length === 0) return null;

  const romanSummary = slots.map((s) => s.roman).join(' → ');
  const playable = isPlayableLength(slots.length);

  const clear = () => {
    if (slots.length > 1 && !window.confirm('Clear the whole progression?')) return;
    store.clearProgression();
  };

  const saveFavorite = () => {
    if (!playable) return;
    store.saveFavorite(favName);
    setFavName('');
  };

  return (
    <section
      aria-label="Progression"
      className="rounded-t-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Progression</div>
          <div className="truncate text-sm font-semibold tabular-nums">{romanSummary}</div>
        </div>
        <span className="text-slate-400" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <ol className="space-y-1.5">
            {slots.map((slot, i) => {
              const style = FAMILY_STYLE[slot.family];
              const active = activeIndex === i;
              return (
                <li
                  key={slot.id}
                  aria-current={active ? 'true' : undefined}
                  className={[
                    'flex items-center gap-2 rounded-lg border px-2 py-1.5',
                    active
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                      : `${style.border} ${style.softBg}`,
                  ].join(' ')}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <span className="w-10 text-sm font-semibold tabular-nums">{slot.roman}</span>
                  <span className="flex-1 text-sm">
                    {slot.symbol}
                    {vm.progression.capoActive && (
                      <span className="ml-1 text-xs text-slate-400">→ {slot.shape.symbol}</span>
                    )}
                  </span>
                  <SlotButton label="Move up" disabled={i === 0} onClick={() => store.reorder(i, i - 1)}>↑</SlotButton>
                  <SlotButton label="Move down" disabled={i === slots.length - 1} onClick={() => store.reorder(i, i + 1)}>↓</SlotButton>
                  <SlotButton label="Duplicate" onClick={() => store.duplicateItem(slot.id)}>⧉</SlotButton>
                  <SlotButton label="Delete" onClick={() => store.removeItem(slot.id)}>✕</SlotButton>
                </li>
              );
            })}
          </ol>

          {!playable && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add at least two chords to play, save, and see transition tips.
            </p>
          )}

          <PlaybackControls />

          {vm.progression.tips.length > 0 && playable && (
            <ul className="space-y-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              {vm.progression.tips.map((tip, i) => (
                <li key={i}>• {tip.text}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={favName}
              onChange={(e) => setFavName(e.target.value)}
              placeholder="Name this progression"
              aria-label="Favorite name"
              className="min-h-[2.75rem] flex-1 rounded-lg border border-slate-300 px-3 text-base dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              onClick={saveFavorite}
              disabled={!playable}
              className="min-h-[2.75rem] rounded-lg border border-slate-300 px-3 text-sm font-medium disabled:opacity-40 dark:border-slate-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={clear}
              className="min-h-[2.75rem] rounded-lg px-3 text-sm text-rose-600 dark:text-rose-400"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div className="mt-2">
          <PlayButton compact />
        </div>
      )}
    </section>
  );
}

function SlotButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function PlaybackControls() {
  const { state, setTempo, toggleMute, audioError } = useStore();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <PlayButton />
        <button
          type="button"
          aria-pressed={state.muted}
          onClick={toggleMute}
          className="min-h-[2.75rem] min-w-[2.75rem] rounded-lg border border-slate-300 text-sm dark:border-slate-700"
          aria-label={state.muted ? 'Unmute' : 'Mute'}
        >
          {state.muted ? '🔇' : '🔊'}
        </button>
        <label className="flex flex-1 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="tabular-nums">{state.tempo} BPM</span>
          <input
            type="range"
            min={TEMPO_MIN}
            max={TEMPO_MAX}
            value={state.tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            aria-label="Tempo"
            className="flex-1"
          />
        </label>
      </div>
      {audioError && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Audio is unavailable — visual playback continues. Tap play to retry.
        </p>
      )}
    </div>
  );
}

function PlayButton({ compact = false }: { compact?: boolean }) {
  const { isPlaying, play, pause, vm } = useStore();
  const playable = isPlayableLength(vm.progression.slots.length);
  return (
    <button
      type="button"
      onClick={() => (isPlaying ? pause() : play())}
      disabled={!playable}
      className={[
        'min-h-[2.75rem] rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900',
        compact ? 'w-full' : '',
      ].join(' ')}
    >
      {isPlaying ? '⏸ Pause' : '▶ Play'}
    </button>
  );
}
