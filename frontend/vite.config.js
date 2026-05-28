import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // не разрешать junction'ы в реальный путь — иначе Vite уйдёт через
    // /@fs/ на путь с кириллицей и упадёт на decodeURI (Windows).
    preserveSymlinks: true,
    alias: {
      '@sdk': resolve(__dirname, '_sdk'),
      '@templates': resolve(__dirname, '_templates'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: ['localhost', '.trycloudflare.com'],
  },
});
