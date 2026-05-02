import type { Command } from '../types.js';

const color: Command = {
  name: 'color',
  summary: 'switch color theme',
  run: ({ theme, out }) => {
    const next = theme.cycle();
    out.line(`theme: ${next}`);
  },
};

export default color;
