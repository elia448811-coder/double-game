import { useEffect } from 'react';

/** Phone layout — viewport width under 768px */
export type DeviceLayout = 'mobile' | 'tablet';

export type DeviceOrientation = 'portrait' | 'landscape';

const MOBILE_MAX = 767;

/** Uses the shortest screen side so phone landscape stays mobile. */
export function resolveDeviceLayout(width: number, height = width): DeviceLayout {
  const shortestSide = Math.min(width, height);
  return shortestSide <= MOBILE_MAX ? 'mobile' : 'tablet';
}

export function resolveOrientation(width: number, height: number): DeviceOrientation {
  return height > width ? 'portrait' : 'landscape';
}

function applyDeviceAttributes(width: number, height: number) {
  const root = document.documentElement;
  const device = resolveDeviceLayout(width, height);
  const orientation = resolveOrientation(width, height);

  root.dataset.device = device;
  root.dataset.orientation = orientation;
  root.dataset.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'true' : 'false';
}

export function useDeviceLayout() {
  useEffect(() => {
    const update = () => applyDeviceAttributes(window.innerWidth, window.innerHeight);

    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
}
