import type { ThemeName } from '../../config.js';

export const THEME_NAMES: readonly ThemeName[] = ['ember', 'phosphor', 'neutral'] as const;

export interface ThemeColors {
  fg: string;
  bg: string;
  dim: string;
}

export const THEME_COLORS: Record<ThemeName, ThemeColors> = {
  ember: { fg: '#ffa133', bg: '#222222', dim: '#7a5a2a' },
  phosphor: { fg: '#39d353', bg: '#0d1117', dim: '#1b6928' },
  neutral: { fg: '#ffffff', bg: '#000000', dim: '#555555' },
};

// 8x8 pixel map of the character "x" for the favicon.
// 1 = foreground, 0 = background.
export const FAVICON_X: readonly (readonly number[])[] = [
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
];
