/**
 * Static Tailwind class lookups per harmonic-function family. Written as full
 * literal strings so Tailwind's scanner can see them. Colour is always paired
 * with a text label and weight elsewhere, never the sole signal (design §12).
 */

import type { FunctionFamily } from './view-model.ts';

export interface FamilyStyle {
  readonly dot: string;
  readonly selected: string;
  readonly softText: string;
  readonly softBg: string;
  readonly border: string;
  readonly label: string;
}

export const FAMILY_STYLE: Record<FunctionFamily, FamilyStyle> = {
  tonic: {
    dot: 'bg-emerald-500',
    selected: 'bg-emerald-500 text-white border-emerald-500',
    softText: 'text-emerald-700 dark:text-emerald-300',
    softBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    label: 'Home',
  },
  subdominant: {
    dot: 'bg-sky-500',
    selected: 'bg-sky-500 text-white border-sky-500',
    softText: 'text-sky-700 dark:text-sky-300',
    softBg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-300 dark:border-sky-800',
    label: 'Prepare',
  },
  dominant: {
    dot: 'bg-rose-500',
    selected: 'bg-rose-500 text-white border-rose-500',
    softText: 'text-rose-700 dark:text-rose-300',
    softBg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-800',
    label: 'Tension',
  },
};
