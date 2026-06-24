import { describe, expect, it } from 'vitest';
import { resolveDeviceLayout, resolveOrientation } from '../hooks/useDeviceLayout';

/** מכשירים אמיתיים — רוחב×גובה */
const DEVICE_MATRIX = [
  { name: 'iPhone SE', width: 375, height: 667, device: 'mobile', orientation: 'portrait' },
  { name: 'iPhone 14', width: 390, height: 844, device: 'mobile', orientation: 'portrait' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, device: 'mobile', orientation: 'portrait' },
  { name: 'iPhone landscape', width: 844, height: 390, device: 'mobile', orientation: 'landscape' },
  { name: 'iPad Mini portrait', width: 768, height: 1024, device: 'tablet', orientation: 'portrait' },
  { name: 'iPad Air portrait', width: 820, height: 1180, device: 'tablet', orientation: 'portrait' },
  { name: 'iPad Pro 11 portrait', width: 834, height: 1194, device: 'tablet', orientation: 'portrait' },
  { name: 'iPad Pro 12.9 portrait', width: 1024, height: 1366, device: 'tablet', orientation: 'portrait' },
  { name: 'iPad landscape', width: 1180, height: 820, device: 'tablet', orientation: 'landscape' },
  { name: 'iPad Pro 12.9 landscape', width: 1366, height: 1024, device: 'tablet', orientation: 'landscape' },
] as const;

describe('responsive layout matrix', () => {
  for (const d of DEVICE_MATRIX) {
    it(`${d.name} (${d.width}×${d.height}) → ${d.device} ${d.orientation}`, () => {
      expect(resolveDeviceLayout(d.width, d.height)).toBe(d.device);
      expect(resolveOrientation(d.width, d.height)).toBe(d.orientation);
    });
  }

  it('breakpoint at 767/768 is stable on shortest side', () => {
    expect(resolveDeviceLayout(767, 900)).toBe('mobile');
    expect(resolveDeviceLayout(900, 767)).toBe('mobile');
    expect(resolveDeviceLayout(768, 1024)).toBe('tablet');
    expect(resolveDeviceLayout(1024, 768)).toBe('tablet');
  });

  it('every viewport maps to a known layout', () => {
    for (let w = 320; w <= 1400; w += 50) {
      for (let h = 500; h <= 1400; h += 100) {
        expect(['mobile', 'tablet']).toContain(resolveDeviceLayout(w, h));
      }
    }
  });
});

describe('responsive hook contract', () => {
  it('phone landscape stays mobile (shortest side rule)', () => {
    expect(resolveDeviceLayout(844, 390)).toBe('mobile');
    expect(resolveDeviceLayout(932, 430)).toBe('mobile');
  });

  it('iPad stays tablet in landscape', () => {
    expect(resolveDeviceLayout(1180, 820)).toBe('tablet');
    expect(resolveDeviceLayout(1366, 1024)).toBe('tablet');
  });
});
