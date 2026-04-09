import type { VirtualFs } from './types.js';

export interface CompletionInput {
  value: string;
  commands: string[];
  fs: VirtualFs;
}

export interface CompletionResult {
  value: string;
  candidates: string[];
}

function commonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0]!;
  for (const s of strings) {
    while (!s.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}

export function complete({ value, commands, fs }: CompletionInput): CompletionResult {
  if (!value.includes(' ')) {
    const matches = commands.filter((c) => c.startsWith(value));
    if (matches.length === 0) return { value, candidates: [] };
    if (matches.length === 1) return { value: `${matches[0]!} `, candidates: [] };
    return { value: commonPrefix(matches), candidates: matches };
  }

  const lastSpace = value.lastIndexOf(' ');
  const head = value.slice(0, lastSpace + 1);
  const partial = value.slice(lastSpace + 1);

  const slashIdx = partial.lastIndexOf('/');
  const parent = slashIdx >= 0 ? partial.slice(0, slashIdx + 1) : '';
  const leaf = slashIdx >= 0 ? partial.slice(slashIdx + 1) : partial;

  const parentAbs = fs.resolve(parent || '.');
  const children = fs.list(parentAbs);
  if (!children) return { value, candidates: [] };

  const matches = children.filter((c) => c.startsWith(leaf));
  if (matches.length === 0) return { value, candidates: [] };
  if (matches.length === 1) {
    const completed = parent + matches[0];
    const child = fs.resolve((parent || '') + matches[0]);
    const suffix = fs.isDir(child) ? '/' : ' ';
    return { value: head + completed + suffix, candidates: [] };
  }
  return { value: head + parent + commonPrefix(matches), candidates: matches };
}
