export const CLOUD_WATERMARK_KEY = 'couple-spin-cloud-updated-at';

export function markLocalCloudWatermark(ms = Date.now()): void {
  try { localStorage.setItem(CLOUD_WATERMARK_KEY, String(ms)); } catch { /* Storage can be unavailable. */ }
}
