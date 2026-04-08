# unix-tty — Design

**Date:** 2026-04-08
**Status:** Validated, ready to implement
**Author:** Fernando Vargas (frndvrgs)

## Summary

`unix-tty` is an Astro integration library that renders a Unix-terminal-style website from a virtual filesystem built out of markdown content collections. Consumers install it as a git dependency, supply a `site.config.ts`, drop markdown into `src/content/docs/`, and get a full TTY-style site with zero page files of their own.

Two downstream consumers are anticipated:

- **0x0064** (org site) — ember theme, 0x0064 branding, org content.
- **frndvrgs** (personal site) — neutral theme, personal content.

The library is built fresh; there is no code to port from a predecessor. The design draws on the patterns from the current `0x0064/0x0064` vanilla site, but re-implements them inside Astro's idioms.

## Goals

- Single source of truth for the TTY engine — two sites, one library, one bump to roll out changes.
- Author content as plain markdown files; virtual FS paths derive from the file tree.
- Build-time markdown rendering with Shiki (no runtime markdown parser, no CDN dependencies).
- Trivial consumer setup: one `astro.config.mjs`, one `site.config.ts`, a `content/docs/` tree.
- Full TypeScript strict mode; type the FS manifest, commands, and config.

## Non-goals

- No branding/logo export pages. The current `branding/*.html` stays in the 0x0064 repo as a standalone tool; it does not ship in the hosted site.
- No `branding` command in the terminal.
- No runtime theme persistence. Default theme comes from config; `colors` command cycles at runtime but resets on reload (matches current behavior).
- No npm registry publish. Git dependency only (`github:frndvrgs/unix-tty`).
- No test suite. Manual smoke check via the `demo/` site.

## Architecture

### Library package layout

```
unix-tty/
├─ package.json              # name: "unix-tty", exports map
├─ astro.config.mjs          # local dev/demo only
├─ tsconfig.json             # strict
├─ src/
│  ├─ integration.ts         # Astro integration entry
│  ├─ content.ts             # docs collection schema (re-exported by consumer)
│  ├─ config.ts              # UnixTtyConfig type + defineConfig() helper
│  ├─ version.ts             # UNIX_VERSION constant ("6.4.0-release")
│  ├─ routes/
│  │  ├─ index.astro         # terminal page, injected at "/"
│  │  └─ read/[slug].astro   # reader page, injected at "/read/[slug]"
│  ├─ layouts/
│  │  ├─ TerminalLayout.astro
│  │  └─ ReaderLayout.astro
│  ├─ styles/
│  │  ├─ themes.css
│  │  ├─ terminal.css
│  │  └─ reader.css
│  ├─ scripts/
│  │  ├─ terminal/
│  │  │  ├─ types.ts
│  │  │  ├─ fs.ts
│  │  │  ├─ theme.ts
│  │  │  ├─ history.ts
│  │  │  ├─ tabComplete.ts
│  │  │  ├─ output.ts
│  │  │  ├─ commands/
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ ls.ts
│  │  │  │  ├─ cd.ts
│  │  │  │  ├─ cat.ts
│  │  │  │  ├─ read.ts
│  │  │  │  ├─ pwd.ts
│  │  │  │  ├─ clear.ts
│  │  │  │  ├─ whoami.ts
│  │  │  │  ├─ uname.ts
│  │  │  │  ├─ date.ts
│  │  │  │  ├─ echo.ts
│  │  │  │  ├─ history.ts
│  │  │  │  ├─ colors.ts
│  │  │  │  └─ help.ts
│  │  │  └─ boot.ts
│  │  └─ shared/
│  │     ├─ themes.ts        # theme name list + favicon pixel map
│  │     └─ favicon.ts       # canvas generator
│  ├─ assets/
│  │  ├─ font/               # Departure Mono (woff, woff2)
│  │  └─ logos/              # per-theme SVG logos (optional, consumer can override)
│  └─ lib/
│     ├─ buildFsManifest.ts  # walks docs collection → fs.json
│     └─ shikiThemes.ts      # custom ember/phosphor/neutral Shiki themes
├─ demo/                     # minimal end-to-end test site
│  ├─ astro.config.mjs
│  ├─ site.config.ts
│  ├─ src/content.config.ts
│  └─ src/content/docs/home/user/...
└─ README.md
```

### Consumer package layout

```
0x0064/                      # or frndvrgs/
├─ package.json              # { "unix-tty": "github:frndvrgs/unix-tty#v0.1.0" }
├─ astro.config.mjs          # imports unix-tty integration, passes site config
├─ site.config.ts
├─ src/
│  ├─ content.config.ts      # export { collections } from 'unix-tty/content'
│  └─ content/docs/home/user/...
└─ public/                   # consumer-specific assets (optional logo overrides)
```

### Integration contract

```ts
// consumer's astro.config.mjs
import { defineConfig } from 'astro/config';
import unixTty from 'unix-tty/integration';
import site from './site.config';

export default defineConfig({
  integrations: [unixTty(site)],
});
```

The integration, at `astro:config:setup`:

1. Calls `injectRoute()` for `/` → `unix-tty/src/routes/index.astro` and `/read/[slug]` → `unix-tty/src/routes/read/[slug].astro`.
2. Sets `markdown.shikiConfig.themes` to register the three custom themes from `lib/shikiThemes.ts`.
3. Registers a vite alias `virtual:unix-tty/config` that resolves to the consumer's `site.config.ts`. Library code imports config at runtime via `import config from 'virtual:unix-tty/config'`.
4. Registers an `astro:build:start` hook that runs `buildFsManifest.ts`, which walks `getCollection('docs')` and writes `public/fs.json` in the consumer's project.

### Content model

Collection defined in `unix-tty/src/content.ts`:

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

Consumer's `src/content.config.ts` is a one-liner:

```ts
export { collections } from 'unix-tty/content';
```

### Virtual path derivation

The file tree inside `src/content/docs/` mirrors the Unix virtual filesystem. A file at `src/content/docs/home/user/authors/frndvrgs.md` has collection id `home/user/authors/frndvrgs`, which maps to virtual path `/home/user/authors/frndvrgs.md`. The reader slug is the basename (`frndvrgs`).

**Basename uniqueness** is enforced at build time by the manifest builder — duplicate basenames fail the build with a clear error.

### Build-generated FS manifest

`lib/buildFsManifest.ts` produces `public/fs.json`:

```ts
type FsManifest = {
  site: {
    user: string;
    hostname: string;
    home: string;
    motd: string[];
    defaultTheme: ThemeName;
  };
  dirs: Record<string, { children: string[] }>;
  files: Record<string, { slug: string; title: string }>;
};
```

Directory nodes are inferred from the id paths. The terminal boots from a single `fetch('/fs.json')` — no separate config fetch.

### Reader page

```astro
---
// unix-tty/src/routes/read/[slug].astro
import { getCollection, render } from 'astro:content';
import ReaderLayout from '../../layouts/ReaderLayout.astro';
import config from 'virtual:unix-tty/config';

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return entries.map((e) => ({
    params: { slug: e.id.split('/').pop() },
    props: { entry: e },
  }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<ReaderLayout title={entry.data.title} theme={config.reader.theme}>
  <main><article><Content /></article></main>
</ReaderLayout>
```

- Rendered at build time. Shiki handles code highlighting.
- Escape key and close button navigate to `/`.
- Reader theme is hardcoded per site via `config.reader.theme`, independent of the terminal's default theme.

### Terminal module breakdown

All modules under `src/scripts/terminal/`, strict TS.

- **`types.ts`** — `FsManifest`, `Theme`, `CommandContext`, `Command`, `CommandResult`.
- **`fs.ts`** — holds the `FsManifest`. Exposes `resolve(path, cwd)`, `list(path)`, `isDir`, `isFile`, `readFile(virtualPath)`. Path resolver supports `~`, `.`, `..`, absolute, relative. `readFile` lazily fetches markdown with a `Map` cache.
- **`theme.ts`** — current theme state. Toggles `theme-ember`/`theme-phosphor`/`theme-neutral` on `<html>`. Calls `favicon.refresh()` on every change.
- **`history.ts`** — command history ring buffer + up/down arrow navigation.
- **`tabComplete.ts`** — tab completion for commands (at position 0) and paths (elsewhere).
- **`output.ts`** — DOM append helpers: `line(text)`, `block(lines)`, `dim(text)`, `error(text)`. Every command writes via this module.
- **`commands/`** — one file per command, each exporting a `Command`. `index.ts` is the registry and aliases (`ll` → `ls -la`). `help.ts` iterates the registry at runtime so new commands show up automatically.
- **`boot.ts`** — entry point. Loaded from `TerminalLayout.astro` via `<script>`.

### Boot sequence

1. `fetch('/fs.json')` → `FsManifest`.
2. Init `fs`, `theme` (with `manifest.site.defaultTheme`), `history`.
3. Render motd lines (substitute `{version}` from `unix-tty/version.ts`, `{buildDate}` from build-time injection).
4. Render logo `<img>` matching the active theme.
5. Bind keydown handler on the prompt input.
6. Focus input, scroll to bottom.

### Styling

CSS custom properties in `src/styles/themes.css`:

```css
:root { --fg: #ffa133; --bg: #222222; --dim: #7a5a2a; }
.theme-ember    { --fg: #ffa133; --bg: #222222; --dim: #7a5a2a; }
.theme-phosphor { --fg: #39D353; --bg: #0D1117; --dim: #1B6928; }
.theme-neutral  { --fg: #ffffff; --bg: #000000; --dim: #555555; }
```

Terminal toggles the class on `<html>`; reader hardcodes `class="theme-<reader.theme>"`. No JS-CSS sync layer.

**Typography rules carried from the vanilla site:**

- Departure Mono, 11px exact (pixel-perfect).
- Line height 17.6px.
- No `text-transform` — terminal is case-sensitive (Unix behavior).
- Motd uses `--dim`, output/prompt/input use `--fg`.
- Click-to-focus guarded by `isSelecting()` so text selection isn't broken.

### Favicon

`src/scripts/shared/favicon.ts` exports `refresh(theme)`. Draws a 32×32 canvas with the `x` pixel map in `--fg` over `--bg`, sets the result on `<link rel="icon">`. Called on boot and every theme change. Same behavior as the current site.

## Consumer config surface

```ts
// 0x0064/site.config.ts
import { defineConfig } from 'unix-tty/config';

export default defineConfig({
  site: {
    title: '0x0064',
    description: 'terminal-style website for the 0x0064 org',
    url: 'https://0x0064.dev',
  },
  terminal: {
    hostname: '0x0064',
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

`defineConfig()` is an identity function with a `UnixTtyConfig` type annotation. TypeScript in the consumer's build catches invalid values.

The **Unix version** constant lives in `unix-tty/src/version.ts` and is substituted into motd lines at build. Bumping the version = editing one file in the library and cutting a new tag. Consumers pick it up on their next dependency update.

## Commands

Final command set (no `branding`): `ls`, `cd`, `cat`, `read`, `pwd`, `clear`, `whoami`, `uname`, `date`, `echo`, `history`, `colors`, `help`. Plus alias `ll` → `ls -la`.

- `cat <file>` prints the raw markdown inline.
- `read <file>` navigates to `/read/<slug>` where the slug is the file basename sans `.md`.
- `colors` cycles themes at runtime (transient — resets on reload).
- `help` is auto-generated from the command registry.

## URL map

Clean break from the vanilla site — no compatibility layer.

- `/` — terminal
- `/read/<slug>` — reader page

That's it. Two routes.

## Removed from the vanilla 0x0064 codebase

- `zero-md` (replaced by Astro `<Content />` + Shiki).
- `content.json` (replaced by build-generated `fs.json`).
- `branding/*.html` and the `branding` terminal command.
- CDN `<script>` tags.
- `serve.mjs` (replaced by `astro dev`).
- Hand-maintained virtual FS paths (derived from file tree).

## Implementation order

1. Scaffold `unix-tty` from a minimal Astro init (matching `mad-mass` shape). Strict TS, Node ≥22.12, Astro ^6.1.5.
2. Integration skeleton: route injection, `virtual:unix-tty/config` alias, Shiki theme registration.
3. Content collection definition + `buildFsManifest.ts` + integration hook that emits `fs.json`.
4. `demo/` consumer site with dummy markdown — proves the integration wiring end-to-end.
5. Layouts + theme tokens CSS + Departure Mono font shipped from `src/assets/font/`.
6. Reader page + custom Shiki themes.
7. Terminal module chain: `types` → `output` → `fs` → `theme` → `history` → `tabComplete` → commands → `boot`.
8. Favicon generator + logo assets.
9. `astro dev` in `demo/` as the smoke check. Fix until every command behaves correctly.
10. Tag `v0.1.0` and push.
11. (Out of scope for this work) Scaffold `0x0064` consumer repo pointing at `github:frndvrgs/unix-tty#v0.1.0`.

## Open questions

None. Ready to implement.
