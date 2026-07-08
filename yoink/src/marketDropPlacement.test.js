import assert from 'node:assert/strict';
import test from 'node:test';
import { findRareDropInsertIndex } from './marketDropPlacement.js';

test('rare flash inserts after the first listing visible in the viewport', () => {
  const items = Array.from({ length: 7 }, (_, index) => ({ id: `item-${index}` }));
  const rects = new Map([
    ['item-0', { top: -420, bottom: -318 }],
    ['item-1', { top: -304, bottom: -202 }],
    ['item-2', { top: -188, bottom: -86 }],
    ['item-3', { top: -72, bottom: 30 }],
    ['item-4', { top: 114, bottom: 216 }],
    ['item-5', { top: 226, bottom: 328 }],
    ['item-6', { top: 338, bottom: 440 }],
  ]);

  const insertIndex = findRareDropInsertIndex(
    items,
    (item) => rects.get(item.id),
    { viewportHeight: 520, topGuard: 96, fallbackIndex: 3 },
  );

  assert.equal(insertIndex, 5);
});

test('rare flash falls back near the top when no visible listing can be measured', () => {
  const items = Array.from({ length: 7 }, (_, index) => ({ id: `item-${index}` }));

  assert.equal(
    findRareDropInsertIndex(items, () => null, { viewportHeight: 520, topGuard: 96, fallbackIndex: 3 }),
    3,
  );
});
