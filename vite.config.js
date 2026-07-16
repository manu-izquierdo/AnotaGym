import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // Fotos de ejercicios (jsDelivr) e imágenes de respaldo (Unsplash):
        // una vez vistas quedan cacheadas → con la wifi mala del gimnasio (o sin
        // cobertura) cargan al instante desde el dispositivo.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db@.*\.(?:jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-photos',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fallback-photos',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        lang: 'es',
        name: 'AnotaGym: Tu Agenda para el Gym',
        short_name: 'AnotaGym',
        description: 'Tu agenda inteligente para el gimnasio. Registra rutinas, sigue tu progreso y sincroniza en todos tus dispositivos.',
        theme_color: '#09090b', // zinc-950
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Chunks separados: el catálogo de ejercicios y firebase casi nunca
        // cambian entre releases → el navegador los mantiene en caché
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/app-check'],
          exercises: ['./src/data/exerciseLibrary.js'],
        },
      },
    },
  },
})
