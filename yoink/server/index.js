// Standalone production server: serves the built app from dist/ and the
// JSON API from the same origin. `npm run build && npm run serve`.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { createHub } from './hub.js';
import { createApiMiddleware } from './api.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
// On Railway, mount a volume and set YOINK_DB=/data/yoink.db so state
// survives deploys. Defaults to a local file for `npm run serve`.
const db = openDb(process.env.YOINK_DB ?? join(root, 'server', 'data', 'yoink.db'));
const hub = createHub({ db });
const api = createApiMiddleware(hub);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  if (req.url.startsWith('/api/')) return api(req, res);

  const url = new URL(req.url, 'http://yoink.local');
  let file = normalize(join(dist, url.pathname));
  if (!file.startsWith(dist)) file = join(dist, 'index.html');
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT) || 5175;
server.listen(port, () => {
  console.log(`Yoink running at http://localhost:${port}`);
});
