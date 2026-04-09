import type { HistoryController } from './types.js';

export function createHistory(storageKey: string): HistoryController {
  const entries: string[] = (() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();
  let cursor = entries.length;

  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {}
  };

  return {
    push: (entry) => {
      if (!entry.trim()) return;
      entries.push(entry);
      cursor = entries.length;
      persist();
    },
    prev: () => {
      if (entries.length === 0) return null;
      cursor = Math.max(0, cursor - 1);
      return entries[cursor] ?? null;
    },
    next: () => {
      if (cursor >= entries.length) return '';
      cursor += 1;
      if (cursor >= entries.length) return '';
      return entries[cursor] ?? null;
    },
    reset: () => {
      cursor = entries.length;
    },
    all: () => [...entries],
    clear: () => {
      entries.length = 0;
      cursor = 0;
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    },
  };
}
