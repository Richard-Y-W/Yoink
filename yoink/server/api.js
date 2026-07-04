// Connect-style middleware exposing the Yoink store as a JSON API.
// Mounted into Vite's dev server (see vite.config.js) and reused by the
// standalone production server (server/index.js). No dependencies.

import { BELL_MINUTES, SESSION_MS, liveSessionAt } from './bell.js';

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

export function createApiMiddleware(store, { dev = false } = {}) {
  let nowOffset = null;
  const now = () => Date.now() + (nowOffset ?? 0);

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

  return async function apiMiddleware(req, res, next) {
    const url = new URL(req.url, 'http://yoink.local');
    const path = url.pathname;
    if (!path.startsWith('/api/')) return next ? next() : json(res, 404, { error: 'Not found' });

    try {
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
      return json(res, 404, { error: 'Not found' });
    } catch (error) {
      return json(res, 500, { error: String(error?.message ?? error) });
    }
  };
}
