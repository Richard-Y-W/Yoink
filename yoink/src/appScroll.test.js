import assert from 'node:assert/strict';
import test from 'node:test';
import { scrollToScreenTop } from './appScroll.js';

function node({ parent = null, className = '', overflowY = 'visible', scrollTop = 0 } = {}) {
  return {
    parentElement: parent,
    classList: { contains: (name) => className.split(' ').includes(name) },
    scrollTop,
    _overflowY: overflowY,
  };
}

test('scrollToScreenTop resets the nearest phone scroll container', () => {
  const scrollParent = node({ className: 'ynoscroll', overflowY: 'auto', scrollTop: 640 });
  const child = node({ parent: scrollParent });

  assert.equal(scrollToScreenTop(child), true);
  assert.equal(scrollParent.scrollTop, 0);
});

test('scrollToScreenTop falls back to overflow auto ancestors', () => {
  const scrollParent = node({ overflowY: 'scroll', scrollTop: 320 });
  const middle = node({ parent: scrollParent });
  const child = node({ parent: middle });

  assert.equal(scrollToScreenTop(child), true);
  assert.equal(scrollParent.scrollTop, 0);
});

test('scrollToScreenTop reports false when no scroll container exists', () => {
  const root = node();
  const child = node({ parent: root });

  assert.equal(scrollToScreenTop(child), false);
});
