import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Enable code splitting and chunk optimization
        rollupOptions: {
          output: {
            // Manual chunk splitting for better caching
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('recharts')) {
                  return 'recharts';
                }
                if (id.includes('@google/genai')) {
                  return 'google-genai';
                }
                // Other node_modules go into vendor chunk
                return 'vendor';
              }
            },
            // Optimize chunk file names
            chunkFileNames: 'js/[name]-[hash].js',
            entryFileNames: 'js/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        },
        // Enable minification (esbuild is faster than terser)
        minify: 'esbuild',
        // Remove console.log in production
        esbuild: {
          drop: mode === 'production' ? ['console', 'debugger'] : [],
        },
        // Chunk size warnings threshold (500kb)
        chunkSizeWarningLimit: 500,
        // Enable source maps for production debugging (optional)
        sourcemap: mode === 'development',
        // Target modern browsers for smaller bundle
        target: 'es2015',
        // CSS code splitting
        cssCodeSplit: true,
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: ['@google/genai'], // Exclude large deps from pre-bundling
      },
    };
});
