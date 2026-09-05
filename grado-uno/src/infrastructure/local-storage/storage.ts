/**
 * Local key-value storage adapter (design §10.3).
 *
 * Wraps `localStorage` behind a narrow interface and degrades gracefully: if
 * storage is unavailable (private mode, quota, disabled), it falls back to an
 * in-memory store for the current session and reports `available: false` so the
 * UI can show a non-blocking notice.
 */

export interface KeyValueStore {
  readonly available: boolean;
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

function createMemoryStore(available: boolean): KeyValueStore {
  const map = new Map<string, string>();
  return {
    available,
    get: (k) => (map.has(k) ? map.get(k)! : null),
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

export function createLocalStorageStore(): KeyValueStore {
  try {
    const probe = '__gradouno_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch {
    // Storage unavailable — session-only fallback.
    return createMemoryStore(false);
  }

  return {
    available: true,
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* ignore write failures (e.g. quota) */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export { createMemoryStore };
