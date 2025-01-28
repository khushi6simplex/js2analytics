import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/analytics',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/reveloadmin35': {
        target: 'http://180.149.240.169:8080',
        changeOrigin: true,
      },
    },
  },
});
