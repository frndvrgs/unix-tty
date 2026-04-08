import type { Command } from '../types.js';

const colors: Command = {
  name: 'colors',
  summary: 'cycle through color themes',
  run: ({ theme, out }) => {
    const next = theme.cycle();
    out.line(`theme: ${next}`);
  },
};

export default colors;
