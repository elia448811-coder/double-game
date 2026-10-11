import { afterEach, beforeEach, expect, test, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test('missing audio support never blocks game effects or background music', async () => {
  vi.stubGlobal('window', {});
  const { sounds, startBackgroundMusic } = await import('./sound');
  expect(() => { sounds.start('default'); sounds.spin('default'); sounds.success('default'); startBackgroundMusic(true); vi.runAllTimers(); }).not.toThrow();
});

test('a denied audio device does not throw into the game', async () => {
  vi.stubGlobal('window', { AudioContext: class { constructor() { throw new Error('device unavailable'); } } });
  const { sounds, startBackgroundMusic } = await import('./sound');
  expect(() => { sounds.click('default'); startBackgroundMusic(true); }).not.toThrow();
});

test('working audio still creates and schedules its oscillator', async () => {
  const oscillator = { type: '', frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
  vi.stubGlobal('window', { AudioContext: class {
    state = 'running'; currentTime = 4; destination = {};
    createOscillator() { return oscillator; }
    createGain() { return gain; }
  } });
  const { sounds } = await import('./sound');
  sounds.click('soft');
  expect(oscillator.start).toHaveBeenCalledOnce();
  expect(oscillator.stop).toHaveBeenCalledWith(4.05);
  expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.025, 4);
});

test('legacy audio support and rejected resume requests are safe', async () => {
  const resume = vi.fn().mockRejectedValue(new Error('autoplay blocked'));
  vi.stubGlobal('window', { webkitAudioContext: class {
    state = 'suspended'; resume = resume;
    createOscillator() { throw new Error('audio unavailable'); }
  } });
  const { sounds } = await import('./sound');
  expect(() => sounds.click('default')).not.toThrow();
  await Promise.resolve();
  expect(resume).toHaveBeenCalledOnce();
});
