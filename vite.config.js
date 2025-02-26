import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig( {
  plugins: [ react() ],
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
      '/auth': {
        target: 'http://180.149.240.169:8081', // Authentication server
        changeOrigin: true,
        secure: false, // Set to true if using HTTPS
        rewrite: ( path ) => path.replace( /^\/auth/, '/auth' ),
      },
    },
  },
} );
