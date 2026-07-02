import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
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
          exercises: ['./src/data/extendedLibrary.js'],
        },
      },
    },
  },
})
