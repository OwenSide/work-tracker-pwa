import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WorkTracker PWA',
        short_name: 'WorkTracker',
        description: 'Трекер рабочего времени и заработка',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        icons: [
          {
            // Стандартная иконка для установки (можешь потом заменить ссылку на свою)
            src: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/work-tracker-pwa/', // Твой путь
})