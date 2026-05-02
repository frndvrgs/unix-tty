
# unix-tty

[![npm](https://img.shields.io/npm/v/unix-tty)](https://www.npmjs.com/package/unix-tty)


<img width="1271" height="203" alt="image" src="https://github.com/user-attachments/assets/506f7def-f22c-4f1d-b26c-ad46376b240e" />

An Astro integration that renders a Unix terminal-style website from a markdown content collection.

## Install

```sh
npm install unix-tty astro
```

## Setup

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import unixTty from 'unix-tty/integration';
import site from './site.config.ts';

export default defineConfig({
  integrations: [unixTty(site)],
});
```

`site.config.ts`:

```ts
import { defineConfig } from 'unix-tty/config';

export default defineConfig({
  site: {
    title: 'my site',
    description: '...',
    url: 'https://example.com',
  },
  terminal: {
    hostname: 'example',
    username: 'user',
    home: '/home/user',
    defaultTheme: 'phosphor',
    scanlines: true,
    flicker: true,
    motd: [
      'unix {version} | tty0 | utf-8',
      "type 'help' for a list of commands",
    ],
    logo: {
      phosphor: '/assets/logo-phosphor.svg',
      amber: '/assets/logo-amber.svg',
    },
  },
  reader: { theme: 'phosphor' },
});
```

`src/content.config.ts`:

```ts
export { collections } from 'unix-tty/content';
```

Drop markdown files with a `title` frontmatter into `src/content/docs/`. The file tree mirrors the virtual filesystem the terminal walks.

## Routes

- `/` — terminal
- `/read/<slug>` — reader (build-time rendered markdown with Shiki syntax highlighting)
- `/fs.json` — virtual filesystem manifest

## Commands

`ls`, `cd`, `cat`, `read`, `pwd`, `clear`, `whoami`, `uname`, `date`, `echo`, `history`, `color`, `help`, `about`, `ll`

## Themes

`phosphor`, `amber`, `void` — swapped at runtime via the `color` command and persisted in localStorage. Each theme includes matching Shiki syntax highlighting for the reader.

## CRT effects

`scanlines` and `flicker` are build-time toggles in `site.config.ts`. Both default to `true`.

## Style guide

See [`docs/retro-terminal-style-guide.html`](docs/retro-terminal-style-guide.html) — a standalone, shareable reference for the phosphor + amber design system.

## Font

[Departure Mono](https://departuremono.com) by Helena Zhang — [helenazhang.com](https://helenazhang.com). Licensed under SIL Open Font License 1.1.

## License

MIT
