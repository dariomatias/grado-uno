/**
 * Supported keys and modes.
 *
 * The MVP exposes twelve practical tonic spellings per mode, chosen to avoid
 * double accidentals in the generated scale (design §5.2). The tonic spelling
 * controls every downstream note and chord spelling.
 */

import type { PitchSpelling } from './pitch.ts';

export type Mode = 'major' | 'minor';

interface TonicSpec {
  readonly letter: PitchSpelling['letter'];
  readonly accidental: number;
}

function parseTonic(name: string): TonicSpec {
  const letter = name[0] as PitchSpelling['letter'];
  const accidental = name.slice(1).split('').reduce((acc, ch) => {
    if (ch === '#') return acc + 1;
    if (ch === 'b') return acc - 1;
    return acc;
  }, 0);
  return { letter, accidental };
}

const MAJOR_TONICS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
] as const;

const MINOR_TONICS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B',
] as const;

export type MajorTonic = (typeof MAJOR_TONICS)[number];
export type MinorTonic = (typeof MINOR_TONICS)[number];

export function supportedTonics(mode: Mode): readonly string[] {
  return mode === 'major' ? MAJOR_TONICS : MINOR_TONICS;
}

export interface Key {
  readonly mode: Mode;
  readonly tonic: PitchSpelling;
  /** The canonical tonic name as exposed in the UI, e.g. `Bb`, `F#`. */
  readonly tonicName: string;
}

export function makeKey(mode: Mode, tonicName: string): Key {
  const tonics = supportedTonics(mode);
  if (!tonics.includes(tonicName)) {
    throw new Error(`Unsupported ${mode} tonic: ${tonicName}`);
  }
  const spec = parseTonic(tonicName);
  return {
    mode,
    tonic: { letter: spec.letter, accidental: spec.accidental },
    tonicName,
  };
}
