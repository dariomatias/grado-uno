/**
 * Pitch spelling primitives.
 *
 * A pitch class is an integer 0..11 (C = 0). A {@link PitchSpelling} pairs a
 * pitch class with a *written* name (letter + accidental) so that the same
 * sounding note can be spelled correctly for a given key — e.g. pitch class 6
 * is `F#` in G major but `Gb` in Db major. The engine must never mix enharmonic
 * systems inside one key (design §5.2).
 */

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** Accidental as a signed semitone offset from the natural letter. */
export type Accidental = number; // -2 = double flat … 0 = natural … +2 = double sharp

export interface PitchSpelling {
  readonly letter: Letter;
  readonly accidental: Accidental;
}

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Semitone position of each natural letter within an octave (C = 0). */
const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** True Euclidean modulo (result always in [0, n)). */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** The pitch class (0..11) a spelling sounds as. */
export function pitchClass(spelling: PitchSpelling): number {
  return mod(LETTER_SEMITONES[spelling.letter] + spelling.accidental, 12);
}

/** Advance a letter by `steps` diatonic steps (wrapping A→B→C). */
export function letterFromSteps(start: Letter, steps: number): Letter {
  const idx = mod(LETTERS.indexOf(start) + steps, LETTERS.length);
  return LETTERS[idx]!;
}

/**
 * Spell a note whose sounding pitch class is `targetPitchClass` using a chosen
 * `letter`, picking the accidental in the range [-6, 6] that reaches it. For
 * the letters produced by diatonic scale construction this always yields a
 * single (or no) accidental; double accidentals only appear for deliberately
 * chosen exotic references, which the MVP key set avoids.
 */
export function spellWithLetter(
  letter: Letter,
  targetPitchClass: number,
): PitchSpelling {
  const natural = LETTER_SEMITONES[letter];
  // Signed difference normalised to (-6, 6].
  const accidental = mod(targetPitchClass - natural + 6, 12) - 6;
  return { letter, accidental };
}

const ACCIDENTAL_GLYPHS: Record<number, string> = {
  [-2]: '𝄫',
  [-1]: '♭',
  [0]: '',
  [1]: '♯',
  [2]: '𝄪',
};

/** ASCII accidental marks used in chord symbols (`F#`, `Bb`). */
const ACCIDENTAL_ASCII: Record<number, string> = {
  [-2]: 'bb',
  [-1]: 'b',
  [0]: '',
  [1]: '#',
  [2]: '##',
};

function accidentalString(
  accidental: Accidental,
  table: Record<number, string>,
): string {
  const glyph = table[accidental];
  if (glyph !== undefined) return glyph;
  // Fallback for out-of-table accidentals.
  const sign = accidental < 0 ? 'b' : '#';
  return sign.repeat(Math.abs(accidental));
}

/** ASCII note name for chord symbols, e.g. `F#`, `Bb`, `C`. */
export function noteNameAscii(spelling: PitchSpelling): string {
  return spelling.letter + accidentalString(spelling.accidental, ACCIDENTAL_ASCII);
}

/** Display note name using proper accidental glyphs, e.g. `F♯`, `B♭`. */
export function noteNameDisplay(spelling: PitchSpelling): string {
  return spelling.letter + accidentalString(spelling.accidental, ACCIDENTAL_GLYPHS);
}

/** Two spellings that sound the same pitch class. */
export function isEnharmonic(a: PitchSpelling, b: PitchSpelling): boolean {
  return pitchClass(a) === pitchClass(b);
}
