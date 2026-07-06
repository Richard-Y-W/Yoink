import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const accountSource = readFileSync(new URL('./screens/Account.jsx', import.meta.url), 'utf8');
const watchingSource = readFileSync(new URL('./screens/Watching.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('account and watching header cart buttons use the cart icon', () => {
  assert.match(accountSource, /shopping_cart/);
  assert.match(watchingSource, /shopping_cart/);
  assert.doesNotMatch(accountSource, /shopping_bag/);
  assert.doesNotMatch(watchingSource, /shopping_bag/);
});

test('account screen is a shopping-app dashboard with cartoon market actions', () => {
  for (const copy of ['Yoink ID', 'Order pulse', 'Quick actions', 'Wallet snap', 'Cart ready']) {
    assert.match(accountSource, new RegExp(copy));
  }

  for (const action of ['Orders', 'Watching', 'Wallet', 'Support', 'Settings']) {
    assert.match(accountSource, new RegExp(`label: '${action}'`));
  }

  assert.match(accountSource, /onToast = \(\) => \{\}/);
  assert.match(accountSource, /onOpenWatching = \(\) => \{\}/);
  assert.match(accountSource, /action\.onPress/);
  assert.match(accountSource, /#B8F5D0/);
  assert.match(accountSource, /#FFB84D/);
});

test('app gives account quick actions real handlers', () => {
  assert.match(appSource, /onToast=\{showToast\}/);
  assert.match(appSource, /onOpenWatching=\{\(\) => handleSelectTab\(APP_SCREENS\.watching\)\}/);
});
