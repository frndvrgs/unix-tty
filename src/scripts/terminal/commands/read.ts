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
    // Upgrade the post-command haptic to 'run' — this command is
    // launching an app-like transition (the reader page), not just
    // emitting text. boot.ts will fire hapticsRun() after dispatch,
    // overriding the default light hapticsCommand.
    out.haptic('run');
    window.location.assign(`/read/${entry.slug}/`);
  },
};

export default read;
