import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The admin panel is built into public/admin and served by Express at /admin/.
export default defineConfig({
  root: import.meta.dirname,
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: {
    outDir: path.resolve(import.meta.dirname, '../public/admin'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    proxy: {
      '/admin/api': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/examples': 'http://localhost:3000',
    },
  },
});
