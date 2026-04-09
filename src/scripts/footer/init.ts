import type { ThemeName } from '../../config.js';
import { refreshFavicon } from '../shared/favicon.js';
import { hapticSuccess } from '../shared/haptics.js';
import { THEME_NAMES } from '../shared/themes.js';

const FONT_MIN = 50; // percent
const FONT_MAX = 200;
const FONT_STEP = 10;
const SCROLL_STEP = 64;

let fontScale = 100;

function applyFontScale(): void {
  document.body.style.setProperty('--reader-font-scale', `${fontScale}%`);
  document.querySelectorAll<HTMLElement>('[data-footer-fontsize]').forEach((el) => {
    el.textContent = `${fontScale}%`;
  });
}

function adjustFontScale(delta: number): void {
  fontScale = Math.max(FONT_MIN, Math.min(FONT_MAX, fontScale + delta));
  applyFontScale();
}

function currentTheme(): ThemeName {
  for (const t of THEME_NAMES) {
    if (document.documentElement.classList.contains(`theme-${t}`)) return t;
  }
  return THEME_NAMES[0]!;
}

function cycleTheme(): void {
  const cur = currentTheme();
  const idx = THEME_NAMES.indexOf(cur);
  const next = THEME_NAMES[(idx + 1) % THEME_NAMES.length]!;
  for (const t of THEME_NAMES) {
    document.documentElement.classList.remove(`theme-${t}`);
  }
  document.documentElement.classList.add(`theme-${next}`);
  refreshFavicon(next);
}

function exitToTerminal(): void {
  window.location.assign('/');
}

function watchFooterHeight(): void {
  const footer = document.querySelector<HTMLElement>('.app-footer');
  if (!footer) return;

  const update = () => {
    const h = footer.getBoundingClientRect().height;
    document.body.style.setProperty('--reader-bottom-padding', `${h}px`);
  };

  update();

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(update);
    ro.observe(footer);
  }
  window.addEventListener('resize', update);
}

export function initAppFooter(): void {
  applyFontScale();
  watchFooterHeight();

  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      adjustFontScale(FONT_STEP);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      adjustFontScale(-FONT_STEP);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      window.scrollBy({ top: -SCROLL_STEP, behavior: 'auto' });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      window.scrollBy({ top: SCROLL_STEP, behavior: 'auto' });
    } else if (event.key === 'c' || event.key === 'C') {
      event.preventDefault();
      cycleTheme();
    } else if (event.key === 'q' || event.key === 'Q' || event.key === 'Escape') {
      event.preventDefault();
      exitToTerminal();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-footer-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Every button tap fires a success haptic. No-op on devices
      // without vibration support, so desktop is unaffected.
      hapticSuccess();
      const action = btn.dataset.footerAction;
      if (action === 'font-inc') adjustFontScale(FONT_STEP);
      else if (action === 'font-dec') adjustFontScale(-FONT_STEP);
      else if (action === 'colors') cycleTheme();
      else if (action === 'exit') exitToTerminal();
    });
  });
}
