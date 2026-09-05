/**
 * Chromatic transposition of a spelling by a known interval.
 *
 * Both a semitone count and a diatonic letter-step count are supplied so the
 * result keeps a sensible spelling. Transposing by a full octave (12 semitones,
 * 7 letter steps) returns an identical spelling — a required invariant
 * (design §13.1).
 */

import type { PitchSpelling } from './pitch.ts';
import { letterFromSteps, pitchClass, spellWithLetter } from './pitch.ts';

export function transposeSpelling(
  spelling: PitchSpelling,
  semitones: number,
  letterSteps: number,
): PitchSpelling {
  const letter = letterFromSteps(spelling.letter, letterSteps);
  const targetPc = (pitchClass(spelling) + ((semitones % 12) + 12) % 12) % 12;
  return spellWithLetter(letter, targetPc);
}
