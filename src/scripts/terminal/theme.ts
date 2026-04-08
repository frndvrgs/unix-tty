import type { ThemeName } from '../../config.js';
import { THEME_NAMES } from '../shared/themes.js';
import { refreshFavicon } from '../shared/favicon.js';
import type { ThemeController } from './types.js';

export function createTheme(initial: ThemeName): ThemeController {
  let current: ThemeName = initial;
  const root = document.documentElement;

  const apply = (name: ThemeName) => {
    for (const n of THEME_NAMES) root.classList.remove(`theme-${n}`);
    root.classList.add(`theme-${name}`);
    refreshFavicon(name);
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
