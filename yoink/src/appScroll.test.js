import assert from 'node:assert/strict';
import test from 'node:test';
import { scrollToScreenTop } from './appScroll.js';

function node({ parent = null, className = '', overflowY = 'visible', scrollTop = 0, children = [] } = {}) {
  const current = {
    parentElement: parent,
    classList: { contains: (name) => className.split(' ').includes(name) },
    scrollTop,
    _overflowY: overflowY,
    children,
    querySelector(selector) {
      if (selector !== '.ynoscroll') return null;
      return children.find((child) => child.classList?.contains?.('ynoscroll')) ?? null;
    },
  };
  children.forEach((child) => {
    child.parentElement = current;
  });
  return current;
}

test('scrollToScreenTop resets a scroll viewport inside the app shell', () => {
  const scrollChild = node({ className: 'ynoscroll', overflowY: 'auto', scrollTop: 720 });
  const shell = node({ children: [scrollChild] });

  assert.equal(scrollToScreenTop(shell), true);
  assert.equal(scrollChild.scrollTop, 0);
});

function legacyNode({ parent = null, className = '', overflowY = 'visible', scrollTop = 0 } = {}) {
  return {
    parentElement: parent,
    classList: { contains: (name) => className.split(' ').includes(name) },
    scrollTop,
    _overflowY: overflowY,
  };
}

test('scrollToScreenTop resets the nearest phone scroll container', () => {
  const scrollParent = legacyNode({ className: 'ynoscroll', overflowY: 'auto', scrollTop: 640 });
  const child = legacyNode({ parent: scrollParent });

  assert.equal(scrollToScreenTop(child), true);
  assert.equal(scrollParent.scrollTop, 0);
});

test('scrollToScreenTop falls back to overflow auto ancestors', () => {
  const scrollParent = legacyNode({ overflowY: 'scroll', scrollTop: 320 });
  const middle = legacyNode({ parent: scrollParent });
  const child = legacyNode({ parent: middle });

  assert.equal(scrollToScreenTop(child), true);
  assert.equal(scrollParent.scrollTop, 0);
});

test('scrollToScreenTop reports false when no scroll container exists', () => {
  const root = legacyNode();
  const child = legacyNode({ parent: root });

  assert.equal(scrollToScreenTop(child), false);
});
