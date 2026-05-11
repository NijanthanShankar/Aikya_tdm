import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // API calls go to /api/*.php — proxy them in dev to your local server
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',  // change to your local PHP server if needed
        changeOrigin: true,
      },
    },
  },
  build: {
    // Output to root-level 'dist/' — upload this to Hostinger public_html
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Keep asset names predictable
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
