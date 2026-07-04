import test from 'node:test';
import assert from 'node:assert/strict';
import { canFloorSell, estFloorSale, fmtClock, fmtWait } from './bellView.js';

test('fmtClock renders m:ss and clamps at zero', () => {
  assert.equal(fmtClock(14 * 60000 + 22000), '14:22');
  assert.equal(fmtClock(5000), '0:05');
  assert.equal(fmtClock(-100), '0:00');
});

test('fmtWait renders friendly waits', () => {
  assert.equal(fmtWait(30000), 'under a minute');
  assert.equal(fmtWait(14 * 60000), '14m');
  assert.equal(fmtWait(2 * 3600000 + 14 * 60000), '2h 14m');
  assert.equal(fmtWait(3 * 3600000), '3h');
});

test('canFloorSell explains every blocked state', () => {
  assert.match(canFloorSell(1, { own: 0, sellsLeft: 3 }).reason, /in the shop/);
  assert.match(canFloorSell(1, { own: 2, sellsLeft: 0 }).reason, /next bell/);
  assert.match(canFloorSell(3, { own: 2, sellsLeft: 3 }).reason, /only have 2/);
  assert.match(canFloorSell(3, { own: 5, sellsLeft: 2 }).reason, /2 floor slots/);
  assert.equal(canFloorSell(2, { own: 2, sellsLeft: 2 }).ok, true);
});

test('estFloorSale applies the street multiplier and the 5% fee', () => {
  const sale = estFloorSale(340, 36, 2);
  assert.equal(sale.unit, 462);
  assert.equal(sale.gross, 924);
  assert.equal(sale.fee, 46);
  assert.equal(sale.net, 878);
});
