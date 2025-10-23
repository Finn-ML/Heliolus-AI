import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    cors: {
      origin: true,  // Allow all origins (required for Replit external access)
      credentials: true
    },
    hmr: {
      protocol: 'wss',  // Secure WebSocket for HTTPS
      host: process.env.REPLIT_DEV_DOMAIN,  // Use Replit's actual dev domain
      clientPort: 443,  // Replit proxy uses HTTPS on 443
      overlay: false
    },
    proxy: {
      '/v1': {
        target: 'http://localhost:8543',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react({
      // Include specific file extensions
      include: '**/*.{jsx,tsx}',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true, // Force optimization to clear any cached issues
  },
});
