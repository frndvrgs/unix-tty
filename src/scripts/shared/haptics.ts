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

/**
 * Light, single-pulse haptic for routine command completion. Short
 * and subtle so it feels like confirmation, not celebration.
 */
export function hapticsCommand(): void {
  void getInstance().trigger([{ duration: 25 }], { intensity: 0.7 });
}

/**
 * Two-pulse haptic for running an "app" — currently only used when
 * the `read` command opens a document. Uses the built-in `success`
 * preset which is a stronger, more celebratory pattern than the
 * routine-command feedback above.
 */
export function hapticsRun(): void {
  void getInstance().trigger('success');
}

/**
 * Three-tap error haptic. Fired automatically after any command run
 * that called `out.error` or threw an exception.
 */
export function hapticsError(): void {
  void getInstance().trigger('error');
}
