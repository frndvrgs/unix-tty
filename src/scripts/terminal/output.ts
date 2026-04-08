import type { OutputSink } from './types.js';

export function createOutput(root: HTMLElement, scrollHost: HTMLElement): OutputSink {
  const append = (el: HTMLElement) => {
    root.appendChild(el);
    if (!isSelecting()) scrollHost.scrollTop = scrollHost.scrollHeight;
  };

  const line = (text = '') => {
    const el = document.createElement('div');
    el.className = 'terminal-line';
    el.textContent = text;
    append(el);
  };

  const dim = (text: string) => {
    const el = document.createElement('div');
    el.className = 'terminal-line terminal-dim';
    el.textContent = text;
    append(el);
  };

  const error = (text: string) => {
    const el = document.createElement('div');
    el.className = 'terminal-line terminal-error';
    el.textContent = text;
    append(el);
  };

  const block = (lines: string[]) => {
    for (const l of lines) line(l);
  };

  const clear = () => {
    while (root.firstChild) root.removeChild(root.firstChild);
  };

  return { line, dim, error, block, clear };
}

export function isSelecting(): boolean {
  const sel = window.getSelection();
  return !!sel && sel.toString().length > 0;
}
