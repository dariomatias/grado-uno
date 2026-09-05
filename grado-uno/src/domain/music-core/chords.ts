/**
 * Diatonic triad construction.
 *
 * Each degree's triad is built by stacking thirds within the diatonic scale
 * (scale notes at indices d, d+2, d+4). Deriving members from the scale
 * guarantees correct spelling and that every chord tone belongs to the key
 * (design §6.2, §6.4).
 */

import type { ChordFormula, ChordQuality } from './intervals.ts';
import { classifyTriad } from './intervals.ts';
import type { PitchSpelling } from './pitch.ts';
import { mod, pitchClass } from './pitch.ts';

export interface Chord {
  /** Stable identifier for the chord's formula, e.g. `major`, `dim`. */
  readonly formulaId: string;
  readonly quality: ChordQuality;
  readonly root: PitchSpelling;
  readonly third: PitchSpelling;
  readonly fifth: PitchSpelling;
  /** Ordered chord tones: root, third, fifth. */
  readonly notes: readonly PitchSpelling[];
  /** The classified interval formula (open to future extension). */
  readonly formula: ChordFormula;
}

function semitonesFromRoot(root: PitchSpelling, other: PitchSpelling): number {
  return mod(pitchClass(other) - pitchClass(root), 12);
}

/**
 * Build the diatonic triad rooted at `degreeIndex` (0-based) of `scale`.
 */
export function buildTriadFromScale(
  scale: readonly PitchSpelling[],
  degreeIndex: number,
): Chord {
  const root = scale[mod(degreeIndex, scale.length)]!;
  const third = scale[mod(degreeIndex + 2, scale.length)]!;
  const fifth = scale[mod(degreeIndex + 4, scale.length)]!;
  const formula = classifyTriad(
    semitonesFromRoot(root, third),
    semitonesFromRoot(root, fifth),
  );
  return {
    formulaId: formula.id,
    quality: formula.quality,
    root,
    third,
    fifth,
    notes: [root, third, fifth],
    formula,
  };
}

/** Build all seven diatonic triads for a scale. */
export function buildDiatonicTriads(scale: readonly PitchSpelling[]): Chord[] {
  return scale.map((_, i) => buildTriadFromScale(scale, i));
}
