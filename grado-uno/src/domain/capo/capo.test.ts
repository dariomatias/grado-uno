import { describe, expect, it } from 'vitest';
import {
  buildDegrees,
  makeKey,
  mod,
  pitchClass,
  type Chord,
} from '../music-core/index.ts';
import { CAPO_MAX, clampCapo, shapeForChord, shapesForChords } from './index.ts';

const chordsOf = (mode: 'major' | 'minor', tonic: string): Chord[] =>
  buildDegrees(makeKey(mode, tonic)).map((d) => d.chord);

describe('capo — design example (B major, capo 4)', () => {
  it('sounding B – F# – G#m – E fingers shapes G – D – Em – C', () => {
    const degrees = buildDegrees(makeKey('major', 'B'));
    // I – V – vi – IV
    const sounding = [degrees[0]!, degrees[4]!, degrees[5]!, degrees[3]!].map(
      (d) => d.chord,
    );
    expect(sounding.map((c) => c.notes[0]!.letter)).toBeDefined();
    const shapes = shapesForChords(sounding, 4);
    expect(shapes.map((s) => s.symbol)).toEqual(['G', 'D', 'Em', 'C']);
  });
});

describe('capo 0 keeps shape pitch class equal to sounding root', () => {
  for (const mode of ['major', 'minor'] as const) {
    it(`${mode}`, () => {
      for (const chord of chordsOf(mode, 'C')) {
        const shape = shapeForChord(chord, 0);
        expect(shape.rootPitchClass).toBe(pitchClass(chord.root));
        expect(shape.quality).toBe(chord.quality);
      }
    });
  }
});

describe('capo transposition invariant', () => {
  it('shape root is sounding root minus capo (mod 12), for every capo', () => {
    const chords = chordsOf('major', 'G');
    for (let capo = 0; capo <= CAPO_MAX; capo++) {
      for (const chord of chords) {
        const shape = shapeForChord(chord, capo);
        expect(shape.rootPitchClass).toBe(mod(pitchClass(chord.root) - capo, 12));
      }
    }
  });

  it('applying then removing the same capo restores the sounding pitch class', () => {
    const chords = chordsOf('minor', 'E');
    for (let capo = 0; capo <= CAPO_MAX; capo++) {
      for (const chord of chords) {
        const down = shapeForChord(chord, capo).rootPitchClass;
        const restored = mod(down + capo, 12);
        expect(restored).toBe(pitchClass(chord.root));
      }
    }
  });
});

describe('capo clamping', () => {
  it('clamps to 0..12 and rounds', () => {
    expect(clampCapo(-3)).toBe(0);
    expect(clampCapo(99)).toBe(12);
    expect(clampCapo(4.4)).toBe(4);
  });
});
