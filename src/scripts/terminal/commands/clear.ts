import type { Command } from '../types.js';

const clear: Command = {
  name: 'clear',
  summary: 'clear the screen',
  run: ({ out, history }) => {
    out.clear();
    history.clear();
  },
};

export default clear;
