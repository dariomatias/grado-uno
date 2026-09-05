import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STATE,
  clampTempo,
  normalizeState,
  reducer,
  type SessionState,
} from './session-state.ts';

const withProg = (degrees: number[]): SessionState => ({
  ...DEFAULT_STATE,
  progression: degrees.map((degreeIndex, i) => ({ id: `id${i}`, degreeIndex })),
});

describe('progression editing', () => {
  it('adds items up to the max of 8 and no further', () => {
    let s = DEFAULT_STATE;
    for (let i = 0; i < 10; i++) {
      s = reducer(s, { type: 'addToProgression', degreeIndex: i % 7, id: `x${i}` });
    }
    expect(s.progression).toHaveLength(8);
  });

  it('removes an item by id', () => {
    const s = reducer(withProg([0, 4, 5]), { type: 'removeItem', id: 'id1' });
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([0, 5]);
  });

  it('duplicates an item right after the source', () => {
    const s = reducer(withProg([0, 4]), {
      type: 'duplicateItem',
      id: 'id0',
      newId: 'dup',
    });
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([0, 0, 4]);
    expect(s.progression[1]!.id).toBe('dup');
  });

  it('reorders by index', () => {
    const s = reducer(withProg([0, 4, 5, 3]), { type: 'reorder', from: 0, to: 2 });
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([4, 5, 0, 3]);
  });

  it('clears the progression', () => {
    const s = reducer(withProg([0, 4]), { type: 'clearProgression' });
    expect(s.progression).toHaveLength(0);
  });
});

describe('preserving the degree sequence across key/mode/capo', () => {
  it('changing tonic keeps the degree sequence', () => {
    const s = reducer(withProg([0, 4, 5, 3]), { type: 'setTonic', tonic: 'G' });
    expect(s.tonic).toBe('G');
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([0, 4, 5, 3]);
  });

  it('changing mode keeps the degree sequence and re-validates tonic', () => {
    const start: SessionState = { ...withProg([0, 4, 5, 3]), mode: 'major', tonic: 'Db' };
    const s = reducer(start, { type: 'setMode', mode: 'minor' });
    expect(s.mode).toBe('minor');
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([0, 4, 5, 3]);
    // Db is not a supported minor tonic → falls back to C
    expect(s.tonic).toBe('C');
  });

  it('changing capo keeps the degree sequence and clamps', () => {
    const s = reducer(withProg([0, 4]), { type: 'setCapo', capo: 20 });
    expect(s.capo).toBe(12);
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([0, 4]);
  });
});

describe('tempo clamping', () => {
  it('clamps to 40..180', () => {
    expect(clampTempo(10)).toBe(40);
    expect(clampTempo(999)).toBe(180);
    expect(reducer(DEFAULT_STATE, { type: 'setTempo', tempo: 300 }).tempo).toBe(180);
  });
});

describe('normalizeState', () => {
  it('coerces foreign/partial input into a valid state', () => {
    const s = normalizeState({
      tonic: 'H' as unknown as string,
      mode: 'minor',
      capo: -5,
      tempo: 5,
      progression: [
        { id: 'a', degreeIndex: 3 },
        { id: 'b', degreeIndex: 99 } as never,
      ],
    });
    expect(s.tonic).toBe('C'); // invalid tonic falls back
    expect(s.capo).toBe(0);
    expect(s.tempo).toBe(40);
    expect(s.progression.map((i) => i.degreeIndex)).toEqual([3]); // 99 dropped
  });
});
