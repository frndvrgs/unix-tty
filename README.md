
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
    defaultTheme: 'ember',
    motd: [
      'unix {version} | tty0 | utf-8',
      "type 'help' for a list of commands",
    ],
    logo: {
      ember: '/assets/logo-ember.svg',
      phosphor: '/assets/logo-phosphor.svg',
      neutral: '/assets/logo-neutral.svg',
    },
  },
  reader: { theme: 'ember' },
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

`ls`, `cd`, `cat`, `read`, `pwd`, `clear`, `whoami`, `uname`, `date`, `echo`, `history`, `colors`, `help`, `about`, `ll`

## Themes

`ember`, `phosphor`, `neutral` — cycled at runtime via the `colors` command. Each theme includes matching Shiki syntax highlighting for the reader.

## Font

[Departure Mono](https://departuremono.com) by Helena Zhang — [helenazhang.com](https://helenazhang.com). Licensed under SIL Open Font License 1.1.

## License

MIT
