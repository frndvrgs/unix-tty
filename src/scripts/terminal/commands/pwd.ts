import type { Command } from '../types.js';

const pwd: Command = {
  name: 'pwd',
  summary: 'print current directory',
  run: ({ fs, out }) => out.line(fs.cwd()),
};

export default pwd;
