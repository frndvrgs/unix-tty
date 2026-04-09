import { WebHaptics } from 'web-haptics';

let instance: WebHaptics | null = null;

function getInstance(): WebHaptics {
  if (!instance) {
    instance = new WebHaptics();
  }
  return instance;
}

export function hapticsCommand(): void {
  void getInstance().trigger([{ duration: 25 }], { intensity: 0.7 });
}

export function hapticsRun(): void {
  void getInstance().trigger('success');
}

export function hapticsError(): void {
  void getInstance().trigger('error');
}
