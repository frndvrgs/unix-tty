import type { Command } from '../types.js';

const whoami: Command = {
  name: 'whoami',
  summary: 'print current user',
  run: ({ manifest, out }) => out.line(manifest.site.user),
};

export default whoami;
