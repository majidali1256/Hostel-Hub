import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  process.env.BROWSER = 'safari'; // Attempt to force Safari
  return {
    server: {
      port: 5001,
      host: true, // Listen on all addresses (0.0.0.0)
      open: false, // Disable auto-open in Docker
      proxy: {
        '/api': {
          target: 'http://localhost:5002',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://localhost:5002',
          ws: true,
        }
      }
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
    }
  };
});
