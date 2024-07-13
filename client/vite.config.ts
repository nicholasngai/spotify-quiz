import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: path.resolve(__dirname, '../public'),
  build: {
    outDir: path.resolve(__dirname, '../build/dist/www'),
    emptyOutDir: true,
  },
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '^/api(/.*)?$': 'http://localhost:8080',
    },
  },
});
