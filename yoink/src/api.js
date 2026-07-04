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

export const fetchWallet = () => request('/api/wallet');
export const claimAllowance = () => post('/api/wallet/claim');
export const spinWheel = () => post('/api/spin');
export const fetchFeed = (start, count) => request(`/api/feed?start=${start}&count=${count}`);
export const fetchQuests = () => request('/api/quests');
export const claimQuest = (questId) => post(`/api/quests/${questId}/claim`);
export const placeOrder = (payload) => post('/api/orders', payload);
export const fetchOrders = () => request('/api/orders');
export const fetchCollection = () => request('/api/collection');
