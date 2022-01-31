import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: path.resolve(__dirname, '../../public'),
  build: {
    outDir: path.resolve(__dirname, '../../build/server/client'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
