import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QTY_CAP,
  canTrade,
  clampQty,
  confirmLabel,
  flashDirection,
  maxTradable,
  positionGain,
} from './exchangeView.js';

test('flashDirection reports tick direction', () => {
  assert.equal(flashDirection(100, 101), 'up');
  assert.equal(flashDirection(101, 100), 'down');
  assert.equal(flashDirection(100, 100), null);
  assert.equal(flashDirection(undefined, 100), null);
});

test('maxTradable for sells is exactly the shares held', () => {
  assert.equal(maxTradable('sell', { shares: 7 }), 7);
  assert.equal(maxTradable('sell', { shares: 0 }), 0);
  assert.equal(maxTradable('sell', { shares: 500 }), QTY_CAP);
});

test('maxTradable for buys is what the wallet affords', () => {
  assert.equal(maxTradable('buy', { balance: 1000, price: 300 }), 3);
  assert.equal(maxTradable('buy', { balance: 100, price: 300 }), 0);
  assert.equal(maxTradable('buy', { balance: 1e9, price: 1 }), QTY_CAP);
});

test('clampQty keeps quantities sane', () => {
  assert.equal(clampQty(0), 1);
  assert.equal(clampQty(-5), 1);
  assert.equal(clampQty(3.9), 3);
  assert.equal(clampQty(1000), QTY_CAP);
  assert.equal(clampQty('abc'), 1);
});

test('selling is allowed whenever you hold enough shares — buys-cap never blocks it', () => {
  const result = canTrade('sell', 3, { shares: 3, buysLeftToday: 0 });
  assert.equal(result.ok, true);
});

test('selling with no holdings explains itself', () => {
  const result = canTrade('sell', 1, { shares: 0 });
  assert.equal(result.ok, false);
  assert.match(result.reason, /don’t hold any/);
});

test('selling more than held explains itself', () => {
  const result = canTrade('sell', 5, { shares: 2 });
  assert.equal(result.ok, false);
  assert.match(result.reason, /only hold 2/);
});

test('buying past the wallet explains the shortfall', () => {
  const result = canTrade('buy', 2, { balance: 100, price: 300, buysLeftToday: 5 });
  assert.equal(result.ok, false);
  assert.match(result.reason, /Ȳ500 more/);
});

test('buying when tapped out explains that sells stay open', () => {
  const result = canTrade('buy', 1, { balance: 1e6, price: 1, buysLeftToday: 0 });
  assert.equal(result.ok, false);
  assert.match(result.reason, /sells still open/i);
});

test('a normal buy is allowed', () => {
  assert.equal(canTrade('buy', 2, { balance: 1000, price: 300, buysLeftToday: 5 }).ok, true);
});

test('confirmLabel formats the order button', () => {
  assert.equal(confirmLabel('buy', 5, 'DUCK', 1700), 'Buy 5 $DUCK · Ȳ1,700');
  assert.equal(confirmLabel('sell', 1, 'TAMA', 1018), 'Sell 1 $TAMA · Ȳ1,018');
});

test('positionGain is live unrealized P/L', () => {
  assert.equal(positionGain(3, 100, 120), 60);
  assert.equal(positionGain(3, 120, 100), -60);
  assert.equal(positionGain(0, 100, 120), 0);
});
