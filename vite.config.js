import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Исправление для React 19
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  esbuild: {
    // Дополнительное исправление для React 19
    jsx: 'automatic',
  },
});
