import type { UnixTtyConfig } from '../../config.js';
import { createOutput, isSelecting } from './output.js';
import { createFs } from './fs.js';
import { createTheme } from './theme.js';
import { createHistory } from './history.js';
import { complete } from './tabComplete.js';
import { buildRegistry, commandNames } from './commands/index.js';
import type { FsManifest } from './types.js';

export default async function boot(config: UnixTtyConfig): Promise<void> {
  const root = document.getElementById('terminal');
  if (!root) throw new Error('unix-tty: #terminal element not found');

  const response = await fetch('/fs.json');
  if (!response.ok) throw new Error('unix-tty: failed to load /fs.json');
  const manifest: FsManifest = await response.json();

  const output = createOutput(root, document.scrollingElement as HTMLElement ?? document.documentElement);

  // Optional themed logo above the motd. When the config provides a
  // URL map, we create an <img> and hand it (along with the URLs) to
  // the theme controller, which keeps the src in sync with the active
  // theme on every `colors` cycle.
  let logoElement: HTMLImageElement | undefined;
  if (config.terminal.logo) {
    logoElement = document.createElement('img');
    logoElement.className = 'terminal-logo';
    logoElement.alt = manifest.site.hostname;
    root.appendChild(logoElement);
  }

  const theme = createTheme(manifest.site.defaultTheme, {
    logoElement,
    logoUrls: config.terminal.logo,
  });
  const fs = createFs(manifest, manifest.site.home);
  const history = createHistory();
  const registry = buildRegistry();
  const names = commandNames(registry);

  // Motd
  for (const raw of manifest.site.motd) {
    const text = raw
      .replace('{version}', manifest.site.unixVersion)
      .replace('{buildDate}', manifest.site.buildDate);
    output.dim(text);
  }
  output.dim('');

  // Prompt line
  const promptLine = document.createElement('div');
  promptLine.className = 'terminal-prompt-line';
  const promptSpan = document.createElement('span');
  promptSpan.className = 'terminal-prompt';
  const input = document.createElement('input');
  input.className = 'terminal-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  promptLine.appendChild(promptSpan);
  promptLine.appendChild(input);
  root.appendChild(promptLine);

  const updatePrompt = () => {
    const cwd = fs.cwd();
    const display = cwd === manifest.site.home ? '~' : cwd;
    promptSpan.textContent = `${manifest.site.user}@${manifest.site.hostname}:${display}$ `;
  };
  updatePrompt();

  // Run a single command line.
  const run = async (line: string) => {
    // Echo the entered line with the prompt above, as a history-style trace.
    const echoEl = document.createElement('div');
    echoEl.className = 'terminal-line';
    echoEl.textContent = `${promptSpan.textContent}${line}`;
    root.insertBefore(echoEl, promptLine);

    const trimmed = line.trim();
    if (!trimmed) return;
    history.push(trimmed);

    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = registry[name!];
    if (!cmd) {
      output.error(`${name}: command not found`);
      return;
    }

    try {
      await cmd.run({
        fs,
        args,
        raw: trimmed,
        out: {
          line: (text) => {
            const el = document.createElement('div');
            el.className = 'terminal-line';
            el.textContent = text ?? '';
            root.insertBefore(el, promptLine);
            if (!isSelecting()) window.scrollTo(0, document.body.scrollHeight);
          },
          dim: (text) => {
            const el = document.createElement('div');
            el.className = 'terminal-line terminal-dim';
            el.textContent = text;
            root.insertBefore(el, promptLine);
          },
          error: (text) => {
            const el = document.createElement('div');
            el.className = 'terminal-line terminal-error';
            el.textContent = text;
            root.insertBefore(el, promptLine);
          },
          block: (lines) => {
            for (const l of lines) {
              const el = document.createElement('div');
              el.className = 'terminal-line';
              el.textContent = l;
              root.insertBefore(el, promptLine);
            }
          },
          clear: () => {
            while (root.firstChild && root.firstChild !== promptLine) {
              root.removeChild(root.firstChild);
            }
          },
        },
        theme,
        history,
        manifest,
      });
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
    }

    updatePrompt();
  };

  // Keybindings
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = input.value;
      input.value = '';
      void run(value);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = history.prev();
      if (prev !== null) input.value = prev;
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = history.next();
      input.value = next ?? '';
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const result = complete({ value: input.value, commands: names, fs });
      input.value = result.value;
      if (result.candidates.length > 0) {
        const echo = document.createElement('div');
        echo.className = 'terminal-line';
        echo.textContent = `${promptSpan.textContent}${input.value}`;
        root.insertBefore(echo, promptLine);
        const list = document.createElement('div');
        list.className = 'terminal-line';
        list.textContent = result.candidates.join('  ');
        root.insertBefore(list, promptLine);
      }
      return;
    }
  });

  // Click-to-focus (guarded against selection)
  document.addEventListener('click', () => {
    if (!isSelecting()) input.focus();
  });

  input.focus();
}
