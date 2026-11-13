import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Keep browser API requests same-origin in development. Vite forwards them to
// the separately running Express server, whose default port is 3001.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = (env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '');

  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (error) => {
              console.error(
                `[TradeLink Admin] API proxy could not reach ${backendTarget}. Start the backend with "cd server && npm run dev" and confirm it is listening on this port. ${error.message}`
              );
            });
          }
        }
      }
    }
  };
});
