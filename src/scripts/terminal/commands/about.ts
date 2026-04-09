import type { Command } from '../types.js';

const about: Command = {
  name: 'about',
  summary: 'about this terminal',
  run: ({ out }) => {
    out.line('');
    out.line('unix-tty - terminal-style astro website');
    out.line('created by frndvrgs');
    out.line("and inspired by helena zhang's work:");
    out.line('');
    out.line('https://departuremono.com');
    out.line('https://helenazhang.com');
    out.line('');
  },
};

export default about;
