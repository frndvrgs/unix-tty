import type { Command } from '../types.js';

const echo: Command = {
  name: 'echo',
  summary: 'print arguments',
  run: ({ args, out }) => out.line(args.join(' ')),
};

export default echo;
