import type { ThemeName } from '../../config.js';
import { refreshFavicon } from '../shared/favicon.js';
import { THEME_NAMES } from '../shared/themes.js';
import type { ThemeController } from './types.js';

export interface CreateThemeOptions {
  logoElement?: HTMLImageElement;
  logoUrls?: Partial<Record<ThemeName, string>>;
}

export function createTheme(initial: ThemeName, options: CreateThemeOptions = {}): ThemeController {
  let current: ThemeName = initial;
  const root = document.documentElement;
  const { logoElement, logoUrls } = options;

  const apply = (name: ThemeName) => {
    for (const n of THEME_NAMES) root.classList.remove(`theme-${n}`);
    root.classList.add(`theme-${name}`);
    refreshFavicon(name);
    if (logoElement && logoUrls) {
      const url = logoUrls[name];
      if (url) logoElement.src = url;
    }
  };

  apply(initial);

  return {
    get: () => current,
    set: (theme) => {
      current = theme;
      apply(theme);
    },
    cycle: () => {
      const i = THEME_NAMES.indexOf(current);
      const next = THEME_NAMES[(i + 1) % THEME_NAMES.length]!;
      current = next;
      apply(next);
      return next;
    },
  };
}
