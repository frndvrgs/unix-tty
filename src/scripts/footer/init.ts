// Behaviour for the AppFooter component. Wires keyboard shortcuts and
// button clicks to the same actions: font size +/-, scroll up/down, exit.
// Reusable across the reader page and any future "terminal-app" page that
// renders <AppFooter />.

const FONT_MIN = 8;
const FONT_MAX = 32;
const FONT_STEP = 1;
const SCROLL_STEP = 64;

function getFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function setFontSize(px: number): void {
  const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, px));
  document.documentElement.style.fontSize = `${clamped}px`;
}

function exitToTerminal(): void {
  window.location.assign('/');
}

export function initAppFooter(): void {
  document.addEventListener('keydown', (event) => {
    // Skip when typing in an input/textarea/contenteditable. This lets a
    // future terminal-app page mount the footer next to its own prompt
    // without stealing keystrokes.
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      setFontSize(getFontSize() + FONT_STEP);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      setFontSize(getFontSize() - FONT_STEP);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      window.scrollBy({ top: -SCROLL_STEP, behavior: 'auto' });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      window.scrollBy({ top: SCROLL_STEP, behavior: 'auto' });
    } else if (event.key === 'q' || event.key === 'Escape') {
      event.preventDefault();
      exitToTerminal();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-footer-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.footerAction;
      if (action === 'font-inc') setFontSize(getFontSize() + FONT_STEP);
      else if (action === 'font-dec') setFontSize(getFontSize() - FONT_STEP);
      else if (action === 'exit') exitToTerminal();
    });
  });
}
