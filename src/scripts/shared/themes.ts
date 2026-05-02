import type { ThemeName } from '../../config.js';

export const THEME_NAMES: readonly ThemeName[] = ['phosphor', 'amber', 'void'] as const;

export interface ThemeColors {
  fg: string;
  bg: string;
  dim: string;
}

export const THEME_COLORS: Record<ThemeName, ThemeColors> = {
  phosphor: { fg: '#39d353', bg: '#0a0f0a', dim: '#1a6629' },
  amber: { fg: '#ffb000', bg: '#100a00', dim: '#7a5000' },
  void: { fg: '#ffffff', bg: '#0a0a0a', dim: '#555555' },
};

export const FAVICON_X: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 1],
  [0, 1, 0, 1, 0],
  [0, 0, 1, 0, 0],
  [0, 1, 0, 1, 0],
  [1, 0, 0, 0, 1],
  [0, 0, 0, 0, 0],
];
