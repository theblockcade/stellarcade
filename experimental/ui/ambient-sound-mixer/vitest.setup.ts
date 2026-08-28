// vitest@1.x's jsdom environment (paired with jsdom@24, both pinned here)
// doesn't correctly expose a working window.localStorage/localStorage under
// Node 22+: Node defines a global `localStorage` accessor of its own
// (backed by --localstorage-file, which throws/no-ops without that flag),
// and jsdom's window.localStorage is itself a getter-only accessor —
// something in how vitest's jsdom environment copies jsdom's window onto
// the global scope drops that getter, leaving both `window.localStorage`
// and the bare global `localStorage` undefined in tests.
//
// This component relies on a real, working localStorage (it persists its
// config there), so this setup file builds a minimal but behaviorally
// correct Storage implementation directly and installs it on both
// `globalThis` and `window`, replacing whatever accessor each already has.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  const storage: Storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };

  return storage;
}

const memoryStorage = createMemoryStorage();

for (const target of [globalThis, typeof window !== "undefined" ? window : undefined]) {
  if (!target) continue;
  Object.defineProperty(target, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}
