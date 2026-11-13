import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = dirname(fileURLToPath(import.meta.url))
const serverDir = resolve(appDir, '../server')

export default defineConfig(({ mode }) => {
  // Only VITE_-prefixed client values are eligible for browser exposure.
  const clientEnv = loadEnv(mode, appDir, 'VITE_')
  // Read backend settings locally for the proxy only; never pass them to client code.
  const serverEnv = loadEnv(mode, serverDir, '')
  const unsafeClientKeys = Object.keys(clientEnv).filter((key) =>
    /(SECRET|PASSWORD|API[_-]?KEY|DATABASE|DB_|SMTP|JWT|PRIVATE|TOKEN|CLOUDINARY)/i.test(key)
  )

  if (unsafeClientKeys.length > 0) {
    throw new Error(
      '[TradeLink] Refusing to expose sensitive VITE_ variables to the browser: ' +
      unsafeClientKeys.join(', ') +
      '. Keep credentials in server/.env without the VITE_ prefix.'
    )
  }

  const backendHost = serverEnv.HOST && serverEnv.HOST !== '0.0.0.0'
    ? serverEnv.HOST
    : '127.0.0.1'
  const backendPort = Number(serverEnv.PORT) || 3001
  const backendTarget = (
    clientEnv.VITE_API_PROXY_TARGET || `http://${backendHost}:${backendPort}`
  ).replace(/\\/+$/, '')

  return {
    root: appDir,
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      hmr: {
        host: 'localhost',
        clientPort: 5173
      },
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (error) => {
              console.error(
                `[TradeLink] API proxy could not reach ${backendTarget}. Run "npm run dev" from the repository root, or start the backend with "cd server && npm run dev". ${error.message}`
              )
            })
          }
        },
        '/socket.io': {
          target: backendTarget,
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
})
