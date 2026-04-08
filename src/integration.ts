import type { AstroIntegration } from 'astro';
import type { UnixTtyConfig } from './config.js';

export default function unixTty(_config: UnixTtyConfig): AstroIntegration {
  return {
    name: 'unix-tty',
    hooks: {
      'astro:config:setup': () => {
        // See Task 7 for the full implementation.
      },
    },
  };
}
