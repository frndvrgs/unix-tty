import type { Command } from '../types.js';

const date: Command = {
  name: 'date',
  summary: 'print current date',
  run: ({ out }) => out.line(new Date().toString()),
};

export default date;
