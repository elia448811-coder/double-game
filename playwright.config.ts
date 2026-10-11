import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4184',
    trace: 'on-first-retry',
  },
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --port 4184 --strictPort', url: 'http://127.0.0.1:4184',
      env: { VITE_PREVIEW_MODE: 'true' }, reuseExistingServer: false },
    { command: 'npm run preview -- --host 127.0.0.1 --port 4183 --strictPort', url: 'http://127.0.0.1:4183', reuseExistingServer: false },
  ],
  projects: [
    { name: 'small-phone', use: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true } },
    { name: 'iphone-se', use: { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true } },
    { name: 'pixel', use: { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } },
    { name: 'large-phone', use: { viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true } },
    { name: 'landscape-phone', use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
    { name: 'ipad', use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'ipad-air', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'ipad-landscape', use: { viewport: { width: 1180, height: 820 }, hasTouch: true } },
    { name: 'ipad-pro', use: { viewport: { width: 1366, height: 1024 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1365, height: 900 } } },
    { name: 'ipad-safari-portrait', use: { browserName: 'webkit', viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true } },
    { name: 'ipad-safari-landscape', use: { browserName: 'webkit', viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true } },
  ],
});
