import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { UnixTtyConfig } from './config.js';
import { shikiThemes } from './lib/shikiThemes.js';

export default function unixTty(_config: UnixTtyConfig): AstroIntegration {
  const libRoot = path.dirname(fileURLToPath(import.meta.url));

  return {
    name: 'unix-tty',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        injectRoute({
          pattern: '/',
          entrypoint: path.join(libRoot, 'routes/index.astro'),
        });
        injectRoute({
          pattern: '/read/[slug]',
          entrypoint: path.join(libRoot, 'routes/read/[slug].astro'),
        });
        injectRoute({
          pattern: '/fs.json',
          entrypoint: path.join(libRoot, 'routes/fs.json.ts'),
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
    },
  };
}
