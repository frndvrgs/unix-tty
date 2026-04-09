import type { ThemeName } from '../../config.js';

export interface FsManifest {
  site: {
    user: string;
    hostname: string;
    home: string;
    motd: string[];
    defaultTheme: ThemeName;
    unixVersion: string;
    buildDate: string;
  };
  dirs: Record<string, { children: string[] }>;
  files: Record<string, { slug: string; title: string; size: number }>;
}

/**
 * A segment of a rich line. Plain strings render as text nodes.
 * Objects render as interactive spans that, when clicked, insert the
 * `insert` value (falling back to `text`) at the current cursor
 * position in the terminal input.
 */
export type LineSegment = string | { text: string; insert?: string };

export interface OutputSink {
  line(text?: string): void;
  /**
   * Print a line composed of plain and interactive segments. Used by
   * `ls` so file/folder names become tap targets on mobile (where
   * tab-completion isn't practical).
   */
  lineRich(segments: LineSegment[]): void;
  dim(text: string): void;
  error(text: string): void;
  block(lines: string[]): void;
  clear(): void;
}

export interface ThemeController {
  get(): ThemeName;
  set(theme: ThemeName): void;
  cycle(): ThemeName;
}

export interface HistoryController {
  push(entry: string): void;
  prev(): string | null;
  next(): string | null;
  reset(): void;
  all(): string[];
}

export interface VirtualFs {
  cwd(): string;
  chdir(path: string): void;
  resolve(path: string): string;
  list(path: string): string[] | null;
  isDir(path: string): boolean;
  isFile(path: string): boolean;
  entry(path: string): { slug: string; title: string; size: number } | null;
  readFile(path: string): Promise<string>;
  allPaths(): string[];
}

export interface CommandContext {
  fs: VirtualFs;
  args: string[];
  raw: string;
  out: OutputSink;
  theme: ThemeController;
  history: HistoryController;
  manifest: FsManifest;
}

export interface Command {
  name: string;
  summary: string;
  run(ctx: CommandContext): void | Promise<void>;
}
