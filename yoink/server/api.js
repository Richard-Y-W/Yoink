// Connect-style middleware exposing the Yoink hub (auth + per-user game
// stores) as a JSON API. Mounted into Vite's dev server (vite.config.js)
// and reused by the standalone production server (server/index.js).
//
// Sessions ride an httpOnly cookie for the web app; a native app can send
// the same token as `Authorization: Bearer <token>` instead.

import { BELL_MINUTES, SESSION_MS, liveSessionAt } from './bell.js';

const SESSION_COOKIE = 'yoink_session';
const SESSION_MAX_AGE = 365 * 24 * 3600; // seconds

function demoBellTime(realNow = Date.now()) {
  if (liveSessionAt(realNow)) return realNow;
  const date = new Date(realNow);
  date.setHours(0, 0, 0, 0);
  const dayStart = date.getTime();
  const nowMinute = Math.floor((realNow - dayStart) / 60000);
  const minute = BELL_MINUTES.find((candidate) => candidate > nowMinute) ?? BELL_MINUTES[0];
  const dayOffset = minute > nowMinute ? 0 : 24 * 60 * 60000;
  return dayStart + dayOffset + minute * 60000 + 2 * 60000;
}

// Tiny fixed-window rate limiter, keyed per IP + bucket. Enough to blunt
// password guessing and guest-account spam without any dependencies.
function makeLimiter() {
  const hits = new Map();
  return (key, max, windowMs, now = Date.now()) => {
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 10000) {
        for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
      }
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}

export function createApiMiddleware(hub, { dev = false } = {}) {
  let nowOffset = null;
  const now = () => Date.now() + (nowOffset ?? 0);
  const limit = makeLimiter();

  const json = (res, status, body) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };

  const readBody = (req) => new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(null);
      }
    });
  });

  const clientIp = (req) => String(req.headers['x-forwarded-for'] ?? '')
    .split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

  const tokenFrom = (req) => {
    const bearer = String(req.headers.authorization ?? '');
    if (bearer.startsWith('Bearer ')) return bearer.slice(7).trim();
    const cookies = String(req.headers.cookie ?? '');
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    return match ? match[1] : null;
  };

  const setSessionCookie = (req, res, token) => {
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    const value = token
      ? `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_MAX_AGE}`
      : `${SESSION_COOKIE}=; Max-Age=0`;
    res.setHeader('Set-Cookie', `${value}; Path=/; HttpOnly; SameSite=Lax${secure}`);
  };

  return async function apiMiddleware(req, res, next) {
    const url = new URL(req.url, 'http://yoink.local');
    const path = url.pathname;
    if (!path.startsWith('/api/')) return next ? next() : json(res, 404, { error: 'Not found' });

    try {
      const token = tokenFrom(req);
      const user = hub.auth.userForToken(token, Date.now());

      // ── auth ────────────────────────────────────────────────────────
      if (req.method === 'POST' && path === '/api/auth/guest') {
        // Reuse a live session instead of minting endless guest rows.
        if (user) return json(res, 200, { ok: true, user, token });
        if (!limit(`guest:${clientIp(req)}`, 20, 3600_000)) {
          return json(res, 429, { ok: false, error: 'Too many new accounts — try again later' });
        }
        const created = hub.auth.createGuest(Date.now());
        hub.storeFor(created.user.id); // materialize starting state
        setSessionCookie(req, res, created.token);
        return json(res, 200, created);
      }
      if (req.method === 'POST' && path === '/api/auth/login') {
        if (!limit(`login:${clientIp(req)}`, 10, 600_000)) {
          return json(res, 429, { ok: false, error: 'Too many attempts — try again in a few minutes' });
        }
        const body = await readBody(req);
        if (!body) return json(res, 400, { ok: false, error: 'Invalid JSON body' });
        const result = hub.auth.login(body.username, body.password, Date.now());
        if (result.ok) setSessionCookie(req, res, result.token);
        return json(res, result.ok ? 200 : 401, result);
      }
      if (req.method === 'POST' && path === '/api/auth/claim') {
        if (!user) return json(res, 401, { ok: false, error: 'No session' });
        const body = await readBody(req);
        if (!body) return json(res, 400, { ok: false, error: 'Invalid JSON body' });
        const result = hub.auth.claim(user.id, body.username, body.password);
        return json(res, result.ok ? 200 : 422, result);
      }
      if (req.method === 'POST' && path === '/api/auth/logout') {
        if (token) hub.auth.logout(token);
        setSessionCookie(req, res, null);
        return json(res, 200, { ok: true });
      }
      if (req.method === 'GET' && path === '/api/auth/me') {
        return user ? json(res, 200, { ok: true, user }) : json(res, 401, { ok: false, error: 'No session' });
      }

      // ── everything below is per-user game state ─────────────────────
      if (!user) return json(res, 401, { ok: false, error: 'No session' });
      const store = hub.storeFor(user.id);

      if (dev && req.method === 'POST' && path === '/api/dev/bell/force-live') {
        const realNow = Date.now();
        const forcedNow = demoBellTime(realNow);
        nowOffset = forcedNow - realNow;
        const liveNow = now();
        const reset = store.resetBellSessionSales(liveNow);
        const seeded = url.searchParams.get('seed') === '0'
          ? { ok: true, seeded: [] }
          : store.seedBellInventory(liveNow, 2);
        return json(res, 200, {
          ok: true,
          now: liveNow,
          forcedUntil: liveNow + SESSION_MS - 1,
          bell: store.getBell(liveNow),
          reset,
          seeded,
        });
      }
      if (dev && req.method === 'POST' && path === '/api/dev/bell/clear-force') {
        nowOffset = null;
        return json(res, 200, { ok: true, now: Date.now() });
      }
      if (dev && req.method === 'POST' && path === '/api/dev/bell/seed-inventory') {
        const result = store.seedBellInventory(now(), 2);
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'GET' && path === '/api/wallet') {
        return json(res, 200, store.getWallet(now()));
      }
      if (req.method === 'POST' && path === '/api/wallet/claim') {
        const result = store.claimAllowance(now());
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'POST' && path === '/api/spin') {
        const result = store.spin(now());
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'GET' && path === '/api/feed') {
        return json(res, 200, store.getFeed(url.searchParams.get('start'), url.searchParams.get('count')));
      }
      if (req.method === 'GET' && path === '/api/quests') {
        return json(res, 200, { quests: store.getQuests(now()) });
      }
      const questMatch = path.match(/^\/api\/quests\/([\w-]+)\/claim$/);
      if (req.method === 'POST' && questMatch) {
        const result = store.claimQuest(questMatch[1], now());
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'GET' && path === '/api/drops') {
        return json(res, 200, { drops: store.getDrops() });
      }
      const notifyMatch = path.match(/^\/api\/drops\/(\d+)\/notify$/);
      if (req.method === 'POST' && notifyMatch) {
        const result = store.toggleDropNotify(notifyMatch[1]);
        return json(res, result.ok ? 200 : 404, result);
      }
      if (req.method === 'GET' && path === '/api/orders') {
        return json(res, 200, { orders: store.getOrders(now()) });
      }
      const orderMatch = path.match(/^\/api\/orders\/([\w-]+)$/);
      if (req.method === 'GET' && orderMatch) {
        const order = store.getOrder(orderMatch[1], now());
        return order ? json(res, 200, { order }) : json(res, 404, { error: 'Order not found' });
      }
      if (req.method === 'POST' && path === '/api/orders') {
        const body = await readBody(req);
        if (!body) return json(res, 400, { error: 'Invalid JSON body' });
        const result = store.placeOrder(body, now());
        return json(res, result.ok ? 200 : 422, result);
      }
      if (req.method === 'GET' && path === '/api/collection') {
        return json(res, 200, { collection: store.getCollection(now()) });
      }
      if (req.method === 'GET' && path === '/api/exchange') {
        return json(res, 200, store.getExchange(now()));
      }
      if (req.method === 'GET' && path === '/api/exchange/candles') {
        const result = store.getCandles(
          url.searchParams.get('tickerId'),
          url.searchParams.get('tf') ?? '5m',
          url.searchParams.get('count') ?? 48,
          now(),
        );
        return result ? json(res, 200, result) : json(res, 404, { error: 'Unknown ticker or timeframe' });
      }
      if (req.method === 'POST' && path === '/api/exchange/trade') {
        const body = await readBody(req);
        if (!body) return json(res, 400, { error: 'Invalid JSON body' });
        const result = store.tradeExchange(body, now());
        return json(res, result.ok ? 200 : 422, result);
      }
      if (req.method === 'GET' && path === '/api/bell') {
        const at = Number(url.searchParams.get('at'));
        return json(res, 200, store.getBell(Number.isFinite(at) && at > 0 ? at : now()));
      }
      if (req.method === 'POST' && path === '/api/bell/checkin') {
        const result = store.bellCheckin(now());
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'POST' && path === '/api/bell/sell') {
        const body = await readBody(req);
        if (!body) return json(res, 400, { error: 'Invalid JSON body' });
        const result = store.floorSell(body, now());
        return json(res, result.ok ? 200 : 422, result);
      }
      if (req.method === 'POST' && path === '/api/bell/buy') {
        const body = await readBody(req);
        if (!body) return json(res, 400, { error: 'Invalid JSON body' });
        const result = store.floorBuy(body, now());
        return json(res, result.ok ? 200 : 422, result);
      }
      return json(res, 404, { error: 'Not found' });
    } catch (error) {
      return json(res, 500, { error: String(error?.message ?? error) });
    }
  };
}
