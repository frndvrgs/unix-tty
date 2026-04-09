import type { Command } from '../types.js';
import cat from './cat.js';
import cd from './cd.js';
import clear from './clear.js';
import colors from './colors.js';
import dateCmd from './date.js';
import echo from './echo.js';
import historyCmd from './history.js';
import ls from './ls.js';
import pwd from './pwd.js';
import read from './read.js';
import uname from './uname.js';
import whoami from './whoami.js';

const base: Command[] = [ls, cd, cat, read, pwd, clear, whoami, uname, dateCmd, echo, historyCmd, colors];

export function buildRegistry(): Record<string, Command> {
  const registry: Record<string, Command> = {};
  for (const c of base) registry[c.name] = c;

  registry.help = {
    name: 'help',
    summary: 'list available commands',
    run: ({ out }) => {
      const names = Object.keys(registry).sort();
      const width = Math.max(...names.map((n) => n.length));
      out.line('available commands:');
      for (const name of names) {
        const cmd = registry[name]!;
        out.line(`  ${name.padEnd(width)}  ${cmd.summary}`);
      }
    },
  };

  registry.ll = {
    name: 'll',
    summary: 'alias for ls -la',
    run: (ctx) => registry.ls!.run({ ...ctx, args: ['-la', ...ctx.args] }),
  };

  return registry;
}

export function commandNames(registry: Record<string, Command>): string[] {
  return Object.keys(registry).sort();
}
