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
