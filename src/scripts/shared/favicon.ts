import type { ThemeName } from '../../config.js';
import { FAVICON_X, THEME_COLORS } from './themes.js';

export function refreshFavicon(theme: ThemeName): void {
  const colors = THEME_COLORS[theme];
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, size, size);

  const px = size / FAVICON_X.length;
  ctx.fillStyle = colors.fg;
  for (let y = 0; y < FAVICON_X.length; y++) {
    const row = FAVICON_X[y]!;
    for (let x = 0; x < row.length; x++) {
      if (row[x]) ctx.fillRect(x * px, y * px, px, px);
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = dataUrl;
}
