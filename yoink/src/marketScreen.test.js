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
  assert.match(appSource, /searchMode=\{flow\.screen === APP_SCREENS\.search\}/);
  assert.match(appSource, /emitHaptic\(HAPTIC_EVENTS\.searchSubmit\);/);
});

test('market header uses the native safe area without duplicate top padding', () => {
  assert.doesNotMatch(marketSource, /padding:47px 13px 11px/);
  assert.match(marketSource, /padding:18px 13px 11px/);
});
