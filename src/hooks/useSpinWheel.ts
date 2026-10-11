import { useCallback, useEffect, useRef, useState } from 'react';
import type { SoundPack, SpinnerSegment } from '../types/game';
import { SPINNER_SEGMENTS } from '../types/game';
import { sounds } from '../utils/sound';
import { startSpinTicks, stopSpinTicks } from '../utils/spinTicks';

export const SPIN_DURATION_MS = 3800;
const MIN_ROTATIONS = 5;
const MAX_ROTATIONS = 8;

export function calculateSpinRotation(current: number, index: number, count: number, random = Math.random()): number {
  const turns = MIN_ROTATIONS + Math.floor(random * (MAX_ROTATIONS - MIN_ROTATIONS + 1));
  const targetAngle = 360 - (index + 0.5) * (360 / count);
  const delta = (targetAngle - current % 360 + 360) % 360;
  return current + turns * 360 + delta;
}

type SpinOptions = {
  soundEnabled: boolean;
  soundPack: SoundPack;
  segments?: SpinnerSegment[];
  onTick?: () => void;
};

export function useSpinWheel(
  onSpinEnd: (segmentIndex: number) => void,
  options: SpinOptions,
) {
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded] = useState(false);
  const isSpinningRef = useRef(false);
  const rotationRef = useRef(0);
  const optionsRef = useRef(options);
  const onSpinEndRef = useRef(onSpinEnd);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const landedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  optionsRef.current = options;
  onSpinEndRef.current = onSpinEnd;

  useEffect(() => {
    return () => {
      stopSpinTicks();
      clearTimeout(spinTimerRef.current);
      clearTimeout(landedTimerRef.current);
      isSpinningRef.current = false;
    };
  }, []);

  const spin = useCallback(() => {
    if (isSpinningRef.current) return;
    isSpinningRef.current = true;
    setLanded(false);

    const segments = optionsRef.current.segments ?? SPINNER_SEGMENTS;
    const segmentCount = segments.length;

    // Surprise segments appear less often.
    const weights = segments.map((s) => (s.rare ? 0.6 : 1));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    let targetIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        targetIndex = i;
        break;
      }
    }

    const totalRotation = calculateSpinRotation(rotationRef.current, targetIndex, segmentCount);
    rotationRef.current = totalRotation;
    setRotation(totalRotation);

    if (optionsRef.current.soundEnabled) {
      sounds.spin(optionsRef.current.soundPack);
      startSpinTicks(true, optionsRef.current.soundPack);
    }

    spinTimerRef.current = setTimeout(() => {
      stopSpinTicks();
      isSpinningRef.current = false;
      setLanded(true);
      if (optionsRef.current.soundEnabled) {
        sounds.stop(optionsRef.current.soundPack);
      }
      onSpinEndRef.current(targetIndex);
      landedTimerRef.current = setTimeout(() => setLanded(false), 1200);
    }, SPIN_DURATION_MS);
  }, []);

  const resetRotation = useCallback(() => {
    clearTimeout(spinTimerRef.current);
    clearTimeout(landedTimerRef.current);
    stopSpinTicks();
    isSpinningRef.current = false;
    rotationRef.current = 0;
    setRotation(0);
    setLanded(false);
  }, []);

  const cancelSpin = useCallback(() => {
    if (isSpinningRef.current) resetRotation();
  }, [resetRotation]);

  return { spin, rotation, landed, resetRotation, cancelSpin };
}

export function useButtonFeedback(soundEnabled: boolean, soundPack: SoundPack, vibrate: boolean) {
  return useCallback(() => {
    if (soundEnabled) sounds.click(soundPack);
    if (vibrate && navigator.vibrate) navigator.vibrate(8);
  }, [soundEnabled, soundPack, vibrate]);
}

export function useApplyTheme(settings: {
  theme: string;
  fontChoice: string;
  bgTheme: string;
  animationStyle: string;
  colorblindMode: boolean;
  playerOneColor: string;
  playerTwoColor: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const reduce =
      settings.animationStyle === 'reduced' ||
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-font', settings.fontChoice);
    root.setAttribute('data-bg', settings.bgTheme);
    root.setAttribute('data-anim', reduce ? 'reduced' : settings.animationStyle);
    root.setAttribute('data-colorblind', String(settings.colorblindMode));
    root.style.setProperty('--player-one', settings.playerOneColor);
    root.style.setProperty('--player-two', settings.playerTwoColor);
    root.setAttribute('dir', 'rtl');
    root.setAttribute('lang', 'he');
  }, [settings]);
}
