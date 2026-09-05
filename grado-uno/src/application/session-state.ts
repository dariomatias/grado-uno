/**
 * Session state and reducer (design §4, §9, §10.1).
 *
 * Holds the current musical selection and the in-progress progression. Pure and
 * serializable — no React, storage, or audio. The UI dispatches actions; the
 * persistence and playback coordinators read the resulting state.
 */

import { clampCapo } from '../domain/capo/index.ts';
import type { Mode } from '../domain/music-core/index.ts';
import { supportedTonics } from '../domain/music-core/index.ts';
import { MAX_LENGTH, canAdd } from '../domain/progression/index.ts';

export type Notation = 'american' | 'latin';
export type LabelMode = 'notes' | 'intervals';
export type Theme = 'system' | 'light' | 'dark';

/** A progression entry references a degree index (0..6); id keeps list identity. */
export interface ProgressionItem {
  readonly id: string;
  readonly degreeIndex: number;
}

export interface SessionState {
  readonly tonic: string;
  readonly mode: Mode;
  readonly capo: number;
  /** Currently selected degree index for the detail area (0..6), or null. */
  readonly selectedDegree: number | null;
  readonly progression: readonly ProgressionItem[];
  readonly notation: Notation;
  readonly labelMode: LabelMode;
  readonly theme: Theme;
  readonly tempo: number;
  readonly muted: boolean;
  /** Fret window start; null means "auto-select from the current chord". */
  readonly windowStart: number | null;
}

export const DEFAULT_STATE: SessionState = {
  tonic: 'C',
  mode: 'major',
  capo: 0,
  selectedDegree: 0,
  progression: [],
  notation: 'american',
  labelMode: 'notes',
  theme: 'system',
  tempo: 72,
  muted: false,
  windowStart: null,
};

export const TEMPO_MIN = 40;
export const TEMPO_MAX = 180;

export function clampTempo(bpm: number): number {
  return Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, Math.round(bpm)));
}

export type Action =
  | { type: 'setTonic'; tonic: string }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setCapo'; capo: number }
  | { type: 'selectDegree'; index: number }
  | { type: 'addToProgression'; degreeIndex: number; id: string }
  | { type: 'removeItem'; id: string }
  | { type: 'duplicateItem'; id: string; newId: string }
  | { type: 'reorder'; from: number; to: number }
  | { type: 'clearProgression' }
  | { type: 'setNotation'; notation: Notation }
  | { type: 'setLabelMode'; labelMode: LabelMode }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'setTempo'; tempo: number }
  | { type: 'setMuted'; muted: boolean }
  | { type: 'setWindowStart'; windowStart: number | null }
  | { type: 'loadState'; state: SessionState };

function ensureValidTonic(mode: Mode, tonic: string): string {
  return supportedTonics(mode).includes(tonic) ? tonic : 'C';
}

function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) {
    return [...list];
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'setTonic':
      return { ...state, tonic: ensureValidTonic(state.mode, action.tonic), windowStart: null };
    case 'setMode': {
      // Preserve degree sequence; only re-validate the tonic for the new mode.
      return {
        ...state,
        mode: action.mode,
        tonic: ensureValidTonic(action.mode, state.tonic),
        windowStart: null,
      };
    }
    case 'setCapo':
      return { ...state, capo: clampCapo(action.capo) };
    case 'selectDegree':
      return { ...state, selectedDegree: action.index };
    case 'addToProgression':
      if (!canAdd(state.progression.length)) return state;
      return {
        ...state,
        progression: [
          ...state.progression,
          { id: action.id, degreeIndex: action.degreeIndex },
        ],
      };
    case 'removeItem':
      return {
        ...state,
        progression: state.progression.filter((i) => i.id !== action.id),
      };
    case 'duplicateItem': {
      const idx = state.progression.findIndex((i) => i.id === action.id);
      if (idx === -1 || !canAdd(state.progression.length)) return state;
      const source = state.progression[idx]!;
      const next = [...state.progression];
      next.splice(idx + 1, 0, { id: action.newId, degreeIndex: source.degreeIndex });
      return { ...state, progression: next };
    }
    case 'reorder':
      return { ...state, progression: moveItem(state.progression, action.from, action.to) };
    case 'clearProgression':
      return { ...state, progression: [] };
    case 'setNotation':
      return { ...state, notation: action.notation };
    case 'setLabelMode':
      return { ...state, labelMode: action.labelMode };
    case 'setTheme':
      return { ...state, theme: action.theme };
    case 'setTempo':
      return { ...state, tempo: clampTempo(action.tempo) };
    case 'setMuted':
      return { ...state, muted: action.muted };
    case 'setWindowStart':
      return {
        ...state,
        windowStart:
          action.windowStart === null ? null : Math.max(0, action.windowStart),
      };
    case 'loadState':
      return normalizeState(action.state);
    default:
      return state;
  }
}

/** Coerce a possibly-partial/foreign state into a valid SessionState. */
export function normalizeState(input: Partial<SessionState> | undefined): SessionState {
  const mode: Mode = input?.mode === 'minor' ? 'minor' : 'major';
  const progression = Array.isArray(input?.progression)
    ? input!.progression
        .filter(
          (i): i is ProgressionItem =>
            !!i &&
            typeof i.id === 'string' &&
            Number.isInteger(i.degreeIndex) &&
            i.degreeIndex >= 0 &&
            i.degreeIndex <= 6,
        )
        .slice(0, MAX_LENGTH)
    : [];
  return {
    ...DEFAULT_STATE,
    ...input,
    mode,
    tonic: ensureValidTonic(mode, input?.tonic ?? DEFAULT_STATE.tonic),
    capo: clampCapo(input?.capo ?? DEFAULT_STATE.capo),
    tempo: clampTempo(input?.tempo ?? DEFAULT_STATE.tempo),
    progression,
  };
}
