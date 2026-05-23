import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 30000,
      },
      '/socket.io': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite] socket.io proxy error — is backend running on', API_TARGET, '?', err.message);
          });
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@clerk/react'],
  },
});
