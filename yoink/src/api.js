// Thin client for the Yoink JSON API. Every helper returns parsed JSON;
// non-2xx responses still resolve (the body carries ok:false + error) so
// screens can show friendly failures without try/catch towers.

async function request(path, options) {
  const res = await fetch(path, options);
  return res.json();
}

const post = (path, body) => request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

export const fetchMe = () => request('/api/auth/me');
export const startGuestSession = () => post('/api/auth/guest');
export const claimAccount = (username, password) => post('/api/auth/claim', { username, password });
export const loginAccount = (username, password) => post('/api/auth/login', { username, password });
export const logoutAccount = () => post('/api/auth/logout');

// Resolve the current user, silently creating a guest account on first
// launch — nobody hits a signup wall.
export async function ensureSession() {
  const me = await fetchMe();
  if (me.ok) return me.user;
  const guest = await startGuestSession();
  return guest.ok ? guest.user : null;
}

export const fetchWallet = () => request('/api/wallet');
export const claimAllowance = () => post('/api/wallet/claim');
export const spinWheel = () => post('/api/spin');
export const fetchFeed = (start, count) => request(`/api/feed?start=${start}&count=${count}`);
export const fetchQuests = () => request('/api/quests');
export const claimQuest = (questId) => post(`/api/quests/${questId}/claim`);
export const placeOrder = (payload) => post('/api/orders', payload);
export const fetchOrders = () => request('/api/orders');
export const fetchCollection = () => request('/api/collection');
export const fetchExchange = () => request('/api/exchange');
export const fetchCandles = (tickerId, tf, count) => request(`/api/exchange/candles?tickerId=${tickerId}&tf=${tf}&count=${count}`);
export const tradeTicker = (tickerId, side, shares) => post('/api/exchange/trade', { tickerId, side, shares });
export const fetchBell = () => request('/api/bell');
export const bellCheckin = () => post('/api/bell/checkin');
export const sellOnFloor = (itemId, quantity) => post('/api/bell/sell', { itemId, quantity });
export const buyOnFloor = (tickerId, quantity) => post('/api/bell/buy', { tickerId, quantity });
export const devForceBellLive = () => post('/api/dev/bell/force-live');
export const devClearForcedBell = () => post('/api/dev/bell/clear-force');
