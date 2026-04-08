# unix-tty Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `unix-tty`, an Astro integration library that renders a Unix-terminal-style website from a markdown content collection, consumable as a git dependency by downstream sites (0x0064, frndvrgs).

**Architecture:** Astro integration that injects two routes (terminal `/` and reader `/read/[slug]`), registers a content collection, emits a build-time FS manifest, and exposes consumer config via a `virtual:unix-tty/config` vite alias. The terminal is modular strict TS under `src/scripts/terminal/`; reader uses Astro's build-time markdown rendering with custom Shiki themes.

**Tech Stack:** Astro ^6.1.5, TypeScript strict, Node ≥22.12, vanilla DOM (no UI framework), Shiki for syntax highlighting, Departure Mono font.

**Design reference:** [`2026-04-08-unix-tty-library-design.md`](./2026-04-08-unix-tty-library-design.md) — the validated design doc. Consult it whenever this plan references architecture decisions.

**Verification strategy:** No unit tests. The `demo/` subfolder is a minimal consumer site with dummy markdown that exercises the full library. After each meaningful change, run `astro build` or `astro dev` from `demo/` and verify the behavior in browser or build output. Every task ends with a commit.

---

## Phase 0 — Scaffolding

### Task 1: Initialize package.json and tsconfig

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Write `package.json`**

```json
{
  "name": "unix-tty",
  "type": "module",
  "version": "0.1.0-dev",
  "description": "Unix terminal-style website builder as an Astro integration",
  "repository": "github:frndvrgs/unix-tty",
  "license": "MIT",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "cd demo && astro dev",
    "build": "cd demo && astro build",
    "preview": "cd demo && astro preview",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    "./integration": "./src/integration.ts",
    "./content": "./src/content.ts",
    "./config": "./src/config.ts"
  },
  "files": [
    "src",
    "README.md"
  ],
  "peerDependencies": {
    "astro": "^6.1.5"
  },
  "devDependencies": {
    "astro": "^6.1.5",
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", "demo/**/*"],
  "exclude": ["**/node_modules", "**/dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "unix-tty/*": ["./src/*"]
    }
  }
}
```

**Step 3: Write `.gitignore`**

```
node_modules
dist
.astro
.DS_Store
*.log
demo/public/fs.json
```

**Step 4: Install dependencies**

Run: `cd /home/frndvrgs/software/frndvrgs/unix-tty && npm install`
Expected: creates `node_modules/` and `package-lock.json`, no errors.

**Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore package-lock.json
git commit -m "chore: scaffold package.json, tsconfig, gitignore"
```

---

### Task 2: Create the src directory skeleton

**Files:**
- Create: `src/version.ts`
- Create: `src/config.ts`
- Create: `src/content.ts` (stub)
- Create: `src/integration.ts` (stub)

**Step 1: Write `src/version.ts`**

```ts
// The Unix version string advertised by the TTY. Bump this and cut a new
// release to roll a new version out to every consumer.
export const UNIX_VERSION = '6.4.0-release';
```

**Step 2: Write `src/config.ts`**

```ts
export type ThemeName = 'ember' | 'phosphor' | 'neutral';

export interface UnixTtyConfig {
  site: {
    title: string;
    description: string;
    url: string;
  };
  terminal: {
    hostname: string;
    username: string;
    home: string;
    defaultTheme: ThemeName;
    /**
     * Motd lines shown on boot. Supports placeholders:
     * - `{version}` — replaced with UNIX_VERSION from version.ts
     * - `{buildDate}` — replaced with the ISO date at build time
     */
    motd: string[];
  };
  reader: {
    theme: ThemeName;
  };
}

/**
 * Identity function with a type annotation. Gives consumers autocomplete
 * and schema errors against UnixTtyConfig in their site.config.ts.
 */
export function defineConfig(config: UnixTtyConfig): UnixTtyConfig {
  return config;
}
```

**Step 3: Write `src/content.ts` (stub — real schema comes in Task 6)**

```ts
// Placeholder. See Task 6 for the full content collection definition.
export const collections = {};
```

**Step 4: Write `src/integration.ts` (stub — real integration comes in Task 9)**

```ts
import type { AstroIntegration } from 'astro';
import type { UnixTtyConfig } from './config.js';

export default function unixTty(_config: UnixTtyConfig): AstroIntegration {
  return {
    name: 'unix-tty',
    hooks: {
      'astro:config:setup': () => {
        // See Task 9 for the full implementation.
      },
    },
  };
}
```

**Step 5: Typecheck**

Run: `npm run typecheck`
Expected: passes with no errors.

**Step 6: Commit**

```bash
git add src/
git commit -m "chore: add src skeleton (config, version, integration stub)"
```

---

## Phase 1 — Demo site + content plumbing

### Task 3: Scaffold the demo site

The demo is a minimal consumer that proves the integration works end-to-end. It's the project's smoke test.

**Files:**
- Create: `demo/package.json`
- Create: `demo/astro.config.mjs`
- Create: `demo/tsconfig.json`
- Create: `demo/site.config.ts`
- Create: `demo/src/content.config.ts`
- Create: `demo/src/env.d.ts`
- Create: `demo/public/.gitkeep`

**Step 1: Write `demo/package.json`**

```json
{
  "name": "unix-tty-demo",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^6.1.5",
    "unix-tty": "file:.."
  }
}
```

**Step 2: Write `demo/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

**Step 3: Write `demo/astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import unixTty from 'unix-tty/integration';
import site from './site.config.ts';

export default defineConfig({
  integrations: [unixTty(site)],
});
```

**Step 4: Write `demo/site.config.ts`**

```ts
import { defineConfig } from 'unix-tty/config';

export default defineConfig({
  site: {
    title: 'unix-tty demo',
    description: 'Minimal consumer site used to smoke-test the library.',
    url: 'http://localhost:4321',
  },
  terminal: {
    hostname: 'demo',
    username: 'user',
    home: '/home/user',
    defaultTheme: 'ember',
    motd: [
      'unix {version} | tty0 | utf-8',
      'last login: {buildDate}',
      "type 'help' for a list of commands",
    ],
  },
  reader: {
    theme: 'ember',
  },
});
```

**Step 5: Write `demo/src/content.config.ts`**

```ts
export { collections } from 'unix-tty/content';
```

**Step 6: Write `demo/src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module 'virtual:unix-tty/config' {
  import type { UnixTtyConfig } from 'unix-tty/config';
  const config: UnixTtyConfig;
  export default config;
}
```

**Step 7: Create empty `demo/public/.gitkeep`**

```bash
touch demo/public/.gitkeep
```

**Step 8: Install demo dependencies**

Run: `cd demo && npm install && cd ..`
Expected: links `unix-tty` from the parent, creates `demo/node_modules`.

**Step 9: Commit**

```bash
git add demo/
git commit -m "chore: scaffold demo consumer site"
```

---

### Task 4: Drop dummy markdown into the demo

**Files:**
- Create: `demo/src/content/docs/home/user/profile/about.md`
- Create: `demo/src/content/docs/home/user/projects/sample.md`

**Step 1: Write `demo/src/content/docs/home/user/profile/about.md`**

```markdown
---
title: about
author: demo
---

# about

Hello from the unix-tty demo. This file lives at `/home/user/profile/about.md`
in the virtual filesystem, mirrored from its position under
`src/content/docs/`.

## a code block

```ts
const greeting: string = 'hello, world';
console.log(greeting);
```

Press **Escape** or the X button to return to the terminal.
```

**Step 2: Write `demo/src/content/docs/home/user/projects/sample.md`**

```markdown
---
title: sample project
---

# sample project

A second dummy document to verify that multiple entries coexist and the
`ls` / `cd` commands walk the directory tree correctly.
```

**Step 3: Commit**

```bash
git add demo/src/content/docs/
git commit -m "chore: add dummy markdown for demo site"
```

---

### Task 5: Define the real content collection schema

**Files:**
- Modify: `src/content.ts`

**Step 1: Replace `src/content.ts` with the real schema**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = { docs };
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Smoke test that the demo picks up the collection**

Run: `cd demo && npx astro sync && cd ..`
Expected: `.astro/` generated, no errors, collection recognized.

**Step 4: Commit**

```bash
git add src/content.ts
git commit -m "feat: define docs content collection schema"
```

---

### Task 6: Build-time FS manifest builder

**Files:**
- Create: `src/lib/buildFsManifest.ts`

**Step 1: Write `src/lib/buildFsManifest.ts`**

```ts
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
  files: Record<string, { slug: string; title: string }>;
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
  const files: Record<string, { slug: string; title: string }> = {};
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
    files[virtualPath] = { slug, title: entry.data.title };
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
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/lib/buildFsManifest.ts
git commit -m "feat: build-time virtual filesystem manifest builder"
```

---

### Task 7: Real integration — routes, virtual config, build hook

**Files:**
- Modify: `src/integration.ts`
- Create: `src/lib/shikiThemes.ts` (stub — real themes in Task 14)

**Step 1: Write `src/lib/shikiThemes.ts` (stub)**

```ts
import type { ShikiConfig } from 'astro';

// Real themes defined in Task 14. This stub keeps the integration importable.
export const shikiThemes: NonNullable<ShikiConfig['themes']> = {};
```

**Step 2: Rewrite `src/integration.ts`**

```ts
import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { UnixTtyConfig } from './config.js';
import { UNIX_VERSION } from './version.js';
import { shikiThemes } from './lib/shikiThemes.js';

export default function unixTty(config: UnixTtyConfig): AstroIntegration {
  const libRoot = path.dirname(fileURLToPath(import.meta.url));

  return {
    name: 'unix-tty',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig, config: _astroConfig }) => {
        injectRoute({
          pattern: '/',
          entrypoint: 'unix-tty/src/routes/index.astro',
        });
        injectRoute({
          pattern: '/read/[slug]',
          entrypoint: 'unix-tty/src/routes/read/[slug].astro',
        });

        updateConfig({
          markdown: {
            shikiConfig: {
              themes: shikiThemes,
              defaultColor: false,
            },
          },
          vite: {
            resolve: {
              alias: {
                'virtual:unix-tty/config': path.resolve(process.cwd(), 'site.config.ts'),
              },
            },
          },
        });
      },

      'astro:build:start': async () => {
        const { buildFsManifest } = await import('./lib/buildFsManifest.js');
        const manifest = await buildFsManifest({
          user: config.terminal.username,
          hostname: config.terminal.hostname,
          home: config.terminal.home,
          motd: config.terminal.motd,
          defaultTheme: config.terminal.defaultTheme,
          unixVersion: UNIX_VERSION,
        });

        const outPath = path.resolve(process.cwd(), 'public', 'fs.json');
        await writeFile(outPath, JSON.stringify(manifest, null, 2));
      },

      'astro:server:setup': async ({ server: _server }) => {
        const { buildFsManifest } = await import('./lib/buildFsManifest.js');
        const manifest = await buildFsManifest({
          user: config.terminal.username,
          hostname: config.terminal.hostname,
          home: config.terminal.home,
          motd: config.terminal.motd,
          defaultTheme: config.terminal.defaultTheme,
          unixVersion: UNIX_VERSION,
        });

        const outPath = path.resolve(process.cwd(), 'public', 'fs.json');
        await writeFile(outPath, JSON.stringify(manifest, null, 2));
      },
    },
  };
  // libRoot kept for future use (loading shipped assets by absolute path).
  void libRoot;
}
```

**Step 3: Create placeholder route files so injection resolves**

```bash
mkdir -p src/routes/read
```

Create `src/routes/index.astro`:

```astro
---
// Placeholder — real terminal page in Task 21.
---
<!doctype html>
<html>
  <head><title>unix-tty</title></head>
  <body>terminal placeholder</body>
</html>
```

Create `src/routes/read/[slug].astro`:

```astro
---
// Placeholder — real reader page in Task 16.
export async function getStaticPaths() {
  return [];
}
---
<!doctype html>
<html>
  <head><title>reader</title></head>
  <body>reader placeholder</body>
</html>
```

**Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 5: Smoke — demo build**

Run: `cd demo && npx astro build && cd ..`
Expected: build succeeds, `demo/dist/` created, `demo/public/fs.json` exists containing the site config + dummy files from Task 4.

**Step 6: Inspect the manifest**

Run (via Read tool): `demo/public/fs.json`
Expected: contains `/home/user/profile/about.md` and `/home/user/projects/sample.md` entries with slugs `about` and `sample`.

**Step 7: Commit**

```bash
git add src/integration.ts src/lib/shikiThemes.ts src/routes/
git commit -m "feat: integration injects routes, emits fs manifest, wires vite alias"
```

---

## Phase 2 — Styles, layouts, reader page

### Task 8: Theme tokens CSS

**Files:**
- Create: `src/styles/themes.css`

**Step 1: Write `src/styles/themes.css`**

```css
:root {
  --fg: #ffa133;
  --bg: #222222;
  --dim: #7a5a2a;
}

.theme-ember {
  --fg: #ffa133;
  --bg: #222222;
  --dim: #7a5a2a;
}

.theme-phosphor {
  --fg: #39d353;
  --bg: #0d1117;
  --dim: #1b6928;
}

.theme-neutral {
  --fg: #ffffff;
  --bg: #000000;
  --dim: #555555;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
}
```

**Step 2: Commit**

```bash
git add src/styles/themes.css
git commit -m "feat: theme token CSS (ember, phosphor, neutral)"
```

---

### Task 9: Ship Departure Mono font

**Files:**
- Create: `src/assets/font/` (copy from `/home/frndvrgs/software/0x0064/0x0064/assets/font/`)
- Create: `src/styles/font.css`

**Step 1: Copy font files**

Run:
```bash
mkdir -p src/assets/font
cp /home/frndvrgs/software/0x0064/0x0064/assets/font/*.woff2 src/assets/font/ 2>/dev/null || true
cp /home/frndvrgs/software/0x0064/0x0064/assets/font/*.woff src/assets/font/ 2>/dev/null || true
ls src/assets/font/
```

Expected: at least one `.woff2` file listed.

**Step 2: Write `src/styles/font.css`**

```css
@font-face {
  font-family: 'Departure Mono';
  src: url('../assets/font/DepartureMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}

html {
  font-family: 'Departure Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.6;
}
```

Adjust the `src:` path to match the actual file that was copied (e.g. `DepartureMono-Regular.woff2`).

**Step 3: Commit**

```bash
git add src/assets/font/ src/styles/font.css
git commit -m "feat: ship Departure Mono font at 11px"
```

---

### Task 10: Reader page CSS

**Files:**
- Create: `src/styles/reader.css`

**Step 1: Write `src/styles/reader.css`**

Keep the styling close to the current vanilla reader page: constrained width, subtle code-block backgrounds, close button at top-right. This is a first pass — refine later if needed.

```css
.reader {
  min-height: 100vh;
  padding: 3rem 2rem 6rem;
  display: flex;
  justify-content: center;
}

.reader main {
  width: 100%;
  max-width: 72ch;
}

.reader article {
  color: var(--fg);
}

.reader article h1,
.reader article h2,
.reader article h3 {
  color: var(--fg);
  border-bottom: 1px solid var(--dim);
  padding-bottom: 0.3em;
  margin-top: 2em;
}

.reader article a {
  color: var(--fg);
  text-decoration: underline;
}

.reader article code {
  color: var(--fg);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}

.reader article pre {
  padding: 1rem;
  border: 1px solid var(--dim);
  overflow-x: auto;
}

.reader article pre code {
  background: transparent;
  padding: 0;
}

.reader-close {
  position: fixed;
  top: 1rem;
  right: 1rem;
  color: var(--fg);
  text-decoration: none;
  font-size: 1.5em;
}

.reader-close:hover {
  opacity: 0.7;
}

/* Scrollbar styling to match theme */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
```

**Step 2: Commit**

```bash
git add src/styles/reader.css
git commit -m "feat: reader page CSS"
```

---

### Task 11: Terminal CSS

**Files:**
- Create: `src/styles/terminal.css`

**Step 1: Write `src/styles/terminal.css`**

```css
.terminal {
  min-height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
  color: var(--fg);
  background: var(--bg);
  cursor: text;
  /* Terminal is case-sensitive — no text-transform. */
}

.terminal-line {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  min-height: 17.6px;
}

.terminal-dim {
  color: var(--dim);
}

.terminal-logo {
  display: block;
  margin: 1rem 0;
  image-rendering: pixelated;
}

.terminal-prompt-line {
  display: flex;
  align-items: baseline;
  line-height: 1.6;
  min-height: 17.6px;
}

.terminal-prompt {
  color: var(--fg);
  white-space: pre;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--fg);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  padding: 0;
  margin: 0;
  caret-color: var(--fg);
}

.terminal-error {
  color: var(--fg);
}
```

**Step 2: Commit**

```bash
git add src/styles/terminal.css
git commit -m "feat: terminal page CSS"
```

---

### Task 12: ReaderLayout component

**Files:**
- Create: `src/layouts/ReaderLayout.astro`

**Step 1: Write `src/layouts/ReaderLayout.astro`**

```astro
---
import '../styles/themes.css';
import '../styles/font.css';
import '../styles/reader.css';
import type { ThemeName } from '../config.js';

interface Props {
  title: string;
  theme: ThemeName;
}

const { title, theme } = Astro.props;
---
<!doctype html>
<html lang="en" class={`theme-${theme}`}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body class="reader">
    <a class="reader-close" href="/" aria-label="close">×</a>
    <slot />
    <script>
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') window.location.assign('/');
      });
    </script>
  </body>
</html>
```

**Step 2: Commit**

```bash
git add src/layouts/ReaderLayout.astro
git commit -m "feat: ReaderLayout with themed classes and escape-to-home"
```

---

### Task 13: Real reader route

**Files:**
- Modify: `src/routes/read/[slug].astro`

**Step 1: Replace the placeholder with the real reader route**

```astro
---
import { getCollection, render } from 'astro:content';
import ReaderLayout from '../../layouts/ReaderLayout.astro';
import config from 'virtual:unix-tty/config';

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return entries.map((entry) => {
    const segments = entry.id.split('/');
    const slug = segments[segments.length - 1];
    return { params: { slug }, props: { entry } };
  });
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<ReaderLayout title={entry.data.title} theme={config.reader.theme}>
  <main>
    <article>
      <Content />
    </article>
  </main>
</ReaderLayout>
```

**Step 2: Smoke — start dev server and verify reader**

Run: `cd demo && npx astro build && cd ..`
Expected: build succeeds. Inspect `demo/dist/read/about/index.html` — contains the rendered markdown from `about.md`, theme class `theme-ember` on `<html>`.

**Step 3: Commit**

```bash
git add src/routes/read/[slug].astro
git commit -m "feat: real reader route with build-time markdown"
```

---

### Task 14: Custom Shiki themes matching ember/phosphor/neutral

**Files:**
- Modify: `src/lib/shikiThemes.ts`

**Step 1: Rewrite `src/lib/shikiThemes.ts`**

Each theme is a minimal VS Code-compatible Shiki theme with token colors tuned to the brand tone.

```ts
import type { ShikiConfig } from 'astro';

type ThemeJson = NonNullable<ShikiConfig['themes']>[string];

function makeTheme(name: string, fg: string, bg: string, dim: string): ThemeJson {
  return {
    name,
    type: 'dark',
    colors: {
      'editor.background': bg,
      'editor.foreground': fg,
    },
    tokenColors: [
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: dim, fontStyle: 'italic' } },
      { scope: ['string', 'string.quoted'], settings: { foreground: fg } },
      { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: fg } },
      { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: fg, fontStyle: 'bold' } },
      { scope: ['entity.name.function', 'support.function'], settings: { foreground: fg } },
      { scope: ['entity.name.class', 'entity.name.type'], settings: { foreground: fg } },
      { scope: ['variable', 'variable.parameter'], settings: { foreground: fg } },
      { scope: ['punctuation'], settings: { foreground: dim } },
    ],
  } as ThemeJson;
}

export const shikiThemes: NonNullable<ShikiConfig['themes']> = {
  light: makeTheme('ember', '#ffa133', '#222222', '#7a5a2a'),
  dark: makeTheme('ember', '#ffa133', '#222222', '#7a5a2a'),
};
```

**Note:** Astro's `shikiConfig.themes` expects a `{ light, dark }` pair (dual-theme mode). Since we want a single theme at a time driven by the consumer's `reader.theme` config, we set both slots to the same theme. A more elaborate approach (per-site theme switching) is out of scope for v0.1.0.

A follow-up could accept the theme name via a function and generate at integration setup time using the consumer's `config.reader.theme`. For now, ember is hardcoded — matches the demo and the 0x0064 target.

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Smoke — demo build with code block**

Run: `cd demo && npx astro build && cd ..`
Expected: `demo/dist/read/about/index.html` contains a `<pre>` block with syntax-highlighted `const greeting: string = ...`, colors drawn from the ember palette.

**Step 4: Commit**

```bash
git add src/lib/shikiThemes.ts
git commit -m "feat: ember Shiki theme for reader code blocks"
```

---

## Phase 3 — Terminal engine

### Task 15: Terminal types

**Files:**
- Create: `src/scripts/terminal/types.ts`

**Step 1: Write `src/scripts/terminal/types.ts`**

```ts
import type { ThemeName } from '../../config.js';

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
  files: Record<string, { slug: string; title: string }>;
}

export interface OutputSink {
  line(text?: string): void;
  dim(text: string): void;
  error(text: string): void;
  block(lines: string[]): void;
  clear(): void;
}

export interface ThemeController {
  get(): ThemeName;
  set(theme: ThemeName): void;
  cycle(): ThemeName;
}

export interface HistoryController {
  push(entry: string): void;
  prev(): string | null;
  next(): string | null;
  reset(): void;
  all(): string[];
}

export interface VirtualFs {
  cwd(): string;
  chdir(path: string): void;
  resolve(path: string): string;
  list(path: string): string[] | null;
  isDir(path: string): boolean;
  isFile(path: string): boolean;
  entry(path: string): { slug: string; title: string } | null;
  readFile(path: string): Promise<string>;
  allPaths(): string[];
}

export interface CommandContext {
  fs: VirtualFs;
  args: string[];
  raw: string;
  out: OutputSink;
  theme: ThemeController;
  history: HistoryController;
  manifest: FsManifest;
}

export interface Command {
  name: string;
  summary: string;
  run(ctx: CommandContext): void | Promise<void>;
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/scripts/terminal/types.ts
git commit -m "feat: terminal type definitions"
```

---

### Task 16: Output sink

**Files:**
- Create: `src/scripts/terminal/output.ts`

**Step 1: Write `src/scripts/terminal/output.ts`**

```ts
import type { OutputSink } from './types.js';

export function createOutput(root: HTMLElement, scrollHost: HTMLElement): OutputSink {
  const append = (el: HTMLElement) => {
    root.appendChild(el);
    if (!isSelecting()) scrollHost.scrollTop = scrollHost.scrollHeight;
  };

  const line = (text = '') => {
    const el = document.createElement('div');
    el.className = 'terminal-line';
    el.textContent = text;
    append(el);
  };

  const dim = (text: string) => {
    const el = document.createElement('div');
    el.className = 'terminal-line terminal-dim';
    el.textContent = text;
    append(el);
  };

  const error = (text: string) => {
    const el = document.createElement('div');
    el.className = 'terminal-line terminal-error';
    el.textContent = text;
    append(el);
  };

  const block = (lines: string[]) => {
    for (const l of lines) line(l);
  };

  const clear = () => {
    while (root.firstChild) root.removeChild(root.firstChild);
  };

  return { line, dim, error, block, clear };
}

export function isSelecting(): boolean {
  const sel = window.getSelection();
  return !!sel && sel.toString().length > 0;
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/scripts/terminal/output.ts
git commit -m "feat: terminal output sink with selection-aware scroll"
```

---

### Task 17: Virtual filesystem

**Files:**
- Create: `src/scripts/terminal/fs.ts`

**Step 1: Write `src/scripts/terminal/fs.ts`**

```ts
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
    return '/' + stack.join('/');
  };

  const resolve = (input: string): string => {
    if (!input) return current;
    if (input === '~') return home;
    if (input.startsWith('~/')) input = home + '/' + input.slice(2);

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
    // The reader page is at /read/<slug>, but the raw markdown is inside the
    // content collection which Astro does not serve directly. For `cat`, we
    // reach into the built HTML of the reader page and extract its text — no
    // server endpoint needed. Simpler alternative: fetch the rendered page
    // and parse out the <article> text content.
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
```

**Note:** `cat` strategy is deliberately the "fetch the rendered HTML and extract the article text" approach. This avoids needing a separate `/docs/<slug>.md` endpoint. Raw markdown source is not exposed — `cat` prints the prose, rendered-to-text. Reasonable trade-off for a static build.

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/scripts/terminal/fs.ts
git commit -m "feat: virtual filesystem with path resolution and cat via rendered page"
```

---

### Task 18: Theme controller

**Files:**
- Create: `src/scripts/terminal/theme.ts`
- Create: `src/scripts/shared/themes.ts`
- Create: `src/scripts/shared/favicon.ts`

**Step 1: Write `src/scripts/shared/themes.ts`**

```ts
import type { ThemeName } from '../../config.js';

export const THEME_NAMES: readonly ThemeName[] = ['ember', 'phosphor', 'neutral'] as const;

export interface ThemeColors {
  fg: string;
  bg: string;
  dim: string;
}

export const THEME_COLORS: Record<ThemeName, ThemeColors> = {
  ember: { fg: '#ffa133', bg: '#222222', dim: '#7a5a2a' },
  phosphor: { fg: '#39d353', bg: '#0d1117', dim: '#1b6928' },
  neutral: { fg: '#ffffff', bg: '#000000', dim: '#555555' },
};

// 8x8 pixel map of the character "x" for the favicon.
// 1 = foreground, 0 = background.
export const FAVICON_X: readonly (readonly number[])[] = [
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
];
```

**Step 2: Write `src/scripts/shared/favicon.ts`**

```ts
import type { ThemeName } from '../../config.js';
import { FAVICON_X, THEME_COLORS } from './themes.js';

export function refreshFavicon(theme: ThemeName): void {
  const colors = THEME_COLORS[theme];
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, size, size);

  const px = size / FAVICON_X.length;
  ctx.fillStyle = colors.fg;
  for (let y = 0; y < FAVICON_X.length; y++) {
    const row = FAVICON_X[y]!;
    for (let x = 0; x < row.length; x++) {
      if (row[x]) ctx.fillRect(x * px, y * px, px, px);
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = dataUrl;
}
```

**Step 3: Write `src/scripts/terminal/theme.ts`**

```ts
import type { ThemeName } from '../../config.js';
import { THEME_NAMES } from '../shared/themes.js';
import { refreshFavicon } from '../shared/favicon.js';
import type { ThemeController } from './types.js';

export function createTheme(initial: ThemeName): ThemeController {
  let current: ThemeName = initial;
  const root = document.documentElement;

  const apply = (name: ThemeName) => {
    for (const n of THEME_NAMES) root.classList.remove(`theme-${n}`);
    root.classList.add(`theme-${name}`);
    refreshFavicon(name);
  };

  apply(initial);

  return {
    get: () => current,
    set: (theme) => {
      current = theme;
      apply(theme);
    },
    cycle: () => {
      const i = THEME_NAMES.indexOf(current);
      const next = THEME_NAMES[(i + 1) % THEME_NAMES.length]!;
      current = next;
      apply(next);
      return next;
    },
  };
}
```

**Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 5: Commit**

```bash
git add src/scripts/shared/ src/scripts/terminal/theme.ts
git commit -m "feat: theme controller + favicon canvas generator"
```

---

### Task 19: History and tab completion

**Files:**
- Create: `src/scripts/terminal/history.ts`
- Create: `src/scripts/terminal/tabComplete.ts`

**Step 1: Write `src/scripts/terminal/history.ts`**

```ts
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
```

**Step 2: Write `src/scripts/terminal/tabComplete.ts`**

```ts
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
  // Completing the command itself (position 0).
  if (!value.includes(' ')) {
    const matches = commands.filter((c) => c.startsWith(value));
    if (matches.length === 0) return { value, candidates: [] };
    if (matches.length === 1) return { value: matches[0]! + ' ', candidates: [] };
    return { value: commonPrefix(matches), candidates: matches };
  }

  // Completing a path argument.
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
```

**Step 3: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 4: Commit**

```bash
git add src/scripts/terminal/history.ts src/scripts/terminal/tabComplete.ts
git commit -m "feat: terminal history and tab completion"
```

---

### Task 20: Simple commands (pwd, whoami, uname, date, echo, clear)

**Files:**
- Create: `src/scripts/terminal/commands/pwd.ts`
- Create: `src/scripts/terminal/commands/whoami.ts`
- Create: `src/scripts/terminal/commands/uname.ts`
- Create: `src/scripts/terminal/commands/date.ts`
- Create: `src/scripts/terminal/commands/echo.ts`
- Create: `src/scripts/terminal/commands/clear.ts`

**Step 1: Write each command**

`src/scripts/terminal/commands/pwd.ts`:

```ts
import type { Command } from '../types.js';

const pwd: Command = {
  name: 'pwd',
  summary: 'print current directory',
  run: ({ fs, out }) => out.line(fs.cwd()),
};

export default pwd;
```

`src/scripts/terminal/commands/whoami.ts`:

```ts
import type { Command } from '../types.js';

const whoami: Command = {
  name: 'whoami',
  summary: 'print current user',
  run: ({ manifest, out }) => out.line(manifest.site.user),
};

export default whoami;
```

`src/scripts/terminal/commands/uname.ts`:

```ts
import type { Command } from '../types.js';

const uname: Command = {
  name: 'uname',
  summary: 'print system info',
  run: ({ manifest, args, out }) => {
    if (args.includes('-a')) {
      out.line(`unix ${manifest.site.hostname} ${manifest.site.unixVersion} tty0 utf-8`);
    } else {
      out.line('unix');
    }
  },
};

export default uname;
```

`src/scripts/terminal/commands/date.ts`:

```ts
import type { Command } from '../types.js';

const date: Command = {
  name: 'date',
  summary: 'print current date',
  run: ({ out }) => out.line(new Date().toString()),
};

export default date;
```

`src/scripts/terminal/commands/echo.ts`:

```ts
import type { Command } from '../types.js';

const echo: Command = {
  name: 'echo',
  summary: 'print arguments',
  run: ({ args, out }) => out.line(args.join(' ')),
};

export default echo;
```

`src/scripts/terminal/commands/clear.ts`:

```ts
import type { Command } from '../types.js';

const clear: Command = {
  name: 'clear',
  summary: 'clear the screen',
  run: ({ out }) => out.clear(),
};

export default clear;
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/scripts/terminal/commands/
git commit -m "feat: basic commands (pwd, whoami, uname, date, echo, clear)"
```

---

### Task 21: ls / cd / cat / read / history / colors / help

**Files:**
- Create: `src/scripts/terminal/commands/ls.ts`
- Create: `src/scripts/terminal/commands/cd.ts`
- Create: `src/scripts/terminal/commands/cat.ts`
- Create: `src/scripts/terminal/commands/read.ts`
- Create: `src/scripts/terminal/commands/history.ts`
- Create: `src/scripts/terminal/commands/colors.ts`
- Create: `src/scripts/terminal/commands/help.ts`

**Step 1: `ls.ts`**

```ts
import type { Command } from '../types.js';

const ls: Command = {
  name: 'ls',
  summary: 'list directory contents',
  run: ({ fs, args, out }) => {
    const long = args.includes('-l') || args.includes('-la') || args.includes('-a');
    const target = args.filter((a) => !a.startsWith('-'))[0] ?? '.';
    const path = fs.resolve(target);

    if (fs.isFile(path)) {
      out.line(target);
      return;
    }

    const children = fs.list(path);
    if (!children) {
      out.error(`ls: ${target}: no such directory`);
      return;
    }

    if (long) {
      for (const c of children) {
        const childPath = path === '/' ? `/${c}` : `${path}/${c}`;
        const kind = fs.isDir(childPath) ? 'd' : '-';
        out.line(`${kind}rw-r--r--  1 user user  ${c}`);
      }
    } else {
      out.line(children.join('  '));
    }
  },
};

export default ls;
```

**Step 2: `cd.ts`**

```ts
import type { Command } from '../types.js';

const cd: Command = {
  name: 'cd',
  summary: 'change directory',
  run: ({ fs, args, manifest, out }) => {
    const target = args[0] ?? manifest.site.home;
    try {
      fs.chdir(target);
    } catch (err) {
      out.error(err instanceof Error ? err.message : String(err));
    }
  },
};

export default cd;
```

**Step 3: `cat.ts`**

```ts
import type { Command } from '../types.js';

const cat: Command = {
  name: 'cat',
  summary: 'print file contents',
  run: async ({ fs, args, out }) => {
    if (args.length === 0) {
      out.error('cat: missing operand');
      return;
    }
    for (const target of args) {
      const path = fs.resolve(target);
      try {
        const text = await fs.readFile(path);
        for (const line of text.split('\n')) out.line(line);
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err));
      }
    }
  },
};

export default cat;
```

**Step 4: `read.ts`**

```ts
import type { Command } from '../types.js';

const read: Command = {
  name: 'read',
  summary: 'open a file in the reader page',
  run: ({ fs, args, out }) => {
    if (args.length === 0) {
      out.error('read: missing operand');
      return;
    }
    const target = args[0]!;
    const path = fs.resolve(target);
    const entry = fs.entry(path);
    if (!entry) {
      out.error(`read: ${target}: no such file`);
      return;
    }
    window.location.assign(`/read/${entry.slug}/`);
  },
};

export default read;
```

**Step 5: `history.ts`**

```ts
import type { Command } from '../types.js';

const history: Command = {
  name: 'history',
  summary: 'show command history',
  run: ({ history, out }) => {
    const entries = history.all();
    entries.forEach((entry, i) => {
      const idx = String(i + 1).padStart(4, ' ');
      out.line(`${idx}  ${entry}`);
    });
  },
};

export default history;
```

**Step 6: `colors.ts`**

```ts
import type { Command } from '../types.js';

const colors: Command = {
  name: 'colors',
  summary: 'cycle through color themes',
  run: ({ theme, out }) => {
    const next = theme.cycle();
    out.line(`theme: ${next}`);
  },
};

export default colors;
```

**Step 7: `help.ts`**

```ts
import type { Command } from '../types.js';

const help: Command = {
  name: 'help',
  summary: 'list available commands',
  run: ({ out }) => {
    // Command list is injected by the registry at boot via a closure;
    // this implementation is replaced by the registry in commands/index.ts.
    out.line('help: command list not bound');
  },
};

export default help;
```

**Step 8: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 9: Commit**

```bash
git add src/scripts/terminal/commands/
git commit -m "feat: ls, cd, cat, read, history, colors, help commands"
```

---

### Task 22: Command registry

**Files:**
- Create: `src/scripts/terminal/commands/index.ts`

**Step 1: Write `src/scripts/terminal/commands/index.ts`**

```ts
import type { Command } from '../types.js';
import cat from './cat.js';
import cd from './cd.js';
import clear from './clear.js';
import colors from './colors.js';
import dateCmd from './date.js';
import echo from './echo.js';
import historyCmd from './history.js';
import ls from './ls.js';
import pwd from './pwd.js';
import read from './read.js';
import uname from './uname.js';
import whoami from './whoami.js';

const base: Command[] = [
  ls,
  cd,
  cat,
  read,
  pwd,
  clear,
  whoami,
  uname,
  dateCmd,
  echo,
  historyCmd,
  colors,
];

export function buildRegistry(): Record<string, Command> {
  const registry: Record<string, Command> = {};
  for (const c of base) registry[c.name] = c;

  // help iterates the registry at runtime.
  registry.help = {
    name: 'help',
    summary: 'list available commands',
    run: ({ out }) => {
      const names = Object.keys(registry).sort();
      const width = Math.max(...names.map((n) => n.length));
      out.line('available commands:');
      for (const name of names) {
        const cmd = registry[name]!;
        out.line(`  ${name.padEnd(width)}  ${cmd.summary}`);
      }
    },
  };

  // alias: `ll` == `ls -la`
  registry.ll = {
    name: 'll',
    summary: 'alias for ls -la',
    run: (ctx) => registry.ls!.run({ ...ctx, args: ['-la', ...ctx.args] }),
  };

  return registry;
}

export function commandNames(registry: Record<string, Command>): string[] {
  return Object.keys(registry).sort();
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/scripts/terminal/commands/index.ts
git commit -m "feat: command registry with help and ll alias"
```

---

### Task 23: boot.ts — tie everything together

**Files:**
- Create: `src/scripts/terminal/boot.ts`

**Step 1: Write `src/scripts/terminal/boot.ts`**

```ts
import type { UnixTtyConfig } from '../../config.js';
import { createOutput, isSelecting } from './output.js';
import { createFs } from './fs.js';
import { createTheme } from './theme.js';
import { createHistory } from './history.js';
import { complete } from './tabComplete.js';
import { buildRegistry, commandNames } from './commands/index.js';
import type { FsManifest } from './types.js';

export default async function boot(config: UnixTtyConfig): Promise<void> {
  const root = document.getElementById('terminal');
  if (!root) throw new Error('unix-tty: #terminal element not found');

  const response = await fetch('/fs.json');
  if (!response.ok) throw new Error('unix-tty: failed to load /fs.json');
  const manifest: FsManifest = await response.json();

  const output = createOutput(root, document.scrollingElement as HTMLElement ?? document.documentElement);
  const theme = createTheme(manifest.site.defaultTheme);
  const fs = createFs(manifest, manifest.site.home);
  const history = createHistory();
  const registry = buildRegistry();
  const names = commandNames(registry);

  // Motd
  for (const raw of manifest.site.motd) {
    const text = raw
      .replace('{version}', manifest.site.unixVersion)
      .replace('{buildDate}', manifest.site.buildDate);
    output.dim(text);
  }
  output.dim('');

  // Prompt line
  const promptLine = document.createElement('div');
  promptLine.className = 'terminal-prompt-line';
  const promptSpan = document.createElement('span');
  promptSpan.className = 'terminal-prompt';
  const input = document.createElement('input');
  input.className = 'terminal-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  promptLine.appendChild(promptSpan);
  promptLine.appendChild(input);
  root.appendChild(promptLine);

  const updatePrompt = () => {
    const cwd = fs.cwd();
    const display = cwd === manifest.site.home ? '~' : cwd;
    promptSpan.textContent = `${manifest.site.user}@${manifest.site.hostname}:${display}$ `;
  };
  updatePrompt();

  // Run a single command line.
  const run = async (line: string) => {
    // Echo the entered line with the prompt above, as a history-style trace.
    const echoEl = document.createElement('div');
    echoEl.className = 'terminal-line';
    echoEl.textContent = `${promptSpan.textContent}${line}`;
    root.insertBefore(echoEl, promptLine);

    const trimmed = line.trim();
    if (!trimmed) return;
    history.push(trimmed);

    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = registry[name!];
    if (!cmd) {
      output.error(`${name}: command not found`);
      return;
    }

    try {
      await cmd.run({
        fs,
        args,
        raw: trimmed,
        out: {
          line: (text) => {
            const el = document.createElement('div');
            el.className = 'terminal-line';
            el.textContent = text ?? '';
            root.insertBefore(el, promptLine);
            if (!isSelecting()) window.scrollTo(0, document.body.scrollHeight);
          },
          dim: (text) => {
            const el = document.createElement('div');
            el.className = 'terminal-line terminal-dim';
            el.textContent = text;
            root.insertBefore(el, promptLine);
          },
          error: (text) => {
            const el = document.createElement('div');
            el.className = 'terminal-line terminal-error';
            el.textContent = text;
            root.insertBefore(el, promptLine);
          },
          block: (lines) => {
            for (const l of lines) {
              const el = document.createElement('div');
              el.className = 'terminal-line';
              el.textContent = l;
              root.insertBefore(el, promptLine);
            }
          },
          clear: () => {
            while (root.firstChild && root.firstChild !== promptLine) {
              root.removeChild(root.firstChild);
            }
          },
        },
        theme,
        history,
        manifest,
      });
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
    }

    updatePrompt();
  };

  // Keybindings
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = input.value;
      input.value = '';
      void run(value);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = history.prev();
      if (prev !== null) input.value = prev;
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = history.next();
      input.value = next ?? '';
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const result = complete({ value: input.value, commands: names, fs });
      input.value = result.value;
      if (result.candidates.length > 0) {
        const echo = document.createElement('div');
        echo.className = 'terminal-line';
        echo.textContent = `${promptSpan.textContent}${input.value}`;
        root.insertBefore(echo, promptLine);
        const list = document.createElement('div');
        list.className = 'terminal-line';
        list.textContent = result.candidates.join('  ');
        root.insertBefore(list, promptLine);
      }
      return;
    }
  });

  // Click-to-focus (guarded against selection)
  document.addEventListener('click', () => {
    if (!isSelecting()) input.focus();
  });

  input.focus();
  void config; // config currently unused at runtime — manifest carries what's needed
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Commit**

```bash
git add src/scripts/terminal/boot.ts
git commit -m "feat: terminal boot sequence — motd, prompt, input, command dispatch"
```

---

### Task 24: TerminalLayout + root route

**Files:**
- Create: `src/layouts/TerminalLayout.astro`
- Modify: `src/routes/index.astro`

**Step 1: Write `src/layouts/TerminalLayout.astro`**

```astro
---
import '../styles/themes.css';
import '../styles/font.css';
import '../styles/terminal.css';
import type { ThemeName } from '../config.js';

interface Props {
  title: string;
  theme: ThemeName;
}

const { title, theme } = Astro.props;
---
<!doctype html>
<html lang="en" class={`theme-${theme}`}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <div id="terminal" class="terminal"></div>
    <slot />
  </body>
</html>
```

**Step 2: Replace `src/routes/index.astro`**

```astro
---
import TerminalLayout from '../layouts/TerminalLayout.astro';
import config from 'virtual:unix-tty/config';
---
<TerminalLayout title={config.site.title} theme={config.terminal.defaultTheme}>
  <script>
    import boot from 'unix-tty/src/scripts/terminal/boot.ts';
    import config from 'virtual:unix-tty/config';
    void boot(config);
  </script>
</TerminalLayout>
```

**Step 3: Smoke — run the demo dev server**

Run: `cd demo && npx astro dev --host 127.0.0.1 &` (background)
Then verify at `http://127.0.0.1:4321/` — terminal boots, motd shows with version substituted, prompt appears, `help` lists commands, `ls ~/profile` shows `about.md`, `read about` navigates to the reader page, `colors` cycles themes, `cat about.md` prints text.

Kill the dev server after verifying.

**Step 4: Commit**

```bash
git add src/layouts/TerminalLayout.astro src/routes/index.astro
git commit -m "feat: terminal route wired to boot script"
```

---

## Phase 4 — Polish and release

### Task 25: README

**Files:**
- Modify: `README.md`

**Step 1: Rewrite `README.md`**

```markdown
# unix-tty

An Astro integration that turns a markdown content collection into a Unix-terminal-style website.

## Install

Consumer `package.json`:

    "dependencies": {
      "astro": "^6.1.5",
      "unix-tty": "github:frndvrgs/unix-tty"
    }

## Use

Consumer `astro.config.mjs`:

    import { defineConfig } from 'astro/config';
    import unixTty from 'unix-tty/integration';
    import site from './site.config.ts';

    export default defineConfig({
      integrations: [unixTty(site)],
    });

Consumer `site.config.ts`:

    import { defineConfig } from 'unix-tty/config';

    export default defineConfig({
      site: { title: 'my site', description: '...', url: 'https://example.com' },
      terminal: {
        hostname: 'example',
        username: 'user',
        home: '/home/user',
        defaultTheme: 'ember',
        motd: [
          'unix {version} | tty0 | utf-8',
          "type 'help' for a list of commands",
        ],
      },
      reader: { theme: 'ember' },
    });

Consumer `src/content.config.ts`:

    export { collections } from 'unix-tty/content';

Then drop markdown into `src/content/docs/home/user/...`. The file tree mirrors the virtual filesystem the terminal walks.

## Routes

- `/` — terminal
- `/read/<slug>` — reader page (build-time rendered markdown)

## Commands

`ls`, `cd`, `cat`, `read`, `pwd`, `clear`, `whoami`, `uname`, `date`, `echo`, `history`, `colors`, `help`, `ll`

## Development

    npm install
    npm run dev     # runs the demo site at demo/

## Themes

`ember`, `phosphor`, `neutral`. Cycled at runtime via the `colors` command.

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with install, config, routes, commands"
```

---

### Task 26: Final smoke check and tag

**Step 1: Full demo build**

Run: `cd demo && npx astro build && cd ..`
Expected: build succeeds, `demo/dist/index.html` and `demo/dist/read/about/index.html` and `demo/dist/read/sample/index.html` all exist.

**Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: passes.

**Step 3: Manual browser smoke**

Run: `cd demo && npx astro preview --host 127.0.0.1 &`

At `http://127.0.0.1:4321/`:
- [ ] Motd displays with `{version}` replaced by `6.4.0-release` and `{buildDate}` replaced by today's date.
- [ ] Prompt reads `user@demo:~$`.
- [ ] `help` lists all commands.
- [ ] `ls` shows `home`.
- [ ] `cd home/user/profile && ls` shows `about.md`.
- [ ] `cat about.md` prints the article text.
- [ ] `read about` navigates to `/read/about/`, shows the rendered markdown, Escape returns to `/`.
- [ ] `colors` cycles through the three themes; favicon updates each time.
- [ ] Tab completion works for commands and paths.
- [ ] Up/down arrows navigate history.

Kill the preview server.

**Step 4: Tag**

```bash
git tag v0.1.0
git log --oneline -20
```

**Step 5: Report results to the user**

Summarize what was built, list any smoke-check failures, and ask whether to push the tag to origin.

---

## Notes for the implementer

- **Always commit at the end of each task.** Small commits make recovery easy.
- **If a step fails**, read the error carefully before iterating. Don't bypass checks — fix the root cause.
- **Adjust font filenames** in Task 9 to match whatever `.woff2` actually copies over. If no `.woff2` exists in the source, use the `.woff`.
- **The `cat` implementation fetches the rendered reader page and extracts article text.** This is a deliberate simplification — the raw markdown isn't served. If you want true raw-markdown `cat`, add a separate endpoint in a follow-up.
- **Shiki themes** are intentionally monochromatic. Real syntax-highlighting variation is out of scope for v0.1.0 — the goal is legible code blocks that match the brand palette, not full language-aware theming.
- **Do not push to origin** without the user's explicit go-ahead.
