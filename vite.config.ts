import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteGerarPlanoPlugin } from './server/api/gerar-plano'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteGerarPlanoPlugin()],
})

