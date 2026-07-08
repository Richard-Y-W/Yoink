import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { openDb } from './db.js';
import { createHub } from './hub.js';
import { createApiMiddleware } from './api.js';

async function startApi() {
  const hub = createHub({ db: openDb(':memory:'), random: () => 0.5 });
  const api = createApiMiddleware(hub);
  const server = createServer((req, res) => api(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((resolve) => server.close(resolve)) };
}

test('guest flow: 401 without session, cookie session works end to end', async () => {
  const { base, close } = await startApi();
  try {
    const denied = await fetch(`${base}/api/wallet`);
    assert.equal(denied.status, 401, 'game routes need a session');

    const guestRes = await fetch(`${base}/api/auth/guest`, { method: 'POST' });
    const guest = await guestRes.json();
    assert.equal(guest.ok, true);
    assert.equal(guest.user.guest, true);
    const cookie = guestRes.headers.get('set-cookie');
    assert.match(cookie, /yoink_session=/);
    assert.match(cookie, /HttpOnly/);

    const sessionCookie = cookie.split(';')[0];
    const wallet = await (await fetch(`${base}/api/wallet`, { headers: { cookie: sessionCookie } })).json();
    assert.equal(typeof wallet.balance, 'number');

    // Bearer token works too (future iOS app path).
    const viaBearer = await fetch(`${base}/api/wallet`, { headers: { authorization: `Bearer ${guest.token}` } });
    assert.equal(viaBearer.status, 200);
  } finally {
    await close();
  }
});

test('two guests do not share wallets; claim + login round-trips', async () => {
  const { base, close } = await startApi();
  try {
    const guestOf = async () => {
      const res = await fetch(`${base}/api/auth/guest`, { method: 'POST' });
      return (await res.json()).token;
    };
    const tokenA = await guestOf();
    const tokenB = await guestOf();
    const auth = (token) => ({ authorization: `Bearer ${token}` });

    const claimRes = await (await fetch(`${base}/api/wallet/claim`, { method: 'POST', headers: auth(tokenA) })).json();
    assert.equal(claimRes.ok, true);
    const walletB = await (await fetch(`${base}/api/wallet`, { headers: auth(tokenB) })).json();
    assert.equal(walletB.canClaim, true, 'B unaffected by A claiming');

    const claimAccount = await (await fetch(`${base}/api/auth/claim`, {
      method: 'POST',
      headers: { ...auth(tokenA), 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'player_one', password: 'longenough1' }),
    })).json();
    assert.equal(claimAccount.ok, true);

    const login = await (await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'player_one', password: 'longenough1' }),
    })).json();
    assert.equal(login.ok, true);
    const walletA = await (await fetch(`${base}/api/wallet`, { headers: auth(login.token) })).json();
    assert.equal(walletA.canClaim, false, 'logged-in device sees the claimed allowance');
  } finally {
    await close();
  }
});
