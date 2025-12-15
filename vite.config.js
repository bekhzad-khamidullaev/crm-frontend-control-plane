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
    proxy: {
      // Прокси для API, чтобы обойти CORS в dev
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔗 Backend not available - using mock data mode');
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📡 API Request:', req.method, req.url);
          });
        },
      },
      // Медиа/статика с backend (опционально)
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
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
