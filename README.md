# unix-tty

An Astro integration that turns a markdown content collection into a Unix-terminal-style website.

## Install

Consumer `package.json`:

```json
"dependencies": {
  "astro": "^6.1.5",
  "unix-tty": "github:frndvrgs/unix-tty"
}
```

## Use

Consumer `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import unixTty from 'unix-tty/integration';
import site from './site.config.ts';

export default defineConfig({
  integrations: [unixTty(site)],
});
```

Consumer `site.config.ts`:

```ts
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
```

Consumer `src/content.config.ts`:

```ts
export { collections } from 'unix-tty/content';
```

Then drop markdown into `src/content/docs/home/user/...`. The file tree mirrors the virtual filesystem the terminal walks.

## Routes

- `/` — terminal
- `/read/<slug>` — reader page (build-time rendered markdown)
- `/fs.json` — virtual filesystem manifest, fetched by the terminal at runtime

## Commands

`ls`, `cd`, `cat`, `read`, `pwd`, `clear`, `whoami`, `uname`, `date`, `echo`, `history`, `colors`, `help`, `ll`

## Development

```sh
npm install
npm run dev     # runs the example site at example/
```

## Themes

`ember`, `phosphor`, `neutral`. Cycled at runtime via the `colors` command.

## License

MIT
