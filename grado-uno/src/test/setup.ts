import '@testing-library/jest-dom/vitest';

// Node 25 ships an experimental global `localStorage` that shadows jsdom's and
// throws without a backing file. Install a deterministic in-memory shim so the
// storage adapter and tests behave consistently.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

// jsdom does not implement confirm(); default to confirming in tests.
globalThis.confirm = () => true;
