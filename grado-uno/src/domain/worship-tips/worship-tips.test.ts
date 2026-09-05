import { describe, expect, it } from 'vitest';
import { makeKey } from '../music-core/index.ts';
import { resolveProgression } from '../progression/index.ts';
import { WORSHIP_TEMPLATES, worshipTips } from './index.ts';

describe('worship templates', () => {
  it('includes the three canonical progressions with correct degrees', () => {
    const byId = Object.fromEntries(WORSHIP_TEMPLATES.map((t) => [t.id, t]));
    expect(byId['i-v-vi-iv']!.degreeIndices).toEqual([0, 4, 5, 3]);
    expect(byId['vi-iv-i-v']!.degreeIndices).toEqual([5, 3, 0, 4]);
    expect(byId['iv-i-v-vi']!.degreeIndices).toEqual([3, 0, 4, 5]);
  });
});

describe('worship tips', () => {
  it('produces shared-note and resolution tips for I–V–vi–IV in C', () => {
    const prog = resolveProgression(makeKey('major', 'C'), [0, 4, 5, 3]);
    const tips = worshipTips(prog);
    expect(tips.some((t) => t.kind === 'shared')).toBe(true);
    expect(tips.some((t) => t.kind === 'resolution')).toBe(true);
    // always ends with the general melody suggestion
    expect(tips.at(-1)!.kind).toBe('melody');
  });

  it('single-chord progression still returns the melody tip', () => {
    const prog = resolveProgression(makeKey('major', 'C'), [0]);
    const tips = worshipTips(prog);
    expect(tips).toHaveLength(1);
    expect(tips[0]!.kind).toBe('melody');
  });
});
