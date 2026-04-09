import type { Command } from '../types.js';

const about: Command = {
  name: 'about',
  summary: 'about this terminal',
  run: ({ out }) => {
    out.line('');
    out.line('unix-tty — a terminal-style astro website');
    out.line('');
    out.line('inspired by helena zhang work:');
    out.line('https://helenazhang.com');
    out.line('https://departuremono.com');
    out.line('');
  },
};

export default about;
