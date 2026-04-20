import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. Importe o plugin

export default defineConfig({
  plugins: [
    react(),
    // 2. Configure o PWA aqui dentro
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sistema de Gestão Clínica Integrada',
        short_name: 'GestãoClínica',
        description: 'Plataforma de gestão para profissionais de saúde',
        theme_color: '#007A4D', // O verde que você já usa no layout
        background_color: '#ffffff',
        display: 'standalone', // Faz o app abrir sem a barra do navegador
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  
  // MANTENDO SUA CONFIGURAÇÃO DE CSS EXPLICITADA
  css: {
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly', 
    },
  },
})