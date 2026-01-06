// src/pages/LoginPage.jsx
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ✅ ADICIONANDO CONFIGURAÇÃO EXPLÍCITA PARA CSS
  css: {
    modules: {
      // Configura como o Vite deve lidar com os módulos
      // (Esta é a configuração padrão, mas garantimos que está ativa)
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly', 
    },
  },
})