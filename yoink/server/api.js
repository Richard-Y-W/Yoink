// Connect-style middleware exposing the Yoink store as a JSON API.
// Mounted into Vite's dev server (see vite.config.js) and reused by the
// standalone production server (server/index.js). No dependencies.

export function createApiMiddleware(store) {
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
      if (req.method === 'GET' && path === '/api/wallet') {
        return json(res, 200, store.getWallet());
      }
      if (req.method === 'POST' && path === '/api/wallet/claim') {
        const result = store.claimAllowance();
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'POST' && path === '/api/spin') {
        const result = store.spin();
        return json(res, result.ok ? 200 : 409, result);
      }
      if (req.method === 'GET' && path === '/api/feed') {
        return json(res, 200, store.getFeed(url.searchParams.get('start'), url.searchParams.get('count')));
      }
      if (req.method === 'GET' && path === '/api/quests') {
        return json(res, 200, { quests: store.getQuests() });
      }
      const questMatch = path.match(/^\/api\/quests\/([\w-]+)\/claim$/);
      if (req.method === 'POST' && questMatch) {
        const result = store.claimQuest(questMatch[1]);
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
        return json(res, 200, { orders: store.getOrders() });
      }
      const orderMatch = path.match(/^\/api\/orders\/([\w-]+)$/);
      if (req.method === 'GET' && orderMatch) {
        const order = store.getOrder(orderMatch[1]);
        return order ? json(res, 200, { order }) : json(res, 404, { error: 'Order not found' });
      }
      if (req.method === 'POST' && path === '/api/orders') {
        const body = await readBody(req);
        if (!body) return json(res, 400, { error: 'Invalid JSON body' });
        const result = store.placeOrder(body);
        return json(res, result.ok ? 200 : 422, result);
      }
      if (req.method === 'GET' && path === '/api/collection') {
        return json(res, 200, { collection: store.getCollection() });
      }
      return json(res, 404, { error: 'Not found' });
    } catch (error) {
      return json(res, 500, { error: String(error?.message ?? error) });
    }
  };
}
