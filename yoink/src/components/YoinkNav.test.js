import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navSource = readFileSync(new URL('./YoinkNav.jsx', import.meta.url), 'utf8');

test('market copy nav exposes five level tabs with orders as a normal tab', () => {
  for (const label of ['Home', 'Search', 'Orders', 'Pocket', 'Account']) {
    assert.match(navSource, new RegExp(`label: '${label}'`));
  }

  assert.match(navSource, /id: APP_SCREENS\.orders/);
  assert.doesNotMatch(navSource, /Watching/);
  assert.match(navSource, /id: APP_SCREENS\.pocket/);
  assert.match(navSource, /inventory_2/);
  assert.doesNotMatch(navSource, /center: true/);
  assert.doesNotMatch(navSource, /translateY\(-9px\)/);
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
