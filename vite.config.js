import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //  base:'',
  server: {
    host: '0.0.0.0', // Permite conexiones desde cualquier dispositivo en la red
    port: 5173, // Puedes cambiar el puerto si es necesario
    strictPort: true, // Asegura que use ese puerto específico
  },
  
})


