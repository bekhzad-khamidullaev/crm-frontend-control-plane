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
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          
          // Ant Design core (largest dependency)
          'antd-core': ['antd'],
          
          // Ant Design icons (separate chunk)
          'antd-icons': ['@ant-design/icons'],
          
          // Chart.js and related
          'charts': ['chart.js', 'react-chartjs-2'],
          
          // PDF generation (lazy loaded but still chunked separately)
          'pdf-export': ['jspdf', 'html2canvas'],
          
          // Drag and drop
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          
          // Utilities
          'utils': ['dayjs', 'prop-types'],
        },
      },
    },
    // Increase chunk size warning limit (we'll optimize further)
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // Дополнительное исправление для React 19
    jsx: 'automatic',
  },
});
