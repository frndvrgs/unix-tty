import type { Command } from '../types.js';

const clear: Command = {
  name: 'clear',
  summary: 'clear the screen',
  run: ({ out }) => out.clear(),
};

export default clear;
