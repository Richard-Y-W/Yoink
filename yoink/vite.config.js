import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { openDb } from './server/db.js';
import { createHub } from './server/hub.js';
import { createApiMiddleware } from './server/api.js';

// Serve the Yoink JSON API from the dev server itself — same origin, no
// second process. Production uses server/index.js with the same modules.
function yoinkApi() {
  return {
    name: 'yoink-api',
    configureServer(server) {
      const db = openDb(fileURLToPath(new URL('./server/data/dev.db', import.meta.url)));
      const hub = createHub({ db });
      server.middlewares.use(createApiMiddleware(hub, { dev: true }));
    },
  };
}

export default defineConfig({
  plugins: [react(), yoinkApi()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
