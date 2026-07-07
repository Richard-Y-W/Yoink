import assert from 'node:assert/strict';
import test from 'node:test';
import { filterMarketFeed, makeMarketFeed, MARKET_MODES, MARKET_SORTS, sortMarketFeed } from './data.js';

const feed = makeMarketFeed(0, 32);
const price = (item) => Number(String(item.price).replace(/,/g, ''));

test('category chips narrow the feed to matching listings', () => {
  const pocketTech = filterMarketFeed(feed, { category: 'Pocket Tech' });
  assert.equal(pocketTech.length, 4);
  assert.ok(pocketTech.every((item) => item.family === 'Pocket Tech'));

  const rareDrops = filterMarketFeed(feed, { category: 'Rare Drops' });
  assert.ok(rareDrops.length > 0);
  assert.ok(rareDrops.every((item) => ['Rare', 'Ultra Rare', 'One-Off'].includes(item.rarity)));

  assert.equal(filterMarketFeed(feed, { category: 'For you' }).length, feed.length);
});

test('the All chip cycles through real listing modes', () => {
  assert.deepEqual(MARKET_MODES, ['All', 'Buy now']);
  assert.ok(filterMarketFeed(feed, { mode: 'Buy now' }).every((item) => item.isBin));
});

test('filters compose: category + mode + query', () => {
  const filtered = filterMarketFeed(feed, { category: 'Pocket Tech', mode: 'Buy now', query: 'pixel' });
  assert.deepEqual(filtered.map((item) => item.name), ['Pocket Pixel MP3']);
});

test('sort options reorder without mutating the input', () => {
  assert.equal(MARKET_SORTS[0].id, 'best');
  const low = sortMarketFeed(feed, 'price-low');
  const high = sortMarketFeed(feed, 'price-high');

  assert.notEqual(low, feed, 'returns a copy');
  assert.equal(sortMarketFeed(feed, 'best'), feed, 'best match keeps feed order');
  for (let i = 1; i < low.length; i += 1) assert.ok(price(low[i - 1]) <= price(low[i]));
  assert.ok(price(high[0]) >= price(high[high.length - 1]));

  const rare = sortMarketFeed(feed, 'rarity');
  assert.ok(['One-Off', 'Ultra Rare'].includes(rare[0].rarity));
});
