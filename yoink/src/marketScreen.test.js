import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const marketSource = readFileSync(new URL('./screens/MonoMarket.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('market loader uses IntersectionObserver with a window scroll fallback', () => {
  assert.match(marketSource, /IntersectionObserver/);
  assert.match(marketSource, /root:\s*null/);
  assert.match(marketSource, /window\.addEventListener\('scroll'/);
  assert.match(marketSource, /window\.innerHeight/);
});

test('search tab opens a focused search market and emits submit haptics', () => {
  assert.match(marketSource, /searchMode = false/);
  assert.match(marketSource, /searchInputRef/);
  assert.match(marketSource, /autoFocus=\{searchMode\}/);
  assert.match(marketSource, /onSearchSubmit\(\)/);
  assert.match(marketSource, /font:600 16px 'Nunito'/);
  assert.match(appSource, /searchMode=\{flow\.screen === APP_SCREENS\.search\}/);
  assert.match(appSource, /emitHaptic\(HAPTIC_EVENTS\.searchSubmit\);/);
});

test('filtered search results stop showing the active search loader once finds are visible', () => {
  assert.match(marketSource, /loadingMore/);
  assert.match(marketSource, /searchStatusText/);
  assert.match(marketSource, /visibleFeed\.length > 0/);
  assert.match(marketSource, /Searching the market/);
  assert.doesNotMatch(marketSource, /\{hasMore \? \(filtersActive \? 'Searching the market\.\.\.'/);
});

test('market currency chip opens rewards instead of being static display text', () => {
  assert.match(marketSource, /onOpenWallet = \(\) => \{\}/);
  assert.match(marketSource, /aria-label="Open Yoink rewards"/);
  assert.match(appSource, /onOpenWallet=\{handleOpenWallet\}/);
});

test('market header uses the native safe area without duplicate top padding', () => {
  assert.doesNotMatch(marketSource, /padding:47px 13px 11px/);
  assert.match(marketSource, /padding:18px 13px 11px/);
});
