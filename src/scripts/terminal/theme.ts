import type { ImageRendering, LogoEntry, ThemeName } from '../../config.js';
import { refreshFavicon } from '../shared/favicon.js';
import { THEME_NAMES } from '../shared/themes.js';
import type { ThemeController } from './types.js';

const VALID_RENDERINGS: readonly ImageRendering[] = ['auto', 'smooth', 'crisp-edges', 'pixelated'];

interface NormalizedLogo {
  url: string;
  width?: number;
  height?: number;
  imageRendering?: ImageRendering;
}

function normalizeLogo(entry: LogoEntry | undefined): NormalizedLogo | null {
  if (typeof entry === 'string') {
    return entry.length > 0 ? { url: entry } : null;
  }
  if (!entry || typeof entry !== 'object') return null;
  const url = typeof entry.url === 'string' ? entry.url : '';
  if (!url) return null;
  const out: NormalizedLogo = { url };
  if (typeof entry.width === 'number' && Number.isFinite(entry.width) && entry.width > 0) {
    out.width = entry.width;
  }
  if (typeof entry.height === 'number' && Number.isFinite(entry.height) && entry.height > 0) {
    out.height = entry.height;
  }
  if (
    typeof entry.imageRendering === 'string' &&
    (VALID_RENDERINGS as readonly string[]).includes(entry.imageRendering)
  ) {
    out.imageRendering = entry.imageRendering;
  }
  return out;
}

function applyLogo(el: HTMLImageElement, entry: LogoEntry | undefined): void {
  const normalized = normalizeLogo(entry);
  if (!normalized) return;
  el.src = normalized.url;
  const { width, height, imageRendering } = normalized;
  if (width !== undefined || height !== undefined) {
    el.style.maxWidth = width !== undefined ? `${width}px` : 'none';
    el.style.maxHeight = height !== undefined ? `${height}px` : 'none';
  } else {
    el.style.maxWidth = '';
    el.style.maxHeight = '';
  }
  el.style.imageRendering = imageRendering ?? '';
}

export interface CreateThemeOptions {
  logoElement?: HTMLImageElement;
  logoConfigs?: Partial<Record<ThemeName, LogoEntry>>;
}

export function createTheme(initial: ThemeName, options: CreateThemeOptions = {}): ThemeController {
  let current: ThemeName = initial;
  const root = document.documentElement;
  const { logoElement, logoConfigs } = options;

  const apply = (name: ThemeName) => {
    for (const n of THEME_NAMES) root.classList.remove(`theme-${n}`);
    root.classList.add(`theme-${name}`);
    refreshFavicon(name);
    if (logoElement && logoConfigs) {
      applyLogo(logoElement, logoConfigs[name]);
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
