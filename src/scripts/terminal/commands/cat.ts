import type { Command } from '../types.js';

const cat: Command = {
  name: 'cat',
  summary: 'print file contents',
  run: async ({ fs, args, out }) => {
    if (args.length === 0) {
      out.error('cat: missing operand');
      return;
    }
    for (const target of args) {
      const path = fs.resolve(target);
      try {
        const text = await fs.readFile(path);
        for (const line of text.split('\n')) out.line(line);
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err));
      }
    }
  },
};

export default cat;
