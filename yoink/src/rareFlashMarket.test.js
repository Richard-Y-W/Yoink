import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { MARKET_MAX_ITEMS, MARKET_MODES, MARKET_SORTS, makeMarketFeed } from './data.js';

const marketSource = readFileSync(new URL('./screens/MonoMarket.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const productDetailSource = readFileSync(new URL('./screens/ProductDetail.jsx', import.meta.url), 'utf8');
const watchingSource = readFileSync(new URL('./screens/Watching.jsx', import.meta.url), 'utf8');
const expoAppSource = readFileSync(new URL('../../yoink-expo/App.js', import.meta.url), 'utf8');

test('rare and ultra rare items surface as direct marketplace flash purchases', () => {
  const firstPage = makeMarketFeed(0, 8);
  const secondPage = makeMarketFeed(8, 8);

  assert.equal(MARKET_MAX_ITEMS, 16);
  assert.ok(firstPage.some((item) => item.flashTier === 'rare'), 'rare flash should appear in the first loaded feed');
  assert.ok(firstPage.every((item) => item.flashTier !== 'ultra'), 'ultra drops should require more scrolling');
  assert.ok(secondPage.some((item) => item.flashTier === 'ultra'), 'ultra drops should surface later');
  assert.ok([...firstPage, ...secondPage].every((item) => item.cta === 'Buy'));
  assert.ok([...firstPage, ...secondPage].every((item) => !item.isAuction && !item.bids && !item.timeLeft));
});

test('market removes bidding filters and bid sorting while keeping direct buy mode', () => {
  assert.deepEqual(MARKET_MODES, ['All', 'Buy now']);
  assert.deepEqual(MARKET_SORTS.map((sort) => sort.id), ['best', 'price-low', 'price-high', 'rarity']);
});

test('market UI renders rare feed pop and ultra rare burst with haptic hooks', () => {
  assert.match(marketSource, /RareDropBurst/);
  assert.match(marketSource, /RARE FLASH/);
  assert.match(marketSource, /ULTRA RARE DROP/);
  assert.match(marketSource, /onRareFlash = \(\) => \{\}/);
  assert.match(marketSource, /onUltraRareFlash = \(\) => \{\}/);
  assert.match(appSource, /HAPTIC_EVENTS\.rareFlash/);
  assert.match(appSource, /HAPTIC_EVENTS\.ultraDrop/);
  assert.match(expoAppSource, /'rare-flash'/);
  assert.match(expoAppSource, /'ultra-drop'/);
});

test('small image caption labels are removed from item art surfaces', () => {
  assert.doesNotMatch(marketSource, /\{item\.img\}/);
  assert.doesNotMatch(productDetailSource, /\{detail\.imageLabel\}/);
  assert.doesNotMatch(watchingSource, /\{item\.img\}/);
});
