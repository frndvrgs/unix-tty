import type { Command } from '../types.js';

const history: Command = {
  name: 'history',
  summary: 'show command history',
  run: ({ history, out }) => {
    const entries = history.all();
    entries.forEach((entry, i) => {
      const idx = String(i + 1).padStart(4, ' ');
      out.line(`${idx}  ${entry}`);
    });
  },
};

export default history;
