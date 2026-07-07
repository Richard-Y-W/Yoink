import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { addListingToCart, decrementCartItem, getCartQuantity } from './cart.js';

const checkoutSource = readFileSync(new URL('./screens/Checkout.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

const mochi = {
  id: 'drop-desk-pets-mochi-blob',
  name: 'Mochi Blob',
  img: 'mochi blob',
  price: '120',
};

test('cart helpers can subtract a single item and remove the row at zero', () => {
  const cart = addListingToCart(addListingToCart([], mochi), mochi);
  const oneLeft = decrementCartItem(cart, mochi.id);
  const removed = decrementCartItem(oneLeft, mochi.id);

  assert.equal(getCartQuantity(cart), 2);
  assert.equal(getCartQuantity(oneLeft), 1);
  assert.deepEqual(removed, []);
});

test('checkout rows expose a subtract button wired to app cart state', () => {
  assert.match(checkoutSource, /aria-label="Subtract item from cart"/);
  assert.match(checkoutSource, /onDecreaseItem = \(\) => \{\}/);
  assert.match(checkoutSource, /onDecreaseItem\(item\.id\)/);
  assert.match(appSource, /decrementCartItem/);
  assert.match(appSource, /handleDecreaseCartItem/);
  assert.match(appSource, /onDecreaseItem=\{handleDecreaseCartItem\}/);
});

test('checkout and app guard against spam order taps draining the wallet', () => {
  assert.match(checkoutSource, /placingRef/);
  assert.match(checkoutSource, /window\.setTimeout\(\(\) => \{/);
  assert.match(appSource, /placingOrderRef/);
  assert.match(appSource, /Already yoinking this order/);
});

test('toast messages wrap inside the phone instead of pushing layout sideways', () => {
  assert.match(appSource, /overflow-wrap:anywhere/);
  assert.match(appSource, /white-space:normal/);
  assert.match(appSource, /width:calc\(100% - 32px\)/);
});
