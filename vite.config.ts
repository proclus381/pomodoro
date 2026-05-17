import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Pomodoro Deep Work',
        short_name: 'Pomodoro',
        description: 'Research-optimized focus timer. Calm, local-first, no tracking.',
        theme_color: '#1a1a1a',
        background_color: '#0f0f0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,ogg,wav}']
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
