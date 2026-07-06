import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { createStore } from './server/store.js';
import { createApiMiddleware } from './server/api.js';

// Serve the Yoink JSON API from the dev server itself — same origin, no
// second process. Production uses server/index.js with the same modules.
function yoinkApi() {
  return {
    name: 'yoink-api',
    configureServer(server) {
      const file = fileURLToPath(new URL('./server/db.json', import.meta.url));
      const store = createStore({ file });
      server.middlewares.use(createApiMiddleware(store, { dev: true }));
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
