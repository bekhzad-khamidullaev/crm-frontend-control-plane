import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import obfuscatorPlugin from 'rollup-plugin-obfuscator';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const enableObfuscation =
    isProduction &&
    ['1', 'true', 'yes', 'on'].includes(
      String(env.VITE_ENABLE_OBFUSCATION || '').toLowerCase()
    );
  const packageVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')).version;
  const resolvedAppVersion = (env.VITE_APP_VERSION || packageVersion || 'dev').trim();

  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(resolvedAppVersion),
    },
    plugins: [
      react({ jsxRuntime: 'automatic' }),
      enableObfuscation && obfuscatorPlugin({
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.5,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.2,
          stringArray: true,
          stringArrayEncoding: ['rc4'],
          stringArrayThreshold: 0.5,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          selfDefending: true,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        },
      }),
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
            if (id.includes('node_modules')) {
              // TanStack stack (query + table)
              if (id.includes('@tanstack/react-query') || id.includes('@tanstack/react-table')) {
                return 'tanstack';
              }

              // CRM builder/editor dependencies
              if (id.includes('@craftjs/core')) {
                return 'craft';
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

              // Group the rest into shared vendor chunk.
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
      chunkSizeWarningLimit: 2600,

      // Compression
      reportCompressedSize: true,
    },

    esbuild: {
      jsx: 'automatic',
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    // Optimize deps
    resolve: {
      alias: {
        '@': '/src',
        '@/shared': '/src/shared',
        '@/entities': '/src/entities',
        '@/features': '/src/features',
        '@/widgets': '/src/widgets',
        '@/pages': '/src/pages',
        '@/app': '/src/app',
      },
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
