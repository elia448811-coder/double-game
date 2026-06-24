import type { SoundPack } from '../types/game';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  pack: SoundPack = 'default',
) {
  const ctx = getCtx();
  if (!ctx) return;

  const vol = pack === 'soft' ? volume * 0.5 : pack === 'playful' ? volume * 1.2 : volume;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  start: (pack: SoundPack) => {
    tone(523, 0.12, 'sine', 0.07, pack);
    setTimeout(() => tone(659, 0.15, 'sine', 0.07, pack), 80);
  },
  spin: (pack: SoundPack) => tone(800 + Math.random() * 200, 0.04, 'triangle', 0.04, pack),
  tick: (pack: SoundPack) => tone(600, 0.03, 'square', 0.03, pack),
  stop: (pack: SoundPack) => {
    tone(440, 0.1, 'sine', 0.09, pack);
    setTimeout(() => tone(330, 0.2, 'sine', 0.08, pack), 100);
  },
  success: (pack: SoundPack) => {
    tone(523, 0.1, 'sine', 0.09, pack);
    setTimeout(() => tone(659, 0.1, 'sine', 0.09, pack), 90);
    setTimeout(() => tone(784, 0.2, 'sine', 0.09, pack), 180);
  },
  skip: (pack: SoundPack) => tone(220, 0.15, 'sine', 0.06, pack),
  click: (pack: SoundPack) => tone(500, 0.05, 'sine', 0.05, pack),
};

let musicOsc: OscillatorNode | null = null;

export function startBackgroundMusic(enabled: boolean) {
  stopBackgroundMusic();
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  musicOsc = ctx.createOscillator();
  const gain = ctx.createGain();
  musicOsc.type = 'sine';
  musicOsc.frequency.value = 174;
  gain.gain.value = 0.012;
  musicOsc.connect(gain);
  gain.connect(ctx.destination);
  musicOsc.start();
}

export function stopBackgroundMusic() {
  try {
    musicOsc?.stop();
  } catch {
    /* already stopped */
  }
  musicOsc = null;
}
