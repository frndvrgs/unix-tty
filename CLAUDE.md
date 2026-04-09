# unix-tty

Astro integration library. Renders a Unix terminal-style website from a markdown content collection.

## Development

```sh
npm install
npm run dev          # runs the example site
npm run build        # builds the example site
npm run typecheck    # tsc --noEmit
npm run check        # biome check
npm run check:fix    # biome check --write
npm run format       # biome format --write
```

## Rules

- Always ask for explicit confirmation before `git push`, `git push --force`, or creating a GitHub release. Commits and tags are fine to create locally, but never push without a direct go-ahead from the user.
- Bump `UNIX_VERSION` in `src/version.ts` on each release, follow semver.
- Bump `version` in `package.json` on each release.
- Do not add comments to explain changes. Keep the code clean.
- Do not add docstrings, type annotations, or comments to code you didn't change.
- `.astro` files are not processed by biome. Keep their frontmatter minimal.
- Consumer sites pin a git tag in their `package.json`. After pushing a new tag, bump the pin in each consumer and push to trigger Render redeploys.

## Layout

```
src/
  config.ts              consumer config type + defineConfig helper
  content.ts             content collection schema (glob loader)
  integration.ts         astro integration entry (injects routes, vite alias, shiki)
  version.ts             UNIX_VERSION constant
  routes/                injected astro routes (/, /read/[slug], /fs.json)
  layouts/               TerminalLayout, ReaderLayout
  components/            AppFooter (shared footer for reader and future terminal apps)
  styles/                themes.css, font.css, terminal.css, reader.css
  scripts/
    terminal/            boot, output, fs, theme, history, tabComplete, types
    terminal/commands/   about, cat, cd, clear, colors, date, echo, help, history, ls, pwd, read, uname, whoami
    shared/              themes, favicon, haptics
    footer/              init
  lib/                   buildFsManifest, shikiThemes
  assets/font/           Departure Mono (woff, woff2, LICENSE)
example/                 minimal consumer site for smoke testing
```
