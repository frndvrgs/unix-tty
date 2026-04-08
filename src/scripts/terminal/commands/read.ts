import type { Command } from '../types.js';

const read: Command = {
  name: 'read',
  summary: 'open a file in the reader page',
  run: ({ fs, args, out }) => {
    if (args.length === 0) {
      out.error('read: missing operand');
      return;
    }
    const target = args[0]!;
    const path = fs.resolve(target);
    const entry = fs.entry(path);
    if (!entry) {
      out.error(`read: ${target}: no such file`);
      return;
    }
    window.location.assign(`/read/${entry.slug}/`);
  },
};

export default read;
