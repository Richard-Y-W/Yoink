import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { MARKET_MAX_ITEMS, appendMarketFeed, makeMarketFeed, marketCats } from './data.js';

test('market feed generates the Yoink drop catalog listing shape', () => {
  const feed = makeMarketFeed(0, 8);

  assert.equal(feed.length, 8);
  assert.ok(MARKET_MAX_ITEMS < 50, 'timed flash drops are excluded from the ordinary feed');
  assert.deepEqual(marketCats, ['Pocket Tech', 'Holo Finds', 'Desk Pets', 'Snack Relics', 'Rare Drops']);
  assert.equal(feed[0].id, 'drop-pocket-tech-pocket-pixel-mp3');
  assert.equal(feed[0].name, 'Pocket Pixel MP3');
  assert.equal(feed[0].family, 'Pocket Tech');
  assert.equal(feed[0].rarity, 'Common');
  assert.equal(feed[0].cta, 'Buy');
  assert.equal(feed[1].cta, 'Buy');
  assert.equal(feed[2].cta, 'Buy');
  assert.equal(feed[4].family, 'Snack Relics');
  assert.equal(feed[0].topRated, false);
  assert.ok(feed.every((item) => !item.flashTier));
  assert.match(feed[0].imageUrl, /^\/yoink-items\/pocket-tech-pocket-pixel-mp3\.png$/);
  assert.match(feed[0].stripe, /^repeating-linear-gradient/);
});

test('market feed continues deterministically from an offset', () => {
  const first = makeMarketFeed(0, 2);
  const next = makeMarketFeed(2, 2);

  assert.equal(first[1].id, 'drop-pocket-tech-jelly-flip-phone');
  assert.equal(next[0].id, 'drop-desk-pets-mochi-blob');
  assert.notEqual(first[0].name, next[0].name);
});

test('market feed appends in pages and caps at the design limit', () => {
  const current = makeMarketFeed(0, MARKET_MAX_ITEMS - 2);
  const next = appendMarketFeed(current);

  assert.equal(next.length, MARKET_MAX_ITEMS);
  assert.equal(appendMarketFeed(next), next);
});

test('every Yoink drop listing points at a checked-in render asset', () => {
  const feed = makeMarketFeed(0, MARKET_MAX_ITEMS);
  assert.equal(new Set(feed.map((item) => item.imageUrl)).size, MARKET_MAX_ITEMS);

  for (const item of feed) {
    const renderFile = new URL(`../public${item.imageUrl}`, import.meta.url);
    assert.equal(existsSync(renderFile), true, `${item.name} render exists`);
  }
});

test('market feed includes the full generated Yoink art-pack expansion', () => {
  const feed = makeMarketFeed(0, MARKET_MAX_ITEMS);
  const ids = new Set(feed.map((item) => item.id));

  assert.ok(feed.length >= 16);
  assert.equal(ids.has('drop-holo-finds-prism-star-foil-card'), false);
  assert.equal(ids.has('drop-desk-pets-cloud-pillow-pal'), true);
  assert.equal(ids.has('drop-snack-relics-bubble-gum-token'), true);
});
