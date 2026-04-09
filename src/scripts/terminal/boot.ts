import type { UnixTtyConfig } from '../../config.js';
import { hapticsCommand, hapticsError, hapticsRun } from '../shared/haptics.js';
import { buildRegistry, commandNames } from './commands/index.js';
import { createFs } from './fs.js';
import { createHistory } from './history.js';
import { createOutput, isSelecting, renderRichLine } from './output.js';
import { complete } from './tabComplete.js';
import { createTheme } from './theme.js';
import type { FsManifest, OutputSink, PostCommandHaptic } from './types.js';

export default async function boot(config: UnixTtyConfig): Promise<void> {
  const root = document.getElementById('terminal');
  if (!root) throw new Error('unix-tty: #terminal element not found');

  const response = await fetch('/fs.json');
  if (!response.ok) throw new Error('unix-tty: failed to load /fs.json');
  const manifest: FsManifest = await response.json();

  const output = createOutput(root, root);

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

  if (logoElement) {
    output.dim('');
  }
  for (const raw of manifest.site.motd) {
    const text = raw.replace('{version}', manifest.site.unixVersion).replace('{buildDate}', manifest.site.buildDate);
    output.dim(text);
  }
  output.dim('');

  // prompt line
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

  const appendAbovePrompt = (el: HTMLElement) => {
    root.insertBefore(el, promptLine);
    if (!isSelecting()) root.scrollTop = root.scrollHeight;
  };

  // Flipped to true by commandOut.error below so run() knows which
  // haptic to fire after a command finishes. Commands execute serially
  // (each Enter awaits the previous run), so a single shared flag is
  // safe — there's never more than one in-flight run at a time.
  let errorDuringRun = false;

  // Default post-command haptic kind. Commands can upgrade their run
  // to 'run' via `out.haptic('run')` — currently only `read` does.
  // Error still wins over both via errorDuringRun.
  //
  // Accessed through function wrappers below so TS's control-flow
  // analysis doesn't narrow it to the 'command' literal after each
  // reset assignment — it can be mutated by commandOut.haptic during
  // dispatch, and the closing comparison against 'run' must stay
  // well-typed.
  let hapticKind: PostCommandHaptic = 'command';
  const setHapticKind = (kind: PostCommandHaptic) => {
    hapticKind = kind;
  };
  const getHapticKind = (): PostCommandHaptic => hapticKind;

  const commandOut: OutputSink = {
    line: (text) => {
      const el = document.createElement('div');
      el.className = 'terminal-line';
      el.textContent = text ?? '';
      appendAbovePrompt(el);
    },
    lineRich: (segments) => {
      appendAbovePrompt(renderRichLine(segments));
    },
    dim: (text) => {
      const el = document.createElement('div');
      el.className = 'terminal-line terminal-dim';
      el.textContent = text;
      appendAbovePrompt(el);
    },
    error: (text) => {
      errorDuringRun = true;
      const el = document.createElement('div');
      el.className = 'terminal-line terminal-error';
      el.textContent = text;
      appendAbovePrompt(el);
    },
    block: (lines) => {
      for (const l of lines) {
        const el = document.createElement('div');
        el.className = 'terminal-line';
        el.textContent = l;
        appendAbovePrompt(el);
      }
    },
    clear: () => {
      while (root.firstChild && root.firstChild !== promptLine) {
        root.removeChild(root.firstChild);
      }
    },
    haptic: (kind) => {
      setHapticKind(kind);
    },
  };

  const run = async (line: string) => {
    const echoEl = document.createElement('div');
    echoEl.className = 'terminal-line';
    echoEl.textContent = `${promptSpan.textContent}${line}`;
    appendAbovePrompt(echoEl);

    const trimmed = line.trim();
    // Empty input (bare Enter) is a no-op: no history, no haptic.
    if (!trimmed) return;
    history.push(trimmed);

    errorDuringRun = false;
    setHapticKind('command');

    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = registry[name!];
    if (!cmd) {
      commandOut.error(`${name}: command not found`);
    } else {
      try {
        await cmd.run({
          fs,
          args,
          raw: trimmed,
          out: commandOut,
          theme,
          history,
          manifest,
        });
      } catch (err) {
        commandOut.error(err instanceof Error ? err.message : String(err));
      }
    }

    // Haptic feedback. Error always wins if commandOut.error fired at
    // any point during the run (unknown command, command error output,
    // or caught exception). Otherwise fire the kind the command asked
    // for via out.haptic(...) — defaults to 'command' (subtle pulse),
    // upgraded to 'run' by app-launching commands like `read`. All
    // no-ops on devices without vibration support. Read through
    // getHapticKind() to dodge TS's narrow-after-assign tracking.
    if (errorDuringRun) {
      hapticsError();
    } else if (getHapticKind() === 'run') {
      hapticsRun();
    } else {
      hapticsCommand();
    }

    updatePrompt();
  };

  // keybindings
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
        appendAbovePrompt(echo);
        const list = document.createElement('div');
        list.className = 'terminal-line';
        list.textContent = result.candidates.join('  ');
        appendAbovePrompt(list);
      }
      return;
    }
  });

  const insertAtCursor = (text: string) => {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const newPos = start + text.length;
    input.setSelectionRange(newPos, newPos);
    input.focus();
  };

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const clickable = target.closest<HTMLElement>('.terminal-clickable');
    if (!clickable) return;
    const value = clickable.dataset.insert;
    if (value !== undefined) {
      event.stopPropagation();
      insertAtCursor(value);
    }
  });

  // click-to-focus
  document.addEventListener('click', () => {
    if (!isSelecting()) input.focus();
  });

  input.focus();
}
