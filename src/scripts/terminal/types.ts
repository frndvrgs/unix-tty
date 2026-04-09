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

/**
 * Post-command haptic kind. Default is 'command' (subtle
 * confirmation); a command can upgrade its run to 'run' via
 * `out.haptic('run')` to signal that it's launching an app-like
 * transition (e.g. the reader page). Error haptics are handled
 * automatically whenever `out.error` is invoked.
 */
export type PostCommandHaptic = 'command' | 'run';

export interface OutputSink {
  line(text?: string): void;
  lineRich(segments: LineSegment[]): void;
  dim(text: string): void;
  error(text: string): void;
  block(lines: string[]): void;
  clear(): void;
  /**
   * Signal which haptic run() should fire after this command
   * completes. No-op on sinks that don't drive post-command
   * feedback (e.g. the motd-time sink before the prompt exists).
   */
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
