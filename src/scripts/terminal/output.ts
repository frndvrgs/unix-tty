import type { LineSegment, OutputSink } from './types.js';

export function renderRichLine(segments: LineSegment[]): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'terminal-line';
  for (const seg of segments) {
    if (typeof seg === 'string') {
      el.appendChild(document.createTextNode(seg));
    } else {
      const span = document.createElement('span');
      span.className = 'terminal-clickable';
      span.textContent = seg.text;
      span.dataset.insert = seg.insert ?? seg.text;
      el.appendChild(span);
    }
  }
  return el;
}

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

  const lineRich = (segments: LineSegment[]) => {
    append(renderRichLine(segments));
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

  // No-op: the motd-time sink doesn't drive post-command haptics.
  // Only the `commandOut` sink constructed inside boot()'s run()
  // closure does, because only that sink has access to the shared
  // hapticKind state.
  const haptic = () => {};

  return { line, lineRich, dim, error, block, clear, haptic };
}

export function isSelecting(): boolean {
  const sel = window.getSelection();
  return !!sel && sel.toString().length > 0;
}
