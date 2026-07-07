import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const accountSource = readFileSync(new URL('./screens/Account.jsx', import.meta.url), 'utf8');
const pocketSource = readFileSync(new URL('./screens/Pocket.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('account and pocket header cart buttons use the cart icon', () => {
  assert.match(accountSource, /shopping_cart/);
  assert.match(pocketSource, /shopping_cart/);
  assert.doesNotMatch(accountSource, /shopping_bag/);
  assert.doesNotMatch(pocketSource, /shopping_bag/);
});

test('account screen is a shopping-app dashboard with cartoon market actions', () => {
  for (const copy of ['Yoink ID', 'Order pulse', 'Quick actions', 'Wallet snap', 'Cart ready', 'Open Orders']) {
    assert.match(accountSource, new RegExp(copy));
  }

  for (const action of ['Orders', 'Pocket', 'Wallet', 'Support', 'Settings']) {
    assert.match(accountSource, new RegExp(`label: '${action}'`));
  }

  assert.match(accountSource, /onToast = \(\) => \{\}/);
  assert.match(accountSource, /onOpenPocket = \(\) => \{\}/);
  assert.doesNotMatch(accountSource, /onOpenWatching/);
  assert.match(accountSource, /onOpenOrders = \(\) => \{\}/);
  assert.match(accountSource, /action\.onPress/);
  assert.match(accountSource, /stageMarkers/);
  assert.match(accountSource, /#B8F5D0/);
  assert.match(accountSource, /#FFB84D/);
});

test('app gives account quick actions real handlers', () => {
  assert.match(appSource, /onToast=\{showToast\}/);
  assert.match(appSource, /onOpenPocket=\{\(\) => handleSelectTab\(APP_SCREENS\.pocket\)\}/);
  assert.doesNotMatch(appSource, /onOpenWatching=/);
  assert.match(appSource, /onOpenOrders=\{\(\) => handleSelectTab\(APP_SCREENS\.orders\)\}/);
});
