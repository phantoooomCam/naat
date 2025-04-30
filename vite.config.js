import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '',
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:44444",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
