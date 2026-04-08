// @ts-check
import { defineConfig } from 'astro/config';
import unixTty from 'unix-tty/integration';
import site from './site.config.ts';

export default defineConfig({
  integrations: [unixTty(site)],
});
