import type { Command } from '../types.js';

const help: Command = {
  name: 'help',
  summary: 'list available commands',
  run: ({ out }) => {
    // Command list is injected by the registry at boot via a closure;
    // this implementation is replaced by the registry in commands/index.ts.
    out.line('help: command list not bound');
  },
};

export default help;
