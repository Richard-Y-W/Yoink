import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('app imports the haptic bridge and event names', () => {
  assert.match(appSource, /import \{ HAPTIC_EVENTS, emitHaptic \} from '\.\/hapticFeedback\.js';/);
});

test('app emits haptics for high-value shopping interactions', () => {
  assert.match(appSource, /emitHaptic\(HAPTIC_EVENTS\.success\);/);
  assert.match(appSource, /emitHaptic\(HAPTIC_EVENTS\.cart\);/);
  assert.match(appSource, /emitHaptic\(HAPTIC_EVENTS\.tab\);/);
  assert.match(appSource, /emitHaptic\(HAPTIC_EVENTS\.orders\);/);
  assert.match(appSource, /HAPTIC_EVENTS\.watch/);
  assert.match(appSource, /HAPTIC_EVENTS\.unwatch/);
});

test('watching haptic is based on whether the item is already saved', () => {
  assert.match(appSource, /watchedIds\.includes\(listing\?\.id\)/);
  assert.match(appSource, /alreadyWatched \? HAPTIC_EVENTS\.unwatch : HAPTIC_EVENTS\.watch/);
});
