import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

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
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (_err, _req, _res) => {
              console.log('Backend not available - using mock data mode');
            });
          },
        },
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
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'esbuild' : false,
      cssMinify: true,
      rollupOptions: {
        output: {
          chunkFileNames: isProduction ? 'assets/js/[name]-[hash].js' : 'assets/js/[name].js',
          entryFileNames: isProduction ? 'assets/js/[name]-[hash].js' : 'assets/js/[name].js',
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
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: true,
    },

    esbuild: {
      jsx: 'automatic',
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'antd', '@ant-design/icons', 'dayjs', 'chart.js', 'react-chartjs-2'],
    },
  };
});
