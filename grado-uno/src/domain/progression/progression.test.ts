import { describe, expect, it } from 'vitest';
import { makeKey, noteNameAscii, pitchClass } from '../music-core/index.ts';
import {
  MAX_LENGTH,
  analyzeTransition,
  canAdd,
  isPlayableLength,
  resolveProgression,
  targetNotes,
} from './index.ts';

describe('target notes', () => {
  it('returns root, third, fifth with roles', () => {
    const prog = resolveProgression(makeKey('major', 'C'), [0]); // C major
    const notes = targetNotes(prog.chords[0]!);
    expect(notes.map((n) => n.role)).toEqual(['root', 'third', 'fifth']);
    expect(notes.map((n) => noteNameAscii(n.spelling))).toEqual(['C', 'E', 'G']);
  });
});

describe('transition analysis', () => {
  it('C→G shares G and finds nearest movements', () => {
    const key = makeKey('major', 'C');
    const prog = resolveProgression(key, [0, 4]); // I → V (C → G)
    const t = prog.transitions[0]!;
    // C(0,4,7) and G(7,11,2): shared pitch class 7 (G)
    expect(t.sharedPitchClasses).toContain(7);
    // every current tone finds a nearest next tone within a tritone
    for (const m of t.movements) {
      expect(Math.abs(m.semitones)).toBeLessThanOrEqual(6);
    }
  });

  it('identical chords hold every tone', () => {
    const key = makeKey('major', 'C');
    const c = resolveProgression(key, [0]).chords[0]!;
    const t = analyzeTransition(c, c);
    expect(t.movements.every((m) => m.kind === 'hold')).toBe(true);
    expect(t.sharedPitchClasses.length).toBe(3);
  });

  it('flags a semitone resolution when one exists (V→I leading tone)', () => {
    const key = makeKey('major', 'C');
    // G (B is the leading tone) → C (B resolves up a semitone to C)
    const prog = resolveProgression(key, [4, 0]);
    const t = prog.transitions[0]!;
    expect(t.hasSemitoneResolution).toBe(true);
    const leadingToneMove = t.movements.find(
      (m) => noteNameAscii(m.from) === 'B',
    );
    expect(leadingToneMove?.isSemitoneResolution).toBe(true);
    expect(noteNameAscii(leadingToneMove!.to)).toBe('C');
  });
});

describe('degree sequence is key-independent', () => {
  it('same degrees, different key → same Roman numerals, different chords', () => {
    const degrees = [0, 4, 5, 3]; // I V vi IV
    const inC = resolveProgression(makeKey('major', 'C'), degrees);
    const inG = resolveProgression(makeKey('major', 'G'), degrees);
    expect(inC.degrees.map((d) => d.roman)).toEqual(inG.degrees.map((d) => d.roman));
    expect(inC.chords.map((c) => pitchClass(c.root))).not.toEqual(
      inG.chords.map((c) => pitchClass(c.root)),
    );
  });
});

describe('length rules', () => {
  it('playable length is 2..8', () => {
    expect(isPlayableLength(1)).toBe(false);
    expect(isPlayableLength(2)).toBe(true);
    expect(isPlayableLength(8)).toBe(true);
    expect(isPlayableLength(9)).toBe(false);
  });
  it('canAdd stops at max length', () => {
    expect(canAdd(MAX_LENGTH - 1)).toBe(true);
    expect(canAdd(MAX_LENGTH)).toBe(false);
  });
});
