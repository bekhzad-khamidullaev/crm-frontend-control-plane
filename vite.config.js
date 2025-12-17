import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      // Bundle analyzer (only in production build)
      isProduction && visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Прокси для API, чтобы обойти CORS в dev
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
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
        // Медиа/статика с backend
        '/media': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true, // No sourcemaps in production for security
      minify: isProduction ? 'esbuild' : false,
      cssMinify: true,
      
      rollupOptions: {
        output: {
          // Optimize chunk splitting
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              
              // Ant Design core
              if (id.includes('antd') && !id.includes('@ant-design/icons')) {
                return 'antd-core';
              }
              
              // Ant Design icons
              if (id.includes('@ant-design/icons')) {
                return 'antd-icons';
              }
              
              // Chart.js
              if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                return 'charts';
              }
              
              // PDF export (lazy loaded)
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'pdf-export';
              }
              
              // Drag and drop
              if (id.includes('@dnd-kit')) {
                return 'dnd';
              }
              
              // Other node_modules
              return 'vendor';
            }
          },
          
          // Asset naming
          chunkFileNames: isProduction
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          entryFileNames: isProduction
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/images/[name]-[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`;
            } else if (extType === 'css') {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Compression
      reportCompressedSize: true,
    },
    
    esbuild: {
      jsx: 'automatic',
      // Drop console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    
    // Optimize deps
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'antd',
        '@ant-design/icons',
        'dayjs',
        'chart.js',
        'react-chartjs-2',
      ],
    },
  };
});
