import { describe, expect, it } from 'vitest';
import { buildDegrees, makeKey, pitchClass } from '../music-core/index.ts';
import {
  STANDARD_TUNING,
  buildFretboard,
  chooseWindow,
  pitchClassAt,
  shiftWindow,
} from './index.ts';

describe('standard tuning', () => {
  it('open strings are E A D G B E', () => {
    expect(STANDARD_TUNING.openPitchClasses).toEqual([4, 9, 2, 7, 11, 4]);
  });

  it('fret 12 repeats each open-string pitch class', () => {
    STANDARD_TUNING.openPitchClasses.forEach((open, s) => {
      expect(pitchClassAt(STANDARD_TUNING, s, 12)).toBe(open);
    });
  });
});

describe('buildFretboard', () => {
  const key = makeKey('major', 'C');
  const degrees = buildDegrees(key);
  const scalePitchClasses = degrees.map((d) => pitchClass(d.chord.root));
  const tonicChord = degrees[0]!.chord; // C major
  const chordPitchClasses = tonicChord.notes.map(pitchClass);
  const rootPitchClass = pitchClass(tonicChord.root);

  const input = {
    tuning: STANDARD_TUNING,
    window: { startFret: 0, endFret: 4 },
    scalePitchClasses,
    chordPitchClasses,
    rootPitchClass,
  };
  const positions = buildFretboard(input);

  it('only emits scale notes', () => {
    const scale = new Set(scalePitchClasses);
    for (const p of positions) expect(scale.has(p.pitchClass)).toBe(true);
  });

  it('flags chord tones and root, and sets emphasis accordingly', () => {
    const chord = new Set(chordPitchClasses);
    for (const p of positions) {
      expect(p.isChordTone).toBe(chord.has(p.pitchClass));
      expect(p.isRoot).toBe(p.pitchClass === rootPitchClass);
      const expected = p.isRoot ? 'root' : p.isChordTone ? 'chord' : 'scale';
      expect(p.emphasis).toBe(expected);
    }
  });

  it('every position lies within the window', () => {
    for (const p of positions) {
      expect(p.fret).toBeGreaterThanOrEqual(0);
      expect(p.fret).toBeLessThanOrEqual(4);
    }
  });

  it('semitonesFromRoot is 0 for the root note', () => {
    for (const p of positions.filter((x) => x.isRoot)) {
      expect(p.semitonesFromRoot).toBe(0);
    }
  });
});

describe('chooseWindow', () => {
  it('picks a first fret between 0 and 7 and contains the tonic', () => {
    const degrees = buildDegrees(makeKey('major', 'G'));
    const root = pitchClass(degrees[0]!.chord.root);
    const chord = degrees[0]!.chord.notes.map(pitchClass);
    const window = chooseWindow(STANDARD_TUNING, root, chord);
    expect(window.startFret).toBeGreaterThanOrEqual(0);
    expect(window.startFret).toBeLessThanOrEqual(7);
    expect(window.endFret - window.startFret).toBe(4);

    let containsTonic = false;
    for (let s = 0; s < STANDARD_TUNING.openPitchClasses.length; s++) {
      for (let f = window.startFret; f <= window.endFret; f++) {
        if (pitchClassAt(STANDARD_TUNING, s, f) === root) containsTonic = true;
      }
    }
    expect(containsTonic).toBe(true);
  });
});

describe('shiftWindow', () => {
  it('shifts up and down and clamps at fret 0', () => {
    expect(shiftWindow({ startFret: 3, endFret: 7 }, 1)).toEqual({
      startFret: 4,
      endFret: 8,
    });
    expect(shiftWindow({ startFret: 0, endFret: 4 }, -1)).toEqual({
      startFret: 0,
      endFret: 4,
    });
  });
});
