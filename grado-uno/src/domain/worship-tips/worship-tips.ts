/**
 * Worship-oriented templates and tips (design §7.3).
 *
 * Templates are *shortcuts*, not rules — every diatonic degree stays available
 * and tips are phrased as suggestions. Tips highlight sustained/shared notes,
 * short melodic movements, and chord tones on the upper strings. `Worship`
 * affects prioritised templates and copy only — never audio styling, and never
 * a claim that a vocabulary is mandatory.
 */

import { noteNameAscii } from '../music-core/index.ts';
import type { ResolvedProgression } from '../progression/index.ts';

export interface ProgressionTemplate {
  readonly id: string;
  readonly name: string;
  /** Roman-numeral summary for display. */
  readonly roman: string;
  /** Degree indices (0-based) for a major key. */
  readonly degreeIndices: readonly number[];
}

/** Common worship progressions, offered as starting points. */
export const WORSHIP_TEMPLATES: readonly ProgressionTemplate[] = [
  { id: 'i-v-vi-iv', name: 'Pop / worship classic', roman: 'I – V – vi – IV', degreeIndices: [0, 4, 5, 3] },
  { id: 'vi-iv-i-v', name: 'Sensitive / building', roman: 'vi – IV – I – V', degreeIndices: [5, 3, 0, 4] },
  { id: 'iv-i-v-vi', name: 'Anthemic lift', roman: 'IV – I – V – vi', degreeIndices: [3, 0, 4, 5] },
];

export type TipKind = 'shared' | 'resolution' | 'melody' | 'sustain';

export interface WorshipTip {
  readonly kind: TipKind;
  readonly text: string;
}

/**
 * Generate suggestion-phrased tips for a resolved progression. Requires at
 * least two chords (transitions exist); returns a general melody tip otherwise.
 */
export function worshipTips(resolved: ResolvedProgression): WorshipTip[] {
  const tips: WorshipTip[] = [];

  resolved.transitions.forEach((t, i) => {
    const fromRoman = resolved.degrees[i]?.roman ?? '';
    const toRoman = resolved.degrees[i + 1]?.roman ?? '';

    if (t.sharedNotes.length > 0) {
      const names = t.sharedNotes.map((n) => noteNameAscii(n)).join(', ');
      tips.push({
        kind: 'shared',
        text: `${fromRoman} → ${toRoman} share ${names} — let those notes ring across the change.`,
      });
    }

    const resolution = t.movements.find((m) => m.isSemitoneResolution);
    if (resolution) {
      tips.push({
        kind: 'resolution',
        text: `Strong pull into ${toRoman}: ${noteNameAscii(resolution.from)} → ${noteNameAscii(
          resolution.to,
        )} (a semitone).`,
      });
    }
  });

  tips.push({
    kind: 'melody',
    text: 'Favor chord tones on the top strings for a singable melody line.',
  });

  return tips;
}
