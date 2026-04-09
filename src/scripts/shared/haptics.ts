import { WebHaptics } from 'web-haptics';

// Single shared WebHaptics instance. Mounted lazily on first use so
// server-side rendering never touches the constructor. Triggers are
// no-ops on devices without vibration support (desktop browsers,
// iOS without a supported build, etc.) — the library handles the
// capability check internally.
let instance: WebHaptics | null = null;

function getInstance(): WebHaptics {
  if (!instance) {
    instance = new WebHaptics();
  }
  return instance;
}

export function hapticSuccess(): void {
  void getInstance().trigger('success');
}

export function hapticError(): void {
  void getInstance().trigger('error');
}
