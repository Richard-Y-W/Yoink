import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navSource = readFileSync(new URL('./YoinkNav.jsx', import.meta.url), 'utf8');

test('market copy nav exposes four tabs without a center exchange button', () => {
  for (const label of ['Home', 'Search', 'Watching', 'Account']) {
    assert.match(navSource, new RegExp(`label: '${label}'`));
  }

  assert.doesNotMatch(navSource, /Open the Bell/);
  assert.doesNotMatch(navSource, /onExchange/);
  assert.doesNotMatch(navSource, /notifications_active/);
  assert.doesNotMatch(navSource, /Bell/);
});

test('market copy nav gives the active tab a strong purple cartoon treatment', () => {
  assert.match(navSource, /activeTabBackground/);
  assert.match(navSource, /border-radius:18px/);
  assert.match(navSource, /transform:\$\{active \? 'translateY\(-3px\) scale\(1\.04\)'/);
  assert.match(navSource, /box-shadow:\$\{active \? '0 8px 16px rgba\(106,90,205,\.28\)'/);
  assert.match(navSource, /font-variation-settings:'FILL' 1/);
});
