import type { HistoryController } from './types.js';

export function createHistory(): HistoryController {
  const entries: string[] = [];
  let cursor = 0;

  return {
    push: (entry) => {
      if (!entry.trim()) return;
      entries.push(entry);
      cursor = entries.length;
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
  };
}
