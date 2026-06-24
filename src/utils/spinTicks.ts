import { sounds } from './sound';
import type { SoundPack } from '../types/game';

let tickTimeout: ReturnType<typeof setTimeout> | null = null;

export function startSpinTicks(enabled: boolean, pack: SoundPack) {
  stopSpinTicks();
  if (!enabled) return;

  let delay = 60;
  const tick = () => {
    sounds.tick(pack);
    delay = Math.min(delay + 12, 280);
    tickTimeout = setTimeout(tick, delay);
  };
  tick();
}

export function stopSpinTicks() {
  if (tickTimeout) {
    clearTimeout(tickTimeout);
    tickTimeout = null;
  }
}
