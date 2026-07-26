import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true // Позволяет открывать приложение с телефона по IP-адресу
  },
  base: "/work-tracker-pwa/", // Замени на свой актуальный путь, если он другой
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Обязательно оставляем включенным для npm run dev
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, 
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true, 
      },
      includeAssets: ['icon-512.png'], // Укажи тут свои иконки
      manifest: {
        name: 'WorkTracker App',
        short_name: 'WorkTracker',
        description: 'Трекер рабочего времени и заработка',
        theme_color: '#030303', // Наш темный фон
        background_color: '#030303',
        display: 'standalone', // Та самая магия, скрывающая браузер
        icons: [
          {
            src: 'icon-512.png', // Убедись, что этот файл есть в папке public
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'apple touch icon' // Специально для капризного iOS
          }
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})