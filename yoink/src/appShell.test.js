import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('market copy app shell does not import or route to exchange', () => {
  assert.doesNotMatch(appSource, /screens\/Exchange/);
  assert.doesNotMatch(appSource, /openExchange/);
  assert.doesNotMatch(appSource, /closeExchange/);
  assert.doesNotMatch(appSource, /APP_SCREENS\.exchange/);
  assert.doesNotMatch(appSource, /onExchange=/);
  assert.doesNotMatch(appSource, /onBellTap=/);
});

test('market copy app shell resets the phone scroll position on screen changes', () => {
  assert.match(appSource, /scrollToScreenTop/);
  assert.match(appSource, /screenRootRef/);
  assert.match(appSource, /\[flow\.screen\]/);
});

test('market copy app shell routes active collection surface to Pocket', () => {
  assert.match(appSource, /screens\/Pocket/);
  assert.match(appSource, /flow\.screen === APP_SCREENS\.pocket/);
  const pocketRouteMatch = appSource.match(/flow\.screen === APP_SCREENS\.pocket \? \([\s\S]*?\) : flow\.screen === APP_SCREENS\.orders/);
  assert.ok(pocketRouteMatch);
  const pocketRouteSource = pocketRouteMatch[0];

  assert.match(pocketRouteSource, /<Pocket[\s\S]*balance=\{wallet\.balance\}[\s\S]*cartCount=\{cartCount\}[\s\S]*onOpenCart=\{handleOpenCart\}[\s\S]*onOpenMarket=\{\(\) => handleSelectTab\(APP_SCREENS\.home\)\}[\s\S]*onToast=\{showToast\}/);
  assert.doesNotMatch(pocketRouteSource, /streak=\{wallet\.streak\}/);
  assert.doesNotMatch(pocketRouteSource, /onAddToCart=\{addToCart\}/);
  assert.doesNotMatch(pocketRouteSource, /watchedListings=\{watchedListings\}/);
  assert.doesNotMatch(pocketRouteSource, /onToggleWatchedListing=\{handleToggleWatchedListing\}/);
  assert.doesNotMatch(appSource, /screens\/Watching/);
  assert.doesNotMatch(appSource, /APP_SCREENS\.watching/);
});
