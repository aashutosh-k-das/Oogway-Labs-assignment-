import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Emits dist/sw.js from service-worker/sw.js, injecting the hashed build files
 * to precache and a version derived from them. A new build with changed assets
 * gets a new version, so the old cache is cleared on activate.
 */
function appShellServiceWorker(): Plugin {
  return {
    name: 'app-shell-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && f !== 'index.html' && f !== 'sw.js')
        .map((f) => `/${f}`)
        .sort()
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12)
      const template = readFileSync(fileURLToPath(new URL('./service-worker/sw.js', import.meta.url)), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace("'__SW_VERSION__'", JSON.stringify(version))
          .replace("'__PRECACHE_MANIFEST__'", JSON.stringify(files)),
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = process.env
  const backendUrl = env.VITE_API_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss(), appShellServiceWorker()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          timeout: 1800000,
        },
        '/health': {
          target: backendUrl,
          changeOrigin: true,
          timeout: 1800000,
        },
      },
    },
  }
})
