/**
 * Scale degrees: Roman numerals, harmonic-function copy, notation, and the
 * assembled per-degree view of a key.
 *
 * Harmonic-function copy is plain-language and describes *tendencies*, not hard
 * rules (design §6.3). American chord symbols are primary; Latin (fixed-Do,
 * Spanish) names are the secondary notation (§5.2).
 */

import type { Chord } from './chords.ts';
import { buildDiatonicTriads } from './chords.ts';
import type { Key, Mode } from './keys.ts';
import type { ChordQuality } from './intervals.ts';
import type { PitchSpelling } from './pitch.ts';
import { noteNameAscii, noteNameDisplay } from './pitch.ts';
import { buildScale } from './scales.ts';

const ROMAN_BASE = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/** Roman numeral honouring quality case and diminished mark. */
export function romanNumeral(degreeIndex: number, quality: ChordQuality): string {
  const base = ROMAN_BASE[degreeIndex]!;
  const isLower = quality === 'minor' || quality === 'diminished';
  const numeral = isLower ? base.toLowerCase() : base;
  const suffix = quality === 'diminished' ? '°' : quality === 'augmented' ? '+' : '';
  return numeral + suffix;
}

/** Fixed-Do Latin note names (Spanish worship convention). */
const LATIN_LETTER: Record<PitchSpelling['letter'], string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

function latinAccidental(accidental: number): string {
  if (accidental === 0) return '';
  const word = accidental > 0 ? ' sostenido' : ' bemol';
  return word.repeat(Math.abs(accidental));
}

const LATIN_QUALITY: Record<ChordQuality, string> = {
  major: 'mayor',
  minor: 'menor',
  diminished: 'disminuido',
  augmented: 'aumentado',
  sus2: 'sus2',
  sus4: 'sus4',
  other: '',
};

/** Latin note name, e.g. `Fa sostenido`. */
export function latinNoteName(spelling: PitchSpelling): string {
  return LATIN_LETTER[spelling.letter] + latinAccidental(spelling.accidental);
}

/** Latin chord name, e.g. `Re mayor`. */
export function latinChordName(chord: Chord): string {
  const quality = LATIN_QUALITY[chord.quality];
  const root = latinNoteName(chord.root);
  return quality ? `${root} ${quality}` : root;
}

/** American chord symbol, e.g. `D`, `Em`, `F#dim`. */
export function chordSymbol(chord: Chord): string {
  const root = noteNameAscii(chord.root);
  switch (chord.quality) {
    case 'major':
      return root;
    case 'minor':
      return `${root}m`;
    case 'diminished':
      return `${root}dim`;
    case 'augmented':
      return `${root}aug`;
    default:
      return root;
  }
}

/**
 * Harmonic-function copy keyed by mode and degree index. Primary line is
 * plain-language behaviour; `technical` is the secondary label.
 */
interface FunctionCopy {
  readonly summary: string;
  readonly technical: string;
}

const MAJOR_FUNCTIONS: readonly FunctionCopy[] = [
  { summary: 'Home — rest and resolution.', technical: 'Tonic' },
  { summary: 'Prepares movement toward tension.', technical: 'Supertonic' },
  { summary: 'A softer, relative rest.', technical: 'Mediant' },
  { summary: 'Steps away from home.', technical: 'Subdominant' },
  { summary: 'Tension that wants to resolve home.', technical: 'Dominant' },
  { summary: 'Relative rest — the minor home.', technical: 'Submediant' },
  { summary: 'Strong pull back toward home.', technical: 'Leading-tone' },
];

const MINOR_FUNCTIONS: readonly FunctionCopy[] = [
  { summary: 'Home — rest and resolution.', technical: 'Tonic' },
  { summary: 'Unstable — pulls toward tension.', technical: 'Supertonic' },
  { summary: 'The bright relative-major color.', technical: 'Mediant' },
  { summary: 'Steps away from home.', technical: 'Subdominant' },
  { summary: 'Gentle movement — a soft dominant.', technical: 'Dominant' },
  { summary: 'A warm, restful landing.', technical: 'Submediant' },
  { summary: 'Approaches home from below.', technical: 'Subtonic' },
];

export function harmonicFunction(mode: Mode, degreeIndex: number): FunctionCopy {
  const table = mode === 'major' ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS;
  return table[degreeIndex]!;
}

/** Complete view-model for a single degree of a key. */
export interface Degree {
  readonly index: number; // 0..6
  readonly roman: string;
  readonly chord: Chord;
  readonly symbol: string;
  readonly latinName: string;
  readonly function: FunctionCopy;
  /** Safe landing notes (chord tones), ASCII and display forms. */
  readonly targetNotes: readonly PitchSpelling[];
}

/** Assemble all seven degrees for a key. */
export function buildDegrees(key: Key): Degree[] {
  const scale = buildScale(key.tonic, key.mode);
  const triads = buildDiatonicTriads(scale);
  return triads.map((chord, index) => ({
    index,
    roman: romanNumeral(index, chord.quality),
    chord,
    symbol: chordSymbol(chord),
    latinName: latinChordName(chord),
    function: harmonicFunction(key.mode, index),
    targetNotes: chord.notes,
  }));
}

export { noteNameAscii, noteNameDisplay };
