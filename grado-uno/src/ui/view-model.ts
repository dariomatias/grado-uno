/**
 * View-model composition (design §11 data flow).
 *
 * Pure function that turns SessionState into render-ready data by calling the
 * domain modules. React components consume this and never call domain code that
 * requires assembling several modules themselves.
 */

import { shapeForChord, shapesForChords, type Shape } from '../domain/capo/index.ts';
import {
  buildDegrees,
  buildScale,
  intervalLabel,
  makeKey,
  noteNameDisplay,
  pitchClass,
  type Degree,
  type PitchSpelling,
} from '../domain/music-core/index.ts';
import {
  STANDARD_TUNING,
  buildFretboard,
  chooseWindow,
  fretboardTextEquivalent,
  type FretWindow,
  type NotePosition,
} from '../domain/fretboard/index.ts';
import {
  resolveProgression,
  targetNotes,
  type ResolvedProgression,
  type TargetNote,
  type Transition,
} from '../domain/progression/index.ts';
import { worshipTips, type WorshipTip } from '../domain/worship-tips/index.ts';
import type { LabelMode, SessionState } from '../application/index.ts';

export type FunctionFamily = 'tonic' | 'subdominant' | 'dominant';

/** Map each degree to a harmonic-function family for colouring (§5, §12). */
const MAJOR_FAMILIES: readonly FunctionFamily[] = [
  'tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'tonic', 'dominant',
];
const MINOR_FAMILIES: readonly FunctionFamily[] = [
  'tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'subdominant', 'dominant',
];

export function functionFamily(mode: 'major' | 'minor', degreeIndex: number): FunctionFamily {
  return (mode === 'major' ? MAJOR_FAMILIES : MINOR_FAMILIES)[degreeIndex] ?? 'tonic';
}

export interface DegreeCardVM {
  readonly index: number;
  readonly roman: string;
  readonly symbol: string;
  readonly family: FunctionFamily;
}

export interface FretLabel extends NotePosition {
  readonly label: string;
}

export interface FretboardVM {
  readonly window: FretWindow;
  readonly positions: readonly FretLabel[];
  readonly stringNames: readonly string[];
  readonly stringCount: number;
  readonly textEquivalent: string;
}

export interface DegreeDetailVM {
  readonly degree: Degree;
  readonly symbol: string;
  readonly latinName: string;
  readonly family: FunctionFamily;
  readonly targets: readonly TargetNote[];
  readonly shape: Shape;
  readonly fretboard: FretboardVM;
}

export interface ProgressionSlotVM {
  readonly id: string;
  readonly index: number;
  readonly degreeIndex: number;
  readonly roman: string;
  readonly symbol: string;
  readonly shape: Shape;
  readonly family: FunctionFamily;
}

export interface GradoUnoVM {
  readonly keyLabel: string;
  readonly degrees: readonly Degree[];
  readonly cards: readonly DegreeCardVM[];
  readonly detail: DegreeDetailVM | null;
  readonly progression: {
    readonly slots: readonly ProgressionSlotVM[];
    readonly resolved: ResolvedProgression;
    readonly transitions: readonly Transition[];
    readonly tips: readonly WorshipTip[];
    readonly capoActive: boolean;
  };
}

function noteLabelFor(
  scaleSpellings: Map<number, PitchSpelling>,
  labelMode: LabelMode,
  pos: NotePosition,
): string {
  if (labelMode === 'intervals') return intervalLabel(pos.semitonesFromRoot);
  const spelling = scaleSpellings.get(pos.pitchClass);
  return spelling ? noteNameDisplay(spelling) : '';
}

function buildFretboardVM(
  scaleSpellings: Map<number, PitchSpelling>,
  scalePitchClasses: number[],
  chord: Degree['chord'],
  state: SessionState,
): FretboardVM {
  const rootPitchClass = pitchClass(chord.root);
  const chordPitchClasses = chord.notes.map(pitchClass);
  const window: FretWindow =
    state.windowStart === null
      ? chooseWindow(STANDARD_TUNING, rootPitchClass, chordPitchClasses)
      : { startFret: state.windowStart, endFret: state.windowStart + 4 };

  const input = {
    tuning: STANDARD_TUNING,
    window,
    scalePitchClasses,
    chordPitchClasses,
    rootPitchClass,
  };
  const positions = buildFretboard(input).map((p) => ({
    ...p,
    label: noteLabelFor(scaleSpellings, state.labelMode, p),
  }));
  const chordToneNames = chord.notes.map((n) => noteNameDisplay(n));

  return {
    window,
    positions,
    stringNames: STANDARD_TUNING.stringNames,
    stringCount: STANDARD_TUNING.openPitchClasses.length,
    textEquivalent: fretboardTextEquivalent(input, chordToneNames, state.labelMode),
  };
}

export function buildViewModel(state: SessionState): GradoUnoVM {
  const key = makeKey(state.mode, state.tonic);
  const degrees = buildDegrees(key);
  const scale = buildScale(key.tonic, key.mode);
  const scalePitchClasses = scale.map(pitchClass);
  const scaleSpellings = new Map<number, PitchSpelling>();
  for (const s of scale) scaleSpellings.set(pitchClass(s), s);

  const cards: DegreeCardVM[] = degrees.map((d) => ({
    index: d.index,
    roman: d.roman,
    symbol: d.symbol,
    family: functionFamily(state.mode, d.index),
  }));

  const detail: DegreeDetailVM | null =
    state.selectedDegree === null
      ? null
      : (() => {
          const degree = degrees[state.selectedDegree!]!;
          return {
            degree,
            symbol: degree.symbol,
            latinName: degree.latinName,
            family: functionFamily(state.mode, degree.index),
            targets: targetNotes(degree.chord),
            shape: shapeForChord(degree.chord, state.capo),
            fretboard: buildFretboardVM(
              scaleSpellings,
              scalePitchClasses,
              degree.chord,
              state,
            ),
          };
        })();

  const degreeIndices = state.progression.map((i) => i.degreeIndex);
  const resolved = resolveProgression(key, degreeIndices);
  const shapes = shapesForChords(resolved.chords, state.capo);
  const slots: ProgressionSlotVM[] = state.progression.map((item, i) => {
    const degree = degrees[item.degreeIndex]!;
    return {
      id: item.id,
      index: i,
      degreeIndex: item.degreeIndex,
      roman: degree.roman,
      symbol: degree.symbol,
      shape: shapes[i]!,
      family: functionFamily(state.mode, item.degreeIndex),
    };
  });

  return {
    keyLabel: `${state.tonic} ${state.mode}`,
    degrees,
    cards,
    detail,
    progression: {
      slots,
      resolved,
      transitions: resolved.transitions,
      tips: worshipTips(resolved),
      capoActive: state.capo > 0,
    },
  };
}
