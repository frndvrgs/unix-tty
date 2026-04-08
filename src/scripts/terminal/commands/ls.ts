import type { Command } from '../types.js';

const ls: Command = {
  name: 'ls',
  summary: 'list directory contents',
  run: ({ fs, args, out }) => {
    const long = args.includes('-l') || args.includes('-la') || args.includes('-a');
    const target = args.filter((a) => !a.startsWith('-'))[0] ?? '.';
    const path = fs.resolve(target);

    if (fs.isFile(path)) {
      out.line(target);
      return;
    }

    const children = fs.list(path);
    if (!children) {
      out.error(`ls: ${target}: no such directory`);
      return;
    }

    if (long) {
      for (const c of children) {
        const childPath = path === '/' ? `/${c}` : `${path}/${c}`;
        const kind = fs.isDir(childPath) ? 'd' : '-';
        out.line(`${kind}rw-r--r--  1 user user  ${c}`);
      }
    } else {
      out.line(children.join('  '));
    }
  },
};

export default ls;
