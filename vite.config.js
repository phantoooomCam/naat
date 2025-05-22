import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '',
  server: {
    proxy: {
      "/api": {
         target: "http://192.168.100.89:44444",
        // target: "http://100.120.219.28:44444",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
