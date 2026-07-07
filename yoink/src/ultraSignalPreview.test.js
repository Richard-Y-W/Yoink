import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ULTRA_SIGNAL_VARIANTS } from './ultraSignalVariants.js';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const previewSource = readFileSync(new URL('./components/UltraSignalPreview.jsx', import.meta.url), 'utf8');

test('ultra signal preview exposes the three style directions', () => {
  assert.deepEqual(ULTRA_SIGNAL_VARIANTS.map((variant) => variant.id), [
    'feed-freeze',
    'sticker-sheet',
    'prize-ticket',
  ]);
  assert.deepEqual(ULTRA_SIGNAL_VARIANTS.map((variant) => variant.label), [
    'Feed-Freeze Spotlight',
    'Sticker Sheet Alert',
    'Yoink Prize Ticket',
  ]);
});

test('app can render the ultra signal comparison from a query param', () => {
  assert.match(appSource, /ultraSignalPreview/);
  assert.match(appSource, /<UltraSignalPreview/);
  assert.match(previewSource, /Cosmic Sticker Slab/);
  assert.match(previewSource, /ULTRA_SIGNAL_VARIANTS\.map/);
  assert.match(previewSource, /feed-freeze/);
  assert.match(previewSource, /sticker-sheet/);
  assert.match(previewSource, /prize-ticket/);
  assert.doesNotMatch(previewSource, /stockLabel/);
  assert.doesNotMatch(previewSource, />LIVE</);
});
