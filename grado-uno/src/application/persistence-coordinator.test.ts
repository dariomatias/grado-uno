import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../infrastructure/local-storage/index.ts';
import { DEFAULT_STATE } from './session-state.ts';
import {
  deleteAllFavorites,
  loadFavorites,
  loadSession,
  resetPreferences,
  saveFavorites,
  saveSession,
  type Favorite,
} from './persistence-coordinator.ts';

const favorite = (over: Partial<Favorite> = {}): Favorite => ({
  id: 'f1',
  name: 'My song',
  tonic: 'G',
  mode: 'major',
  capo: 2,
  degreeIndices: [0, 4, 5, 3],
  schemaVersion: 1,
  ...over,
});

describe('session persistence', () => {
  it('round-trips a session', () => {
    const store = createMemoryStore(true);
    const session = { ...DEFAULT_STATE, tonic: 'Bb', mode: 'minor' as const, capo: 3 };
    saveSession(store, session);
    const loaded = loadSession(store);
    expect(loaded.tonic).toBe('Bb');
    expect(loaded.mode).toBe('minor');
    expect(loaded.capo).toBe(3);
  });

  it('returns defaults when empty or corrupt', () => {
    const store = createMemoryStore(true);
    expect(loadSession(store)).toEqual(DEFAULT_STATE);
    store.set('gradouno.session', '{not json');
    expect(loadSession(store)).toEqual(DEFAULT_STATE);
  });
});

describe('favorites persistence', () => {
  it('round-trips favorites', () => {
    const store = createMemoryStore(true);
    saveFavorites(store, [favorite(), favorite({ id: 'f2', name: 'Second' })]);
    const loaded = loadFavorites(store);
    expect(loaded.map((f) => f.id)).toEqual(['f1', 'f2']);
    expect(loaded[0]!.degreeIndices).toEqual([0, 4, 5, 3]);
  });

  it('drops malformed favorites (too short / bad fields)', () => {
    const store = createMemoryStore(true);
    store.set(
      'gradouno.favorites',
      JSON.stringify({
        version: 1,
        favorites: [favorite(), { id: 'bad', name: 'x', tonic: 'G', mode: 'major', degreeIndices: [0] }],
      }),
    );
    expect(loadFavorites(store).map((f) => f.id)).toEqual(['f1']);
  });
});

describe('reset vs delete are independent', () => {
  it('resetPreferences leaves favorites intact', () => {
    const store = createMemoryStore(true);
    saveSession(store, { ...DEFAULT_STATE, tonic: 'E' });
    saveFavorites(store, [favorite()]);

    const reset = resetPreferences(store);
    expect(reset).toEqual(DEFAULT_STATE);
    expect(loadSession(store)).toEqual(DEFAULT_STATE);
    expect(loadFavorites(store)).toHaveLength(1); // favorites survive
  });

  it('deleteAllFavorites leaves preferences intact', () => {
    const store = createMemoryStore(true);
    saveSession(store, { ...DEFAULT_STATE, tonic: 'E' });
    saveFavorites(store, [favorite()]);

    deleteAllFavorites(store);
    expect(loadFavorites(store)).toHaveLength(0);
    expect(loadSession(store).tonic).toBe('E'); // prefs survive
  });
});
