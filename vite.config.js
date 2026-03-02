import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [
      react({ jsxRuntime: 'automatic' }),
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
        '/api': {
          target: env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, _res) => {
              console.error('❌ Proxy Error:', err.message, 'on', req.method, req.url);
              console.log('🔗 Targeting:', env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://127.0.0.1:8000');
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📡 API Request:', req.method, req.url);
            });
          },
        },
        '/media': {
          target: env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'esbuild' : false,
      cssMinify: true,

      rollupOptions: {
        output: {
          // Optimize chunk splitting
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // Removed react-vendor explicit split to prevent circular dependencies with 'object-assign' and other internals

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
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            if (extType === 'css') {
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
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    // Optimize deps
    resolve: {
      alias: [
        { find: /^antd$/, replacement: '/src/lib/radix-compat.jsx' },
        { find: /^antd\/locale\/en_US$/, replacement: '/src/lib/antd-shim/locale/en_US.js' },
        { find: /^antd\/locale\/ru_RU$/, replacement: '/src/lib/antd-shim/locale/ru_RU.js' },
        { find: /^antd\/locale\/uz_UZ$/, replacement: '/src/lib/antd-shim/locale/uz_UZ.js' },
        { find: '@/shared', replacement: '/src/shared' },
        { find: '@/entities', replacement: '/src/entities' },
        { find: '@/features', replacement: '/src/features' },
        { find: '@/widgets', replacement: '/src/widgets' },
        { find: '@/pages', replacement: '/src/pages' },
        { find: '@/app', replacement: '/src/app' },
        { find: '@', replacement: '/src' },
      ],
    },
    optimizeDeps: {
      entries: ['index.html'],
      include: ['react', 'react-dom', 'dayjs', 'chart.js', 'react-chartjs-2'],
      exclude: ['@playwright/test', 'playwright', 'playwright-core', 'fsevents', 'chromium-bidi'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  };
});
