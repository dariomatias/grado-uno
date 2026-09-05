/**
 * Diatonic scale construction with correct enharmonic spelling.
 *
 * A scale is built by assigning consecutive letters to the seven degrees and
 * choosing each accidental so the sounding pitch class matches the mode's
 * interval pattern. Because every degree gets the next letter, spellings never
 * mix enharmonic systems within a key (design §6.1, §5.2).
 */

import type { Mode } from './keys.ts';
import type { PitchSpelling } from './pitch.ts';
import { letterFromSteps, pitchClass, spellWithLetter } from './pitch.ts';

/** Semitone offsets of each scale degree from the tonic. */
export const SCALE_PATTERNS: Record<Mode, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

/**
 * Build the seven diatonic pitch spellings of a scale, index 0 = tonic.
 */
export function buildScale(tonic: PitchSpelling, mode: Mode): PitchSpelling[] {
  const pattern = SCALE_PATTERNS[mode];
  const tonicPc = pitchClass(tonic);
  return pattern.map((offset, degreeIndex) => {
    const letter = letterFromSteps(tonic.letter, degreeIndex);
    const targetPc = (tonicPc + offset) % 12;
    return spellWithLetter(letter, targetPc);
  });
}
