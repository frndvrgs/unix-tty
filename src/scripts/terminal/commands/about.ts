import type { Command } from '../types.js';

const about: Command = {
  name: 'about',
  summary: 'about this terminal',
  run: ({ out }) => {
    out.line('unix-tty — a terminal-style website builder');
    out.line('');
    out.line('an astro integration that renders a unix-terminal homepage');
    out.line('and a build-time markdown reader from a single content');
    out.line('collection.');
    out.line('');
    out.line('stack');
    out.line('  astro           content layer + static build');
    out.line('  typescript      strict mode');
    out.line('  shiki           reader syntax highlighting');
    out.line('  departure mono  monospace pixel font');
    out.line('');
    out.line('font');
    out.line('  departure mono © 2022–2024 helena zhang');
    out.line('  helenazhang.com');
    out.line('  licensed under SIL Open Font License 1.1');
    out.line('');
    out.line('project');
    out.line('  github.com/frndvrgs/unix-tty');
    out.line('  by fernando vargas — frndvrgs.com');
  },
};

export default about;
