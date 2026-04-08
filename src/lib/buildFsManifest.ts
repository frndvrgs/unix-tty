import { getCollection } from 'astro:content';
import type { ThemeName } from '../config.js';

export interface FsManifest {
  site: {
    user: string;
    hostname: string;
    home: string;
    motd: string[];
    defaultTheme: ThemeName;
    unixVersion: string;
    buildDate: string;
  };
  dirs: Record<string, { children: string[] }>;
  files: Record<string, { slug: string; title: string; size: number }>;
}

export interface BuildFsManifestInput {
  user: string;
  hostname: string;
  home: string;
  motd: string[];
  defaultTheme: ThemeName;
  unixVersion: string;
}

/**
 * Walk the docs collection and produce a static manifest describing the
 * terminal's virtual filesystem. Called from the integration's build hook.
 *
 * A collection entry with id `home/user/authors/frndvrgs` becomes a file
 * at virtual path `/home/user/authors/frndvrgs.md`, slug `frndvrgs`.
 *
 * Throws at build time on duplicate basenames (slug collisions).
 */
export async function buildFsManifest(
  input: BuildFsManifestInput,
): Promise<FsManifest> {
  const entries = await getCollection('docs');

  const dirs: Record<string, { children: string[] }> = {};
  const files: Record<string, { slug: string; title: string; size: number }> = {};
  const seenSlugs = new Map<string, string>();

  const addDir = (path: string) => {
    if (!dirs[path]) dirs[path] = { children: [] };
  };
  const addChild = (parent: string, name: string) => {
    addDir(parent);
    const list = dirs[parent]!.children;
    if (!list.includes(name)) list.push(name);
  };

  addDir('/');

  for (const entry of entries) {
    const segments = entry.id.split('/').filter(Boolean);
    const basename = segments[segments.length - 1]!;
    const slug = basename;
    const virtualPath = '/' + segments.join('/') + '.md';

    if (seenSlugs.has(slug)) {
      const prev = seenSlugs.get(slug);
      throw new Error(
        `unix-tty: duplicate basename "${slug}" — both "${prev}" and "${entry.id}" map to the same reader slug. Rename one.`,
      );
    }
    seenSlugs.set(slug, entry.id);

    // Register parent directory chain.
    let parent = '';
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i]!;
      const current = parent + '/' + name;
      addChild(parent || '/', name);
      addDir(current);
      parent = current;
    }

    // Register the file itself.
    addChild(parent || '/', basename + '.md');
    // Byte size of the raw markdown source. The content layer exposes the
    // body string on every entry; UTF-8 byte length matches char count for
    // ASCII and is "close enough" for unicode-heavy docs.
    const body = (entry as { body?: string }).body ?? '';
    files[virtualPath] = {
      slug,
      title: entry.data.title,
      size: new TextEncoder().encode(body).length,
    };
  }

  // Sort directory children for stable output.
  for (const d of Object.values(dirs)) {
    d.children.sort();
  }

  return {
    site: {
      user: input.user,
      hostname: input.hostname,
      home: input.home,
      motd: input.motd,
      defaultTheme: input.defaultTheme,
      unixVersion: input.unixVersion,
      buildDate: new Date().toISOString().slice(0, 10),
    },
    dirs,
    files,
  };
}
