import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '',
  server: {
    host:'0.0.0.0',
    proxy: {
      "/api": {
         target: "http://192.168.100.89:44444",
        // target: "http://100.120.219.28:44444",
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
      target: 'http://192.168.100.207:8000',
      changeOrigin: true,
      secure: false, 
      },
      // Net-link migrated module backend endpoints (CORS avoidance via dev proxy)
      "/related": {
        target: "http://192.168.100.207:8000",
        changeOrigin: true,
        secure: false,
      },
      "/scrape": {
        target: "http://192.168.100.207:8000",
        changeOrigin: true,
        secure: false,
      },
      "/export": {
        target: "http://192.168.100.207:8000",
        changeOrigin: true,
        secure: false,
      },
      "/graph-session": {
        target: "http://192.168.100.207:8000",
        changeOrigin: true,
        secure: false,
      },
      "/upload-image": {
        target: "http://192.168.100.207:8000",
        changeOrigin: true,
        secure: false,
      },
      "/files": {
        target: "http://192.168.100.207:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
