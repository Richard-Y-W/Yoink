import assert from 'node:assert/strict';
import test from 'node:test';
import { filterMarketFeed, makeMarketFeed, MARKET_MODES, MARKET_SORTS, sortMarketFeed } from './data.js';

const feed = makeMarketFeed(0, 32);
const price = (item) => Number(String(item.price).replace(/,/g, ''));

test('category chips narrow the feed to matching listings', () => {
  const retro = filterMarketFeed(feed, { category: 'Retro tech' });
  assert.ok(retro.length > 0);
  assert.ok(retro.every((item) => /polaroid|imac|walkman|console|phone|tamagotchi|crt|pager|cassette/i.test(item.name)));

  const ending = filterMarketFeed(feed, { category: 'Ending soon' });
  assert.ok(ending.length > 0);
  assert.ok(ending.every((item) => item.isAuction));

  assert.equal(filterMarketFeed(feed, { category: 'For you' }).length, feed.length);
});

test('the All chip cycles through real listing modes', () => {
  assert.deepEqual(MARKET_MODES, ['All', 'Auctions', 'Buy now', 'Offers']);
  assert.ok(filterMarketFeed(feed, { mode: 'Auctions' }).every((item) => item.isAuction));
  assert.ok(filterMarketFeed(feed, { mode: 'Buy now' }).every((item) => item.isBin));
  assert.ok(filterMarketFeed(feed, { mode: 'Offers' }).every((item) => item.isOffer));
});

test('filters compose: category + mode + query', () => {
  const filtered = filterMarketFeed(feed, { category: 'Deals', mode: 'Buy now', query: 'duck' });
  assert.ok(filtered.every((item) => item.shipFree && item.isBin && /duck/i.test(item.name)));
});

test('sort options reorder without mutating the input', () => {
  assert.equal(MARKET_SORTS[0].id, 'best');
  const low = sortMarketFeed(feed, 'price-low');
  const high = sortMarketFeed(feed, 'price-high');

  assert.notEqual(low, feed, 'returns a copy');
  assert.equal(sortMarketFeed(feed, 'best'), feed, 'best match keeps feed order');
  for (let i = 1; i < low.length; i += 1) assert.ok(price(low[i - 1]) <= price(low[i]));
  assert.ok(price(high[0]) >= price(high[high.length - 1]));

  const bids = sortMarketFeed(feed, 'bids');
  for (let i = 1; i < bids.length; i += 1) assert.ok(Number(bids[i - 1].bids) >= Number(bids[i].bids));
});
