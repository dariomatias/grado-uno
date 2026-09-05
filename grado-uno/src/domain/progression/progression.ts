/**
 * Progression model and transition analysis (design §6.4, §9).
 *
 * A progression is stored as a *degree sequence* attached to a key, never as
 * rendered chord names — so changing key/mode/capo preserves the sequence and
 * recalculates everything. Transition analysis computes safe landing notes,
 * notes shared with the next chord, and the nearest diatonic movement from each
 * current chord tone, phrased as suggestions (`hold` / `move` / `try
 * resolving`) rather than correctness judgements.
 */

import type { Chord, Degree, Key, PitchSpelling } from '../music-core/index.ts';
import { buildDegrees, mod, noteNameAscii, pitchClass } from '../music-core/index.ts';

export const MIN_PLAYABLE = 2;
export const MAX_LENGTH = 8;

export type ToneRole = 'root' | 'third' | 'fifth';

export interface TargetNote {
  readonly spelling: PitchSpelling;
  readonly role: ToneRole;
  readonly description: string;
}

const ROLE_DESCRIPTION: Record<ToneRole, string> = {
  root: 'Strongest chord identity and stability.',
  third: 'Defines the major or minor quality.',
  fifth: 'Stable and comparatively neutral.',
};

/** Safe landing notes for a chord: root, third, fifth (design §6.4). */
export function targetNotes(chord: Chord): TargetNote[] {
  const roles: ToneRole[] = ['root', 'third', 'fifth'];
  return [chord.root, chord.third, chord.fifth].map((spelling, i) => ({
    spelling,
    role: roles[i]!,
    description: ROLE_DESCRIPTION[roles[i]!],
  }));
}

export type MovementKind = 'hold' | 'step' | 'leap';

export interface ToneMovement {
  readonly from: PitchSpelling;
  readonly to: PitchSpelling;
  /** Signed nearest semitone distance in (-6, 6]. */
  readonly semitones: number;
  readonly kind: MovementKind;
  /** True when the nearest move is a single semitone (high-value resolution). */
  readonly isSemitoneResolution: boolean;
  readonly suggestion: string;
}

export interface Transition {
  /** Pitch classes present in both chords. */
  readonly sharedPitchClasses: readonly number[];
  readonly sharedNotes: readonly PitchSpelling[];
  readonly movements: readonly ToneMovement[];
  readonly hasSemitoneResolution: boolean;
}

/** Signed nearest distance from one pitch class to another, in (-6, 6]. */
function nearestSigned(fromPc: number, toPc: number): number {
  const up = mod(toPc - fromPc, 12);
  return up > 6 ? up - 12 : up;
}

function suggestionFor(to: PitchSpelling, semis: number): string {
  const abs = Math.abs(semis);
  if (abs === 0) return 'Hold — this note is shared with the next chord.';
  const dir = semis > 0 ? 'up' : 'down';
  if (abs === 1) return `Try resolving ${dir} a semitone to ${noteNameAscii(to)}.`;
  if (abs === 2) return `Move a whole step ${dir} to ${noteNameAscii(to)}.`;
  return `Move to ${noteNameAscii(to)}.`;
}

/**
 * Analyse the move from `current` to `next`: shared notes and the nearest
 * movement from each current chord tone to a next-chord tone.
 */
export function analyzeTransition(current: Chord, next: Chord): Transition {
  const nextSet = new Set(next.notes.map(pitchClass));

  const sharedNotes = current.notes.filter((n) => nextSet.has(pitchClass(n)));
  const sharedPitchClasses = [...new Set(sharedNotes.map(pitchClass))];

  const movements: ToneMovement[] = current.notes.map((from) => {
    const fromPc = pitchClass(from);
    let best = next.notes[0]!;
    let bestSigned = nearestSigned(fromPc, pitchClass(best));
    for (const candidate of next.notes) {
      const signed = nearestSigned(fromPc, pitchClass(candidate));
      if (Math.abs(signed) < Math.abs(bestSigned)) {
        best = candidate;
        bestSigned = signed;
      }
    }
    const abs = Math.abs(bestSigned);
    const kind: MovementKind = abs === 0 ? 'hold' : abs <= 2 ? 'step' : 'leap';
    return {
      from,
      to: best,
      semitones: bestSigned,
      kind,
      isSemitoneResolution: abs === 1,
      suggestion: suggestionFor(best, bestSigned),
    };
  });

  return {
    sharedPitchClasses,
    sharedNotes,
    movements,
    hasSemitoneResolution: movements.some((m) => m.isSemitoneResolution),
  };
}

export interface ResolvedProgression {
  readonly key: Key;
  readonly degreeIndices: readonly number[];
  readonly degrees: readonly Degree[];
  readonly chords: readonly Chord[];
  /** Transition[i] describes moving from chord i to chord i+1. */
  readonly transitions: readonly Transition[];
}

/**
 * Resolve a degree sequence against a key into chords and transitions. Degree
 * indices are 0..6; out-of-range indices throw.
 */
export function resolveProgression(
  key: Key,
  degreeIndices: readonly number[],
): ResolvedProgression {
  const allDegrees = buildDegrees(key);
  const degrees = degreeIndices.map((i) => {
    const d = allDegrees[i];
    if (!d) throw new Error(`Degree index out of range: ${i}`);
    return d;
  });
  const chords = degrees.map((d) => d.chord);
  const transitions: Transition[] = [];
  for (let i = 0; i < chords.length - 1; i++) {
    transitions.push(analyzeTransition(chords[i]!, chords[i + 1]!));
  }
  return { key, degreeIndices, degrees, chords, transitions };
}

export function isPlayableLength(n: number): boolean {
  return n >= MIN_PLAYABLE && n <= MAX_LENGTH;
}

export function canAdd(n: number): boolean {
  return n < MAX_LENGTH;
}
