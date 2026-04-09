import type { FsManifest, VirtualFs } from './types.js';

export function createFs(manifest: FsManifest, home: string): VirtualFs {
  let current = home;
  const cache = new Map<string, string>();

  const normalise = (parts: string[]): string => {
    const stack: string[] = [];
    for (const p of parts) {
      if (!p || p === '.') continue;
      if (p === '..') {
        stack.pop();
        continue;
      }
      stack.push(p);
    }
    return `/${stack.join('/')}`;
  };

  const resolve = (input: string): string => {
    if (!input) return current;
    if (input === '~') return home;
    if (input.startsWith('~/')) input = `${home}/${input.slice(2)}`;

    const isAbs = input.startsWith('/');
    const base = isAbs ? [] : current.split('/').filter(Boolean);
    const extra = input.split('/').filter(Boolean);
    return normalise([...base, ...extra]);
  };

  const isDir = (path: string): boolean => Boolean(manifest.dirs[path]);
  const isFile = (path: string): boolean => Boolean(manifest.files[path]);

  const list = (path: string): string[] | null => {
    const dir = manifest.dirs[path];
    return dir ? [...dir.children] : null;
  };

  const entry = (path: string) => manifest.files[path] ?? null;

  const chdir = (path: string) => {
    const target = resolve(path);
    if (!isDir(target)) throw new Error(`cd: not a directory: ${path}`);
    current = target;
  };

  const readFile = async (path: string): Promise<string> => {
    const f = entry(path);
    if (!f) throw new Error(`cat: ${path}: no such file`);
    if (cache.has(path)) return cache.get(path)!;
    const response = await fetch(`/read/${f.slug}/`);
    if (!response.ok) throw new Error(`cat: ${path}: fetch failed (${response.status})`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const article = doc.querySelector('article');
    const text = article ? (article.textContent ?? '').trim() : '';
    cache.set(path, text);
    return text;
  };

  const allPaths = (): string[] => {
    const paths = new Set<string>();
    for (const d of Object.keys(manifest.dirs)) paths.add(d);
    for (const f of Object.keys(manifest.files)) paths.add(f);
    return [...paths];
  };

  return {
    cwd: () => current,
    chdir,
    resolve,
    list,
    isDir,
    isFile,
    entry,
    readFile,
    allPaths,
  };
}
