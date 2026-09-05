/**
 * React store: binds the pure application layer to React and the infrastructure
 * adapters. Owns session state (useReducer), favorites, the persistence store,
 * and a single PlaybackCoordinator wired to the Web Audio adapter.
 *
 * Components read the derived view model and call intent-named actions; they
 * never touch the reducer's action shapes, storage, or audio directly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { pitchClass, type Mode } from '../domain/music-core/index.ts';
import {
  DEFAULT_STATE,
  PlaybackCoordinator,
  reducer,
  realTimer,
  type Action,
  type Favorite,
  type LabelMode,
  type Notation,
  type SessionState,
  type Theme,
  deleteAllFavorites as persistDeleteAllFavorites,
  loadFavorites,
  loadSession,
  resetPreferences as persistResetPreferences,
  saveFavorites,
  saveSession,
} from '../application/index.ts';
import { createLocalStorageStore } from '../infrastructure/local-storage/index.ts';
import { WebAudioAdapter } from '../infrastructure/web-audio/index.ts';
import { buildViewModel, type GradoUnoVM } from './view-model.ts';

let idCounter = 0;
function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  idCounter += 1;
  return `id-${idCounter}`;
}

export interface StoreValue {
  readonly state: SessionState;
  readonly vm: GradoUnoVM;
  readonly favorites: readonly Favorite[];
  readonly activeIndex: number | null;
  readonly isPlaying: boolean;
  readonly storageAvailable: boolean;
  readonly audioError: boolean;
  // selection & musical controls
  setTonic(tonic: string): void;
  setMode(mode: Mode): void;
  setCapo(capo: number): void;
  selectDegree(index: number): void;
  setNotation(n: Notation): void;
  setLabelMode(m: LabelMode): void;
  setTheme(t: Theme): void;
  shiftFretWindow(delta: number): void;
  resetFretWindow(): void;
  // progression
  addSelectedToProgression(): void;
  addDegreeToProgression(degreeIndex: number): void;
  removeItem(id: string): void;
  duplicateItem(id: string): void;
  reorder(from: number, to: number): void;
  clearProgression(): void;
  loadTemplate(degreeIndices: readonly number[]): void;
  // playback
  setTempo(bpm: number): void;
  toggleMute(): void;
  play(): void;
  pause(): void;
  // favorites & preferences
  saveFavorite(name: string): void;
  loadFavorite(id: string): void;
  deleteFavorite(id: string): void;
  deleteAllFavorites(): void;
  resetPreferences(): void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(createLocalStorageStore());
  const audioRef = useRef<WebAudioAdapter | null>(null);
  const coordRef = useRef<PlaybackCoordinator | null>(null);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => loadSession(storeRef.current),
  );
  const [favorites, setFavorites] = useState<readonly Favorite[]>(() =>
    loadFavorites(storeRef.current),
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const vm = useMemo(() => buildViewModel(state), [state]);

  // Keep a ref to the latest resolved chords so the coordinator can look up
  // chord pitch classes at tick time without stale closures.
  const chordsRef = useRef(vm.progression.resolved.chords);
  chordsRef.current = vm.progression.resolved.chords;
  const progressionRef = useRef(state.progression);
  progressionRef.current = state.progression;

  // Lazily create audio + coordinator once.
  if (!coordRef.current) {
    audioRef.current = new WebAudioAdapter();
    coordRef.current = new PlaybackCoordinator({
      audio: audioRef.current,
      timer: realTimer,
      getChordPitchClasses: (i) => {
        const chord = chordsRef.current[i];
        return chord ? chord.notes.map(pitchClass) : null;
      },
      onActiveIndexChange: (i) => {
        setActiveIndex(i);
        if (i !== null) {
          const item = progressionRef.current[i];
          if (item) dispatch({ type: 'selectDegree', index: item.degreeIndex });
        }
      },
    });
  }

  // Persist session on change.
  useEffect(() => {
    saveSession(storeRef.current, state);
  }, [state]);

  // Keep the coordinator configured with current tempo/length/mute.
  useEffect(() => {
    coordRef.current?.configure({
      tempo: state.tempo,
      length: state.progression.length,
      loop: true,
      muted: state.muted,
    });
  }, [state.tempo, state.progression.length, state.muted]);

  // Apply theme to the document root.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark =
        state.theme === 'dark' ||
        (state.theme === 'system' &&
          window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply();
    if (state.theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    return undefined;
  }, [state.theme]);

  const act = useCallback((a: Action) => dispatch(a), []);

  const play = useCallback(() => {
    void (async () => {
      setAudioError(false);
      const ok = await coordRef.current?.play();
      if (ok) {
        setIsPlaying(true);
        if (coordRef.current && coordRef.current.audioState === 'unavailable') {
          setAudioError(true);
        }
      }
    })();
  }, []);

  const pause = useCallback(() => {
    coordRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const value: StoreValue = useMemo(() => {
    const currentWindowStart = vm.detail?.fretboard.window.startFret ?? 0;
    return {
      state,
      vm,
      favorites,
      activeIndex,
      isPlaying,
      storageAvailable: storeRef.current.available,
      audioError,
      setTonic: (tonic) => act({ type: 'setTonic', tonic }),
      setMode: (mode) => act({ type: 'setMode', mode }),
      setCapo: (capo) => act({ type: 'setCapo', capo }),
      selectDegree: (index) => act({ type: 'selectDegree', index }),
      setNotation: (notation) => act({ type: 'setNotation', notation }),
      setLabelMode: (labelMode) => act({ type: 'setLabelMode', labelMode }),
      setTheme: (theme) => act({ type: 'setTheme', theme }),
      shiftFretWindow: (delta) =>
        act({ type: 'setWindowStart', windowStart: Math.max(0, currentWindowStart + delta) }),
      resetFretWindow: () => act({ type: 'setWindowStart', windowStart: null }),
      addSelectedToProgression: () => {
        if (state.selectedDegree !== null) {
          act({ type: 'addToProgression', degreeIndex: state.selectedDegree, id: newId() });
        }
      },
      addDegreeToProgression: (degreeIndex) =>
        act({ type: 'addToProgression', degreeIndex, id: newId() }),
      removeItem: (id) => act({ type: 'removeItem', id }),
      duplicateItem: (id) => act({ type: 'duplicateItem', id, newId: newId() }),
      reorder: (from, to) => act({ type: 'reorder', from, to }),
      clearProgression: () => act({ type: 'clearProgression' }),
      loadTemplate: (degreeIndices) => {
        act({ type: 'clearProgression' });
        for (const degreeIndex of degreeIndices) {
          act({ type: 'addToProgression', degreeIndex, id: newId() });
        }
      },
      setTempo: (bpm) => act({ type: 'setTempo', tempo: bpm }),
      toggleMute: () => act({ type: 'setMuted', muted: !state.muted }),
      play,
      pause,
      saveFavorite: (name) => {
        const fav: Favorite = {
          id: newId(),
          name: name.trim() || 'Untitled',
          tonic: state.tonic,
          mode: state.mode,
          capo: state.capo,
          degreeIndices: state.progression.map((i) => i.degreeIndex),
          schemaVersion: 1,
        };
        setFavorites((prev) => {
          const next = [...prev, fav];
          saveFavorites(storeRef.current, next);
          return next;
        });
      },
      loadFavorite: (id) => {
        const fav = favorites.find((f) => f.id === id);
        if (!fav) return;
        const next: SessionState = {
          ...state,
          tonic: fav.tonic,
          mode: fav.mode,
          capo: fav.capo,
          selectedDegree: fav.degreeIndices[0] ?? 0,
          progression: fav.degreeIndices.map((degreeIndex) => ({
            id: newId(),
            degreeIndex,
          })),
          windowStart: null,
        };
        act({ type: 'loadState', state: next });
      },
      deleteFavorite: (id) =>
        setFavorites((prev) => {
          const next = prev.filter((f) => f.id !== id);
          saveFavorites(storeRef.current, next);
          return next;
        }),
      deleteAllFavorites: () => {
        persistDeleteAllFavorites(storeRef.current);
        setFavorites([]);
      },
      resetPreferences: () => {
        const fresh = persistResetPreferences(storeRef.current);
        act({ type: 'loadState', state: { ...fresh } });
      },
    };
  }, [state, vm, favorites, activeIndex, isPlaying, audioError, act, play, pause]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}

export { DEFAULT_STATE };
