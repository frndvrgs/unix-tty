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
