import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';
  const sitePass = env.PASS_ ?? '';

  return {
    base,
    define: {
      __SITE_PASS__: JSON.stringify(sitePass),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'ספין זוגי | Couple Spin',
          short_name: 'ספין זוגי',
          description: 'משחק משימות מצחיק וכיפי לזוגות — בלי שאלות, רק משימות!',
          theme_color: '#10071f',
          background_color: '#10071f',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'he',
          dir: 'rtl',
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}favicon.svg`,
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
            {
              src: `${base}favicon.svg`,
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,woff2,webmanifest}'],
          navigateFallback: `${base}index.html`,
        },
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2020',
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
