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

// 5x7 pixel map of the character "x" for the favicon. The empty borders
// (top/bottom rows of zeros) are intentional — favicon.ts uses a padded
// scaling formula that places the glyph in the centre of the canvas.
// Matches the original 0x0064 site's favicon shape exactly.
// 1 = foreground, 0 = background.
export const FAVICON_X: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 1],
  [0, 1, 0, 1, 0],
  [0, 0, 1, 0, 0],
  [0, 1, 0, 1, 0],
  [1, 0, 0, 0, 1],
  [0, 0, 0, 0, 0],
];
