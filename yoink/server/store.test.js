import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALLOWANCE_MAX,
  ALLOWANCE_MIN,
  ORDER_STAGES,
  SPIN_SEGMENTS,
  STREAK_BONUS,
  createStore,
  orderStage,
} from './store.js';

const DAY = 24 * 60 * 60 * 1000;

const makeItems = (price = 100, quantity = 1) => [{
  id: 'drop-holo-finds-frog-foil-card',
  title: 'Frog Foil Card',
  imageLabel: 'frog foil card',
  imageUrl: '/yoink-items/holo-finds-frog-foil-card.png',
  imageStripe: 'repeating-linear-gradient(135deg,#F0EEF8 0 11px,#E6E3F2 11px 22px)',
  seller: 'yoink_drops',
  unitPrice: price,
  quantity,
}];

test('daily allowance claims once per day and pays within range', () => {
  const store = createStore({ random: () => 0.5 });
  const now = Date.UTC(2026, 6, 2, 18);
  const before = store.getWallet(now).balance;

  const claim = store.claimAllowance(now);
  assert.equal(claim.ok, true);
  assert.ok(claim.amount >= ALLOWANCE_MIN && claim.amount <= ALLOWANCE_MAX);
  assert.equal(claim.bonus, STREAK_BONUS, 'streak 6 → 7 hits the weekly bonus');
  assert.equal(store.getWallet(now).balance, before + claim.amount + claim.bonus);
  assert.equal(store.getWallet(now).canClaim, false);

  const again = store.claimAllowance(now);
  assert.equal(again.ok, false);

  const tomorrow = store.claimAllowance(now + DAY);
  assert.equal(tomorrow.ok, true);
  assert.equal(tomorrow.bonus, 0);
});

test('daily spin pays the landed segment and locks until tomorrow', () => {
  const store = createStore({ random: () => 0.4 });
  const now = Date.UTC(2026, 6, 2, 18);
  const before = store.getWallet(now).balance;

  const spin = store.spin(now);
  assert.equal(spin.ok, true);
  assert.equal(spin.reward, SPIN_SEGMENTS[spin.segment]);
  assert.equal(store.getWallet(now).balance, before + spin.reward);
  assert.equal(store.spin(now).ok, false);
  assert.equal(store.spin(now + DAY).ok, true);
});

test('placing an order deducts coins and rejects overspending with shortBy', () => {
  const store = createStore({ random: () => 0 });
  const now = Date.UTC(2026, 6, 2, 18);
  const balance = store.getWallet(now).balance;

  const broke = store.placeOrder({ items: makeItems(balance + 100), shippingPrice: 3 }, now);
  assert.equal(broke.ok, false);
  assert.equal(broke.shortBy, 103);

  const order = store.placeOrder({ items: makeItems(120, 2), shippingPrice: 7 }, now);
  assert.equal(order.ok, true);
  assert.equal(order.order.total, 247);
  assert.match(order.order.id, /^YK-\d+$/);
  assert.equal(order.order.stage, 'processing');
  assert.equal(store.getWallet(now).balance, balance - 247);

  assert.equal(store.placeOrder({ items: [] }, now).ok, false, 'empty cart rejected');
});

test('orders preserve generated render image URLs', () => {
  const store = createStore({ random: () => 0 });
  const now = Date.UTC(2026, 6, 2, 18);

  const order = store.placeOrder({ items: makeItems(120, 1), shippingPrice: 3 }, now);

  assert.equal(order.ok, true);
  assert.equal(order.order.items[0].imageUrl, '/yoink-items/holo-finds-frog-foil-card.png');
});

test('orders advance through accelerated tracking stages', () => {
  const placedAt = Date.UTC(2026, 6, 2, 18);
  assert.equal(orderStage(placedAt, placedAt).id, 'processing');
  assert.equal(orderStage(placedAt, placedAt + 31_000).id, 'packed');
  assert.equal(orderStage(placedAt, placedAt + 91_000).id, 'shipped');
  assert.equal(orderStage(placedAt, placedAt + 151_000).id, 'out-for-delivery');
  assert.equal(orderStage(placedAt, placedAt + 241_000).id, 'delivered');
  assert.equal(ORDER_STAGES.length, 5);
});

test('delivered orders land in the collection exactly once', () => {
  const store = createStore({ random: () => 0 });
  const now = Date.UTC(2026, 6, 2, 18);
  store.placeOrder({ items: makeItems(120, 2) }, now);

  assert.equal(store.getCollection(now + 60_000).length, 0, 'not delivered yet');

  const later = now + 300_000;
  const collection = store.getCollection(later);
  assert.equal(collection.length, 1);
  assert.equal(collection[0].quantity, 2);

  store.getOrders(later + 60_000);
  assert.equal(store.getCollection(later + 60_000)[0].quantity, 2, 'no duplicate on re-read');

  const order = store.getOrders(later)[0];
  assert.equal(order.stage, 'delivered');
  assert.equal(order.stageIndex, 4);
});

test('feed pages come from the shared generator and clamp to the max', () => {
  const store = createStore();
  const page = store.getFeed(8, 8);
  assert.equal(page.items.length, 8);
  assert.equal(page.items[0].id, 'drop-desk-pets-sleepy-star-charm');
  assert.equal(page.items.some((item) => item.flashTier === 'ultra'), true);
  assert.equal(store.getFeed(page.total, 8).items.length, 0);
});

test('finished quests pay out once per period and unfinished ones refuse', () => {
  const store = createStore();
  const now = Date.UTC(2026, 6, 2, 18);
  const before = store.getWallet(now).balance;

  const finished = store.getQuests(now).find((quest) => quest.claimable);
  const unfinished = store.getQuests(now).find((quest) => quest.have < quest.goal);

  const claim = store.claimQuest(finished.id, now);
  assert.equal(claim.ok, true);
  assert.equal(claim.reward, finished.reward);
  assert.equal(store.getWallet(now).balance, before + finished.reward);
  assert.equal(store.getQuests(now).find((quest) => quest.id === finished.id).claimed, true);

  assert.equal(store.claimQuest(finished.id, now).ok, false, 'no double claim');
  assert.equal(store.claimQuest(unfinished.id, now).ok, false, 'unfinished refuses');
  assert.equal(store.claimQuest('nope', now).ok, false, 'unknown quest refuses');

  const nextPeriod = now + 8 * DAY;
  assert.equal(store.getQuests(nextPeriod).find((quest) => quest.id === finished.id).claimed, false, 'resets next period');
});

test('drop notify toggles per drop and rejects unknown drops', () => {
  const store = createStore();
  assert.equal(store.toggleDropNotify(1).notifying, true);
  assert.equal(store.getDrops().find((drop) => drop.id === 1).notifying, true);
  assert.equal(store.toggleDropNotify(1).notifying, false);
  assert.equal(store.toggleDropNotify(999).ok, false);
});
