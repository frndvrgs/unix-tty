import type { Command, VirtualFs } from '../types.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const DIR_SIZE = 4096;
const DIR_NLINK = 2;
const FILE_NLINK = 1;

interface Row {
  mode: string;
  nlink: number;
  size: number;
  name: string;
}

function fmtDate(d: Date): string {
  const mon = MONTHS[d.getMonth()]!;
  const day = String(d.getDate()).padStart(2, ' ');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${mon} ${day} ${hh}:${mm}`;
}

function buildRow(fs: VirtualFs, parent: string, name: string, displayName: string): Row {
  const childPath =
    name === '.' ? parent : name === '..' ? parentOf(parent) : (parent === '/' ? `/${name}` : `${parent}/${name}`);

  if (fs.isDir(childPath)) {
    return { mode: 'drwxr-xr-x', nlink: DIR_NLINK, size: DIR_SIZE, name: displayName };
  }

  const fileEntry = fs.entry(childPath);
  return {
    mode: '-rw-r--r--',
    nlink: FILE_NLINK,
    size: fileEntry?.size ?? 0,
    name: displayName,
  };
}

function parentOf(path: string): string {
  if (path === '/' || path === '') return '/';
  const idx = path.lastIndexOf('/');
  if (idx <= 0) return '/';
  return path.slice(0, idx);
}

const ls: Command = {
  name: 'ls',
  summary: 'list directory contents',
  run: ({ fs, args, manifest, out }) => {
    const flags = args.filter((a) => a.startsWith('-')).join('');
    const longFmt = flags.includes('l');
    const showHidden = flags.includes('a');

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

    // Build the visible name list. `-a` prepends `.` and `..`.
    // Directories get a trailing slash for clarity.
    const decorate = (name: string): string => {
      const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
      return fs.isDir(childPath) ? `${name}/` : name;
    };

    if (!longFmt) {
      const names: string[] = [];
      if (showHidden) names.push('.', '..');
      for (const c of children) names.push(decorate(c));
      out.line(names.join('  '));
      return;
    }

    // Long format. Build all rows first so we can right-align the size column.
    const rows: Row[] = [];
    if (showHidden) {
      rows.push(buildRow(fs, path, '.', '.'));
      rows.push(buildRow(fs, path, '..', '..'));
    }
    for (const c of children) {
      rows.push(buildRow(fs, path, c, decorate(c)));
    }

    const nlinkWidth = Math.max(...rows.map((r) => String(r.nlink).length));
    const owner = manifest.site.user;
    const group = manifest.site.user;

    // On narrow viewports drop the size and date columns — they push the
    // line over a phone's character width and force ugly wrapping.
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches;

    if (isMobile) {
      for (const r of rows) {
        const nlink = String(r.nlink).padStart(nlinkWidth, ' ');
        out.line(`${r.mode}  ${nlink} ${owner} ${group}  ${r.name}`);
      }
      return;
    }

    const sizeWidth = Math.max(...rows.map((r) => String(r.size).length));
    // Single timestamp for the whole listing — we don't track per-file mtime
    // in v0.1, so we use the build date.
    const mtime = fmtDate(new Date(manifest.site.buildDate));

    for (const r of rows) {
      const nlink = String(r.nlink).padStart(nlinkWidth, ' ');
      const size = String(r.size).padStart(sizeWidth, ' ');
      out.line(`${r.mode}  ${nlink} ${owner} ${group}  ${size} ${mtime} ${r.name}`);
    }
  },
};

export default ls;
