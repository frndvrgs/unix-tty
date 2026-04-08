import type { Command } from '../types.js';

const uname: Command = {
  name: 'uname',
  summary: 'print system info',
  run: ({ manifest, args, out }) => {
    if (args.includes('-a')) {
      out.line(`unix ${manifest.site.hostname} ${manifest.site.unixVersion} tty0 utf-8`);
    } else {
      out.line('unix');
    }
  },
};

export default uname;
