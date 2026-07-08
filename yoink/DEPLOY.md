# Deploying Yoink to Railway

The whole app is one Node process: `server/index.js` serves the built
frontend from `dist/` and the JSON API, with all state in a single SQLite
file. Auth is guest-first — visitors silently get an account; they can
claim it (username + password) from the Pocket tab.

## One-time setup

1. **Create the project** — at [railway.com](https://railway.com), *New
   Project → Deploy from GitHub repo*, pick this repo. Set the service's
   **root directory** to `yoink/` (Settings → Source). `railway.json`
   already tells it how to build (`npm ci && npm run build`) and start
   (`npm run serve`).

2. **Add a volume** — right-click the service → *Attach Volume*, mount
   path `/data`. This is where the database lives; without it, every
   deploy wipes all players.

3. **Set environment variables** (service → Variables):

   | Variable   | Value            |
   |------------|------------------|
   | `YOINK_DB` | `/data/yoink.db` |

   `PORT` is injected by Railway automatically; the server reads it.

4. **Generate a domain** — service → Settings → Networking → *Generate
   Domain*. Railway terminates HTTPS for you; the session cookie is
   marked `Secure` automatically behind it.

After that, every push to `main` redeploys. Player data persists on the
volume across deploys and restarts.

## Notes

- **Scale**: keep this at exactly **1 replica**. State is cached
  in-process on top of SQLite, so multiple replicas would fork reality.
  One small instance comfortably handles thousands of casual players.
- **Backups**: Railway volumes support snapshot backups (volume →
  Backups). Turn on a daily schedule once real users show up.
- **Local production test**: `npm run build && npm run serve`, then open
  http://localhost:5175.
- **iOS later**: a wrapped or native app talks to the same API over
  HTTPS. Session tokens can be sent as `Authorization: Bearer <token>`
  instead of the cookie — already supported.
