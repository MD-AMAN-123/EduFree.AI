import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.png', 'logo.jpg'],
          manifest: {
            name: 'EduFree.AI',
            short_name: 'EduFree',
            description: 'AI-powered offline learning platform',
            theme_color: '#4f46e5',
            background_color: '#0f172a',
            display: 'standalone',
            start_url: '/',
            icons: [
              { src: 'favicon.png', sizes: '192x192', type: 'image/png' },
              { src: 'favicon.png', sizes: '512x512', type: 'image/png' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: { cacheName: 'supabase-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
