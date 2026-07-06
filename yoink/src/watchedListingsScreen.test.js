import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const watchedSource = readFileSync(new URL('./watchedListings.js', import.meta.url), 'utf8');
const marketSource = readFileSync(new URL('./screens/MonoMarket.jsx', import.meta.url), 'utf8');
const watchingSource = readFileSync(new URL('./screens/Watching.jsx', import.meta.url), 'utf8');
const productDetailSource = readFileSync(new URL('./screens/ProductDetail.jsx', import.meta.url), 'utf8');

test('app owns watched listings and wires them into market and watching screens', () => {
  assert.match(appSource, /toggleWatchedListing/);
  assert.match(appSource, /const \[watchedListings, setWatchedListings\]/);
  assert.match(watchedSource, /WATCHED_LISTINGS_STORAGE_KEY = 'yoink-watched-listings'/);
  assert.match(appSource, /localStorage\.getItem\(WATCHED_LISTINGS_STORAGE_KEY\)/);
  assert.match(appSource, /localStorage\.setItem\(WATCHED_LISTINGS_STORAGE_KEY/);
  assert.match(appSource, /watchedListings=\{watchedListings\}/);
  assert.match(appSource, /onToggleWatchedListing=\{handleToggleWatchedListing\}/);
  assert.match(appSource, /isWatched=\{watchedIds\.includes\(flow\.selectedListing\?\.id\)\}/);
});

test('market listing hearts are controlled by app-level watched state', () => {
  assert.match(marketSource, /watchedIds = \[\]/);
  assert.match(marketSource, /onToggleWatchedListing = \(\) => \{\}/);
  assert.match(marketSource, /watchedIds\.includes\(item\.id\)/);
  assert.match(marketSource, /onToggleWatchedListing\(item\)/);
  assert.doesNotMatch(marketSource, /const \[savedIds, setSavedIds\]/);
});

test('product detail heart shares the watched-list state', () => {
  assert.match(productDetailSource, /isWatched = false/);
  assert.match(productDetailSource, /onToggleWatchedListing = \(\) => \{\}/);
  assert.match(productDetailSource, /onToggleWatchedListing\(listing\)/);
  assert.match(productDetailSource, /filled=\{isWatched\}/);
  assert.doesNotMatch(productDetailSource, /const \[favorite, setFavorite\]/);
});

test('watching screen renders saved cards and keeps a cartoon empty state', () => {
  assert.match(watchingSource, /watchedListings = \[\]/);
  assert.match(watchingSource, /watchedListings\.length === 0/);
  assert.match(watchingSource, /watchedListings\.map/);
  assert.match(watchingSource, /onOpenProduct\(item, 'listing'\)/);
  assert.match(watchingSource, /onToggleWatchedListing\(item\)/);
  assert.match(watchingSource, /Nothing watched yet/);
});
