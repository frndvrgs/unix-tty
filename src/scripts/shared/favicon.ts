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

  // Padded scaling: leave one pixel-cell of margin on each side, matching
  // the original 0x0064 favicon. `+2` is the per-side margin in cells.
  const rows = FAVICON_X.length;
  const cols = FAVICON_X[0]!.length;
  const px = Math.floor(size / (Math.max(cols, rows) + 2));
  const offX = Math.floor((size - cols * px) / 2);
  const offY = Math.floor((size - rows * px) / 2);

  ctx.fillStyle = colors.fg;
  for (let y = 0; y < rows; y++) {
    const row = FAVICON_X[y]!;
    for (let x = 0; x < cols; x++) {
      if (row[x]) ctx.fillRect(offX + x * px, offY + y * px, px, px);
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
