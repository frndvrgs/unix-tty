import { getCollection } from 'astro:content';
import type { ThemeName } from '../config.js';

export interface FsManifest {
  site: {
    user: string;
    hostname: string;
    home: string;
    motd: string[];
    defaultTheme: ThemeName;
    scanlines: boolean;
    flicker: boolean;
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
  scanlines: boolean;
  flicker: boolean;
  unixVersion: string;
}

export async function buildFsManifest(input: BuildFsManifestInput): Promise<FsManifest> {
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
    const virtualPath = `/${segments.join('/')}.md`;

    if (seenSlugs.has(slug)) {
      const prev = seenSlugs.get(slug);
      throw new Error(
        `unix-tty: duplicate basename "${slug}" — both "${prev}" and "${entry.id}" map to the same reader slug. Rename one.`,
      );
    }
    seenSlugs.set(slug, entry.id);

    let parent = '';
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i]!;
      const current = `${parent}/${name}`;
      addChild(parent || '/', name);
      addDir(current);
      parent = current;
    }

    addChild(parent || '/', `${basename}.md`);
    const body = (entry as { body?: string }).body ?? '';
    files[virtualPath] = {
      slug,
      title: entry.data.title,
      size: new TextEncoder().encode(body).length,
    };
  }

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
      scanlines: input.scanlines,
      flicker: input.flicker,
      unixVersion: input.unixVersion,
      buildDate: new Date().toISOString().slice(0, 10),
    },
    dirs,
    files,
  };
}
