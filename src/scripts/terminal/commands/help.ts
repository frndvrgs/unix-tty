import type { Command } from '../types.js';

const help: Command = {
  name: 'help',
  summary: 'list available commands',
  run: ({ out }) => {
    out.line('help: command list not bound');
  },
};

export default help;
