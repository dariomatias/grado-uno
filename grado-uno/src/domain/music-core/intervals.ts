/**
 * Interval and chord-formula model.
 *
 * A chord is described by a *formula*: an ordered list of intervals from the
 * root. Each interval carries both a semitone distance and a diatonic
 * letter-step distance so that member notes can be spelled correctly relative
 * to the root's letter (design §6.2). This deliberately avoids a closed
 * three-value quality enum so future formulas (sus, add9, sevenths…) slot in
 * without restructuring downstream modules.
 */

export interface Interval {
  /** Semitone distance from the root (0..). */
  readonly semitones: number;
  /** Diatonic letter steps from the root (unison = 0, third = 2, fifth = 4). */
  readonly letterSteps: number;
}

export interface ChordFormula {
  /** Stable identifier, e.g. `major`, `minor`, `dim`. */
  readonly id: string;
  /** Human label used as a quality word source. */
  readonly quality: ChordQuality;
  readonly intervals: readonly Interval[];
}

export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'sus2'
  | 'sus4'
  | 'other';

const P1: Interval = { semitones: 0, letterSteps: 0 };
const m3: Interval = { semitones: 3, letterSteps: 2 };
const M3: Interval = { semitones: 4, letterSteps: 2 };
const d5: Interval = { semitones: 6, letterSteps: 4 };
const P5: Interval = { semitones: 7, letterSteps: 4 };
const A5: Interval = { semitones: 8, letterSteps: 4 };

/** MVP triad formulas. */
export const TRIAD_FORMULAS: Record<
  'major' | 'minor' | 'diminished' | 'augmented',
  ChordFormula
> = {
  major: { id: 'major', quality: 'major', intervals: [P1, M3, P5] },
  minor: { id: 'minor', quality: 'minor', intervals: [P1, m3, P5] },
  diminished: { id: 'dim', quality: 'diminished', intervals: [P1, m3, d5] },
  augmented: { id: 'aug', quality: 'augmented', intervals: [P1, M3, A5] },
};

/**
 * Classify a triad from its third and fifth semitone content. Returns the
 * matching formula, or a generic `other` formula for shapes outside the known
 * set (keeps the model open per §6.2).
 */
export function classifyTriad(
  thirdSemitones: number,
  fifthSemitones: number,
): ChordFormula {
  for (const formula of Object.values(TRIAD_FORMULAS)) {
    const third = formula.intervals[1]!;
    const fifth = formula.intervals[2]!;
    if (third.semitones === thirdSemitones && fifth.semitones === fifthSemitones) {
      return formula;
    }
  }
  return {
    id: 'other',
    quality: 'other',
    intervals: [
      P1,
      { semitones: thirdSemitones, letterSteps: 2 },
      { semitones: fifthSemitones, letterSteps: 4 },
    ],
  };
}

/** Short interval label used in the fretboard's interval display mode. */
export function intervalLabel(semitones: number): string {
  const table: Record<number, string> = {
    0: 'R',
    1: 'b2',
    2: '2',
    3: 'b3',
    4: '3',
    5: '4',
    6: 'b5',
    7: '5',
    8: '#5',
    9: '6',
    10: 'b7',
    11: '7',
  };
  return table[((semitones % 12) + 12) % 12] ?? '?';
}
