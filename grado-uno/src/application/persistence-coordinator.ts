/**
 * Persistence coordinator (design §10).
 *
 * Serializes versioned session preferences and favorite progressions to a
 * key-value store. Never stores rendered UI fragments — favorites hold a degree
 * *sequence* plus key/mode/capo/name/schema version so they replay in any
 * spelling. Preferences and favorites live under separate keys so that
 * "reset preferences" and "delete favorites" are independent actions.
 */

import type { KeyValueStore } from '../infrastructure/local-storage/index.ts';
import type { Mode } from '../domain/music-core/index.ts';
import { clampCapo } from '../domain/capo/index.ts';
import {
  DEFAULT_STATE,
  normalizeState,
  type SessionState,
} from './session-state.ts';

export const SCHEMA_VERSION = 1;

const SESSION_KEY = 'gradouno.session';
const FAVORITES_KEY = 'gradouno.favorites';

export interface Favorite {
  readonly id: string;
  readonly name: string;
  readonly tonic: string;
  readonly mode: Mode;
  readonly capo: number;
  readonly degreeIndices: readonly number[];
  readonly schemaVersion: number;
}

interface SessionEnvelope {
  readonly version: number;
  readonly session: SessionState;
}

interface FavoritesEnvelope {
  readonly version: number;
  readonly favorites: readonly Favorite[];
}

/** Registry of migrations from a given version to the next. */
type Migration = (data: unknown) => unknown;
const SESSION_MIGRATIONS: Record<number, Migration> = {
  // 0 -> 1: initial schema; nothing to transform yet.
};
const FAVORITES_MIGRATIONS: Record<number, Migration> = {};

function runMigrations(
  data: unknown,
  fromVersion: number,
  migrations: Record<number, Migration>,
): unknown {
  let current = data;
  let version = fromVersion;
  while (version < SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (migrate) current = migrate(current);
    version += 1;
  }
  return current;
}

export function loadSession(store: KeyValueStore): SessionState {
  const raw = store.get(SESSION_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionEnvelope> & Partial<SessionState>;
    const version = typeof parsed.version === 'number' ? parsed.version : 0;
    // Support both enveloped and (defensive) bare shapes.
    const sessionData =
      'session' in parsed && parsed.session ? parsed.session : (parsed as SessionState);
    const migrated = runMigrations(sessionData, version, SESSION_MIGRATIONS);
    return normalizeState(migrated as Partial<SessionState>);
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveSession(store: KeyValueStore, session: SessionState): void {
  const envelope: SessionEnvelope = { version: SCHEMA_VERSION, session };
  store.set(SESSION_KEY, JSON.stringify(envelope));
}

function sanitizeFavorite(input: unknown): Favorite | null {
  if (!input || typeof input !== 'object') return null;
  const f = input as Record<string, unknown>;
  const degreeIndices = Array.isArray(f.degreeIndices)
    ? f.degreeIndices.filter(
        (n): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 6,
      )
    : [];
  if (
    typeof f.id !== 'string' ||
    typeof f.name !== 'string' ||
    typeof f.tonic !== 'string' ||
    (f.mode !== 'major' && f.mode !== 'minor') ||
    degreeIndices.length < 2
  ) {
    return null;
  }
  return {
    id: f.id,
    name: f.name,
    tonic: f.tonic,
    mode: f.mode,
    capo: clampCapo(typeof f.capo === 'number' ? f.capo : 0),
    degreeIndices,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function loadFavorites(store: KeyValueStore): Favorite[] {
  const raw = store.get(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<FavoritesEnvelope>;
    const version = typeof parsed.version === 'number' ? parsed.version : 0;
    const list = Array.isArray(parsed.favorites) ? parsed.favorites : [];
    const migrated = runMigrations(list, version, FAVORITES_MIGRATIONS) as unknown[];
    return migrated.map(sanitizeFavorite).filter((f): f is Favorite => f !== null);
  } catch {
    return [];
  }
}

export function saveFavorites(store: KeyValueStore, favorites: readonly Favorite[]): void {
  const envelope: FavoritesEnvelope = { version: SCHEMA_VERSION, favorites };
  store.set(FAVORITES_KEY, JSON.stringify(envelope));
}

/**
 * Reset preferences to defaults. Does NOT touch favorites — deleting favorites
 * is a separate, explicitly confirmed action (design §10.3).
 */
export function resetPreferences(store: KeyValueStore): SessionState {
  store.remove(SESSION_KEY);
  return DEFAULT_STATE;
}

/** Delete all favorites. Distinct from resetting preferences. */
export function deleteAllFavorites(store: KeyValueStore): void {
  store.remove(FAVORITES_KEY);
}
