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
