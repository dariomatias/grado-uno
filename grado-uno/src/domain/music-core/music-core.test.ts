import { describe, expect, it } from 'vitest';
import {
  buildDegrees,
  buildDiatonicTriads,
  buildScale,
  latinChordName,
  makeKey,
  noteNameAscii,
  pitchClass,
  romanNumeral,
  supportedTonics,
  transposeSpelling,
  type Mode,
} from './index.ts';

const spell = (scale: ReturnType<typeof buildScale>) => scale.map(noteNameAscii);

describe('scale spelling — golden values', () => {
  const cases: Array<[Mode, string, string[]]> = [
    ['major', 'C', ['C', 'D', 'E', 'F', 'G', 'A', 'B']],
    ['major', 'G', ['G', 'A', 'B', 'C', 'D', 'E', 'F#']],
    ['major', 'F', ['F', 'G', 'A', 'Bb', 'C', 'D', 'E']],
    ['major', 'Bb', ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']],
    ['major', 'Db', ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C']],
    ['major', 'F#', ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']],
    ['minor', 'A', ['A', 'B', 'C', 'D', 'E', 'F', 'G']],
    ['minor', 'E', ['E', 'F#', 'G', 'A', 'B', 'C', 'D']],
    ['minor', 'C#', ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B']],
    ['minor', 'Eb', ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db']],
  ];
  it.each(cases)('%s %s', (mode, tonic, expected) => {
    const key = makeKey(mode, tonic);
    expect(spell(buildScale(key.tonic, mode))).toEqual(expected);
  });
});

describe('exhaustive invariants across all supported keys', () => {
  const modes: Mode[] = ['major', 'minor'];
  for (const mode of modes) {
    for (const tonic of supportedTonics(mode)) {
      const key = makeKey(mode, tonic);
      const scale = buildScale(key.tonic, mode);
      const triads = buildDiatonicTriads(scale);

      it(`${mode} ${tonic}: seven distinct pitch classes`, () => {
        const pcs = new Set(scale.map(pitchClass));
        expect(pcs.size).toBe(7);
      });

      it(`${mode} ${tonic}: no double accidentals`, () => {
        for (const note of scale) {
          expect(Math.abs(note.accidental)).toBeLessThanOrEqual(1);
        }
      });

      it(`${mode} ${tonic}: every triad has three distinct pitch classes`, () => {
        for (const chord of triads) {
          const pcs = new Set(chord.notes.map(pitchClass));
          expect(pcs.size).toBe(3);
        }
      });

      it(`${mode} ${tonic}: every chord tone is diatonic`, () => {
        const scalePcs = new Set(scale.map(pitchClass));
        for (const chord of triads) {
          for (const note of chord.notes) {
            expect(scalePcs.has(pitchClass(note))).toBe(true);
          }
        }
      });

      it(`${mode} ${tonic}: chord tones match their formula`, () => {
        for (const chord of triads) {
          const rootPc = pitchClass(chord.root);
          const actual = chord.notes.map((n) => (pitchClass(n) - rootPc + 12) % 12);
          const expected = chord.formula.intervals.map((iv) => iv.semitones % 12);
          expect(actual).toEqual(expected);
        }
      });
    }
  }
});

describe('triad quality patterns', () => {
  it('major key qualities', () => {
    const scale = buildScale(makeKey('major', 'C').tonic, 'major');
    expect(buildDiatonicTriads(scale).map((c) => c.quality)).toEqual([
      'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
    ]);
  });
  it('natural minor key qualities', () => {
    const scale = buildScale(makeKey('minor', 'A').tonic, 'minor');
    expect(buildDiatonicTriads(scale).map((c) => c.quality)).toEqual([
      'minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major',
    ]);
  });
});

describe('roman numerals', () => {
  it('major sequence', () => {
    const q = buildDiatonicTriads(buildScale(makeKey('major', 'C').tonic, 'major'));
    expect(q.map((c, i) => romanNumeral(i, c.quality))).toEqual([
      'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°',
    ]);
  });
  it('minor sequence', () => {
    const q = buildDiatonicTriads(buildScale(makeKey('minor', 'A').tonic, 'minor'));
    expect(q.map((c, i) => romanNumeral(i, c.quality))).toEqual([
      'i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII',
    ]);
  });
});

describe('notation — design example (V of G major)', () => {
  const degrees = buildDegrees(makeKey('major', 'G'));
  it('degree V is D major / Re mayor', () => {
    const v = degrees[4]!;
    expect(v.roman).toBe('V');
    expect(v.symbol).toBe('D');
    expect(v.latinName).toBe('Re mayor');
    expect(v.function.technical).toBe('Dominant');
    expect(v.targetNotes.map(noteNameAscii)).toEqual(['D', 'F#', 'A']);
  });
  it('symbols across the key', () => {
    expect(degrees.map((d) => d.symbol)).toEqual([
      'G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim',
    ]);
  });
});

describe('latin accidental naming', () => {
  it('spells sharps and flats', () => {
    const fSharp = buildScale(makeKey('major', 'G').tonic, 'major')[6]!;
    expect(latinChordName({
      formulaId: 'major', quality: 'major', root: fSharp,
      third: fSharp, fifth: fSharp, notes: [fSharp], formula: {
        id: 'major', quality: 'major', intervals: [],
      },
    })).toContain('Fa sostenido');
  });
});

describe('octave transposition identity', () => {
  it('12 semitones / 7 letter steps preserves spelling for every scale note', () => {
    for (const mode of ['major', 'minor'] as Mode[]) {
      for (const tonic of supportedTonics(mode)) {
        for (const note of buildScale(makeKey(mode, tonic).tonic, mode)) {
          const back = transposeSpelling(note, 12, 7);
          expect(back).toEqual(note);
        }
      }
    }
  });
});

describe('unsupported keys are rejected', () => {
  it('throws on a tonic outside the supported set', () => {
    expect(() => makeKey('major', 'G#')).toThrow();
    expect(() => makeKey('minor', 'Ab')).toThrow();
  });
});
