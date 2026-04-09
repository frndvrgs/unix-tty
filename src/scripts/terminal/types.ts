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

export type LineSegment = string | { text: string; insert?: string };

export type PostCommandHaptic = 'command' | 'run';

export interface OutputSink {
  line(text?: string): void;
  lineRich(segments: LineSegment[]): void;
  dim(text: string): void;
  error(text: string): void;
  block(lines: string[]): void;
  clear(): void;
  haptic(kind: PostCommandHaptic): void;
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
  clear(): void;
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
