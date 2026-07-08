import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ordersSource = readFileSync(new URL('./screens/Orders.jsx', import.meta.url), 'utf8');

test('orders refresh the accelerated delivery timer every second', () => {
  assert.match(ordersSource, /window\.setInterval\(load, 1000\)/);
  assert.doesNotMatch(ordersSource, /window\.setInterval\(load, 3000\)/);
});

test('orders keep the Yoink coin currency in tracking cards', () => {
  assert.match(ordersSource, /formatMoney\(order\.total\)/);
  assert.match(ordersSource, /Yoink express time/);
});
