import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  DROP_REVEAL_WINDOWS,
  MARKET_MAX_ITEMS,
  MARKET_MODES,
  MARKET_SORTS,
  makeMarketFeed,
  makeTimedDrop,
  randomDropDelay,
} from './data.js';

const marketSource = readFileSync(new URL('./screens/MonoMarket.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const productDetailSource = readFileSync(new URL('./screens/ProductDetail.jsx', import.meta.url), 'utf8');
const watchingSource = readFileSync(new URL('./screens/Watching.jsx', import.meta.url), 'utf8');
const expoAppSource = readFileSync(new URL('../../yoink-expo/App.js', import.meta.url), 'utf8');

test('base feed stays ordinary while rare and ultra drops come from timed pools', () => {
  const feed = makeMarketFeed(0, MARKET_MAX_ITEMS);
  const rare = makeTimedDrop('rare', () => 0);
  const ultra = makeTimedDrop('ultra', () => 0);

  assert.ok(MARKET_MAX_ITEMS < 50, 'flash-only items are not part of the always-visible feed');
  assert.ok(feed.every((item) => !item.flashTier), 'ordinary browsing never preloads rare flash labels');
  assert.ok(feed.every((item) => item.rarity === 'Common' || item.rarity === 'Uncommon'));
  assert.equal(rare.flashTier, 'rare');
  assert.equal(ultra.flashTier, 'ultra');
  assert.ok(!feed.some((item) => item.id === rare.id));
  assert.ok(!feed.some((item) => item.id === ultra.id));
  assert.ok([rare, ultra, ...feed].every((item) => item.cta === 'Buy'));
  assert.ok([rare, ultra, ...feed].every((item) => !item.isAuction && !item.bids && !item.timeLeft));
});

test('timed drop windows match the browsing loop', () => {
  assert.deepEqual(DROP_REVEAL_WINDOWS.rare, { minMs: 5000, maxMs: 10000 });
  assert.deepEqual(DROP_REVEAL_WINDOWS.ultra, { minMs: 15000, maxMs: 20000 });
  assert.equal(randomDropDelay(DROP_REVEAL_WINDOWS.rare, () => 0), 5000);
  assert.equal(randomDropDelay(DROP_REVEAL_WINDOWS.rare, () => 1), 10000);
  assert.equal(randomDropDelay(DROP_REVEAL_WINDOWS.ultra, () => 0), 15000);
  assert.equal(randomDropDelay(DROP_REVEAL_WINDOWS.ultra, () => 1), 20000);
});

test('market removes bidding filters and bid sorting while keeping direct buy mode', () => {
  assert.deepEqual(MARKET_MODES, ['All', 'Buy now']);
  assert.deepEqual(MARKET_SORTS.map((sort) => sort.id), ['best', 'price-low']);
});

test('market UI renders timed flash cards and ultra burst with haptic hooks', () => {
  assert.match(marketSource, /RARE FLASH/);
  assert.match(marketSource, /findRareDropInsertIndex/);
  assert.match(marketSource, /listingNodesRef/);
  assert.match(marketSource, /getBoundingClientRect/);
  assert.match(marketSource, /setRareFlashInsertIndex\(getRareFlashInsertIndex\(\)\)/);
  assert.match(marketSource, /const visibleFeedWithDrops =/);
  assert.match(marketSource, /visibleFeedWithDrops\.map/);
  assert.match(marketSource, /key=\{item\.flashTier \? `flash-\$\{item\.id\}` : item\.id\}/);
  assert.doesNotMatch(marketSource, /const insertAt = Math\.min\(3, visibleFeed\.length\)/);
  assert.doesNotMatch(marketSource, /function RareFlashCard/);
  assert.doesNotMatch(marketSource, /\{rareFlashItem && \(/);
  assert.match(marketSource, /UltraDropBurst/);
  assert.match(marketSource, /ULTRA RARE SIGNAL/);
  assert.match(marketSource, /position:fixed;inset:0;z-index:970/);
  assert.match(marketSource, /width:100%;height:250px/);
  assert.match(marketSource, /object-fit:cover/);
  assert.doesNotMatch(marketSource, /object-fit:contain/);
  assert.doesNotMatch(marketSource, /width:7px;height:7px;border-radius:50%/);
  assert.match(marketSource, /DROP_REVEAL_WINDOWS/);
  assert.match(marketSource, /makeTimedDrop/);
  assert.match(marketSource, /onWheelCapture=\{startDropClock\}/);
  assert.match(marketSource, /onTouchMoveCapture=\{startDropClock\}/);
  assert.doesNotMatch(marketSource, /ART_STYLE_LABELS/);
  assert.doesNotMatch(marketSource, /onCycleArtStyle/);
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
