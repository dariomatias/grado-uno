/**
 * Capo model (design §8).
 *
 * The concert (sounding) chords come from the key; the capo separates *what
 * sounds* from *what shape the guitarist fingers*. A shape is the sounding
 * chord transposed DOWN by the capo interval. Scale degrees stay attached to
 * the concert key and never change with the capo.
 *
 * Shape spellings are chosen from a guitar-friendly preferred table rather than
 * the concert key's enharmonic system — the point of a capo is to finger
 * familiar open shapes, so `B major, capo 4` fingers a `G` shape.
 */

import type { Chord } from '../music-core/index.ts';
import { mod, pitchClass, type ChordQuality } from '../music-core/index.ts';

export const CAPO_MIN = 0;
export const CAPO_MAX = 12;

/** Preferred guitar-shape note name for each pitch class (C = 0). */
const SHAPE_NAMES: readonly string[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

function qualitySuffix(quality: ChordQuality): string {
  switch (quality) {
    case 'minor':
      return 'm';
    case 'diminished':
      return 'dim';
    case 'augmented':
      return 'aug';
    default:
      return '';
  }
}

export interface Shape {
  /** Pitch class of the fingered shape root. */
  readonly rootPitchClass: number;
  readonly quality: ChordQuality;
  /** Guitar-friendly shape symbol, e.g. `G`, `Em`, `C`. */
  readonly symbol: string;
}

export function clampCapo(capo: number): number {
  return Math.max(CAPO_MIN, Math.min(CAPO_MAX, Math.round(capo)));
}

/**
 * The shape fingered for a sounding chord at a given capo fret. With capo 0 the
 * shape's pitch class equals the sounding root.
 */
export function shapeForChord(sounding: Chord, capo: number): Shape {
  const c = clampCapo(capo);
  const rootPitchClass = mod(pitchClass(sounding.root) - c, 12);
  return {
    rootPitchClass,
    quality: sounding.quality,
    symbol: SHAPE_NAMES[rootPitchClass]! + qualitySuffix(sounding.quality),
  };
}

/** Shapes for a whole progression of sounding chords. */
export function shapesForChords(sounding: readonly Chord[], capo: number): Shape[] {
  return sounding.map((chord) => shapeForChord(chord, capo));
}
