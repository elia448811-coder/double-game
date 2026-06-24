import { describe, expect, it } from 'vitest';
import { resolveDeviceLayout, resolveOrientation } from '../hooks/useDeviceLayout';

describe('device layout', () => {
  it('uses mobile when shortest side is ≤767px', () => {
    expect(resolveDeviceLayout(390, 844)).toBe('mobile');
    expect(resolveDeviceLayout(844, 390)).toBe('mobile');
    expect(resolveDeviceLayout(767, 1024)).toBe('mobile');
  });

  it('uses tablet when shortest side is ≥768px', () => {
    expect(resolveDeviceLayout(768, 1024)).toBe('tablet');
    expect(resolveDeviceLayout(820, 1180)).toBe('tablet');
    expect(resolveDeviceLayout(1180, 820)).toBe('tablet');
  });

  it('detects orientation', () => {
    expect(resolveOrientation(390, 844)).toBe('portrait');
    expect(resolveOrientation(844, 390)).toBe('landscape');
    expect(resolveOrientation(1024, 768)).toBe('landscape');
  });
});
