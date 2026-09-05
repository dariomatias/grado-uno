/**
 * Fretboard engine (design §7).
 *
 * Independent of the music-theory engine: it receives a tuning, a visible fret
 * range, the scale's pitch classes, and the selected chord's pitch classes, and
 * returns display-ready note positions. It knows nothing about keys or how the
 * pitch classes were derived. Note-name *spelling* is supplied by the caller as
 * a pitch-class → name map so the view can label without re-deriving theory.
 */

import { intervalLabel, mod } from '../music-core/index.ts';

/** A tuning is the open-string pitch class of each string, low to high. */
export interface Tuning {
  readonly name: string;
  /** index 0 = lowest-pitched string (e.g. low E). */
  readonly openPitchClasses: readonly number[];
  /** Human labels for each string, low to high. */
  readonly stringNames: readonly string[];
}

/** Standard six-string guitar tuning E2 A2 D3 G3 B3 E4. */
export const STANDARD_TUNING: Tuning = {
  name: 'Standard',
  openPitchClasses: [4, 9, 2, 7, 11, 4], // E A D G B E
  stringNames: ['E', 'A', 'D', 'G', 'B', 'E'],
};

export type Emphasis = 'root' | 'chord' | 'scale';

export interface NotePosition {
  /** 0 = lowest string. */
  readonly stringIndex: number;
  readonly fret: number;
  readonly pitchClass: number;
  readonly isRoot: boolean;
  readonly isChordTone: boolean;
  readonly emphasis: Emphasis;
  /** Semitones above the chord root (0..11) — used for interval labels. */
  readonly semitonesFromRoot: number;
}

export interface FretWindow {
  readonly startFret: number;
  readonly endFret: number;
}

export interface FretboardInput {
  readonly tuning: Tuning;
  readonly window: FretWindow;
  readonly scalePitchClasses: readonly number[];
  readonly chordPitchClasses: readonly number[];
  readonly rootPitchClass: number;
}

export function pitchClassAt(tuning: Tuning, stringIndex: number, fret: number): number {
  return mod(tuning.openPitchClasses[stringIndex]! + fret, 12);
}

/**
 * All scale-note positions inside the window, each flagged with chord/root
 * membership and emphasis. Non-scale frets are omitted.
 */
export function buildFretboard(input: FretboardInput): NotePosition[] {
  const { tuning, window, scalePitchClasses, chordPitchClasses, rootPitchClass } = input;
  const scale = new Set(scalePitchClasses);
  const chord = new Set(chordPitchClasses);
  const positions: NotePosition[] = [];

  for (let stringIndex = 0; stringIndex < tuning.openPitchClasses.length; stringIndex++) {
    for (let fret = window.startFret; fret <= window.endFret; fret++) {
      const pc = pitchClassAt(tuning, stringIndex, fret);
      if (!scale.has(pc)) continue;
      const isChordTone = chord.has(pc);
      const isRoot = pc === rootPitchClass;
      positions.push({
        stringIndex,
        fret,
        pitchClass: pc,
        isRoot,
        isChordTone,
        emphasis: isRoot ? 'root' : isChordTone ? 'chord' : 'scale',
        semitonesFromRoot: mod(pc - rootPitchClass, 12),
      });
    }
  }
  return positions;
}

export const DEFAULT_WINDOW_SIZE = 5;

/**
 * Choose an initial compact window (design §7.2). Prefers a first fret in
 * 0..7 that places the tonic on one of the lower/middle strings and maximises
 * usable chord tones on the top strings, preferring lower windows on ties.
 */
export function chooseWindow(
  tuning: Tuning,
  rootPitchClass: number,
  chordPitchClasses: readonly number[],
  size: number = DEFAULT_WINDOW_SIZE,
): FretWindow {
  const chord = new Set(chordPitchClasses);
  const topStrings = [tuning.openPitchClasses.length - 2, tuning.openPitchClasses.length - 1];
  let best: { start: number; score: number } | null = null;

  for (let start = 0; start <= 7; start++) {
    const end = start + size - 1;
    let score = 0;
    let tonicOnLowerString = false;
    let tonicPresent = false;

    for (let s = 0; s < tuning.openPitchClasses.length; s++) {
      for (let fret = start; fret <= end; fret++) {
        const pc = pitchClassAt(tuning, s, fret);
        if (pc === rootPitchClass) {
          tonicPresent = true;
          if (s <= 3) tonicOnLowerString = true;
        }
        if (chord.has(pc) && topStrings.includes(s)) score += 1;
      }
    }
    if (tonicPresent) score += 3;
    if (tonicOnLowerString) score += 2;
    // Prefer lower windows on ties via a tiny start penalty.
    score -= start * 0.01;

    if (best === null || score > best.score) {
      best = { start, score };
    }
  }

  const startFret = best?.start ?? 0;
  return { startFret, endFret: startFret + size - 1 };
}

/** Shift a window one fret, clamped so it never goes below fret 0. */
export function shiftWindow(window: FretWindow, delta: number): FretWindow {
  const size = window.endFret - window.startFret;
  const startFret = Math.max(0, window.startFret + delta);
  return { startFret, endFret: startFret + size };
}

/** Concise textual equivalent for accessibility (design §12). */
export function fretboardTextEquivalent(
  input: FretboardInput,
  chordToneNames: readonly string[],
  labelMode: 'notes' | 'intervals',
): string {
  const { window } = input;
  const tones =
    labelMode === 'intervals'
      ? input.chordPitchClasses.map((pc) =>
          intervalLabel(mod(pc - input.rootPitchClass, 12)),
        )
      : chordToneNames;
  return `Chord tones ${tones.join(', ')}. Frets ${window.startFret} to ${window.endFret}.`;
}
