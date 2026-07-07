import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

const cartUrl = new URL('./cart.js', import.meta.url);

const polaroid = {
  id: 'drop-pocket-tech-bubble-crt',
  name: 'Bubble CRT',
  img: 'bubble crt',
  price: '120',
  seller: 'yoink_drops',
  fb: '97.0%',
  stripe: 'linear-gradient(#fff,#eee)',
  imageUrl: '/yoink-items/pocket-tech-bubble-crt.png',
};

const charizard = {
  id: 'drop-holo-finds-frog-foil-card',
  name: 'Frog Foil Card',
  img: 'frog foil card',
  price: '18,415',
  seller: 'yoink_drops',
  fb: '98.1%',
  stripe: 'linear-gradient(#fee,#eef)',
  imageUrl: '/yoink-items/holo-finds-frog-foil-card.png',
};

test('cart helpers add listings once and increment repeated listings', async () => {
  assert.equal(existsSync(cartUrl), true, 'missing cart helpers');
  const { addListingToCart, getCartQuantity } = await import(cartUrl);

  const oneItem = addListingToCart([], polaroid);
  const repeated = addListingToCart(oneItem, polaroid);
  const twoItems = addListingToCart(repeated, charizard);

  assert.equal(oneItem.length, 1);
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0].quantity, 2);
  assert.equal(twoItems.length, 2);
  assert.equal(getCartQuantity(twoItems), 3);
});

test('cart items preserve generated render image URLs', async () => {
  assert.equal(existsSync(cartUrl), true, 'missing cart helpers');
  const { makeCartItem } = await import(cartUrl);

  const item = makeCartItem(polaroid);

  assert.equal(item.imageUrl, '/yoink-items/pocket-tech-bubble-crt.png');
});

test('cart helpers compute subtotal, shipping, total, and display labels', async () => {
  assert.equal(existsSync(cartUrl), true, 'missing cart helpers');
  const { addListingToCart, formatMoney, getCartShipping, getCartSubtotal, getCartTotal } = await import(cartUrl);

  const cart = addListingToCart(addListingToCart(addListingToCart([], polaroid), polaroid), charizard);

  assert.equal(getCartSubtotal(cart), 18655);
  assert.equal(getCartShipping(cart), 3);
  assert.equal(getCartTotal(cart), 18658);
  assert.equal(formatMoney(getCartTotal(cart)), '$18,658.00');
});

test('checkout totals can use the selected shipping option from checkout', async () => {
  assert.equal(existsSync(cartUrl), true, 'missing cart helpers');
  const { addListingToCart, getCheckoutTotals } = await import(cartUrl);

  const cart = addListingToCart([], polaroid);
  const standardTotals = getCheckoutTotals(cart, { shippingPrice: 3 });
  const rushTotals = getCheckoutTotals(cart, { shippingPrice: 6.5 });

  assert.deepEqual(standardTotals, {
    subtotal: 120,
    shipping: 3,
    discount: 0,
    total: 123,
  });
  assert.deepEqual(rushTotals, {
    subtotal: 120,
    shipping: 6.5,
    discount: 0,
    total: 126.5,
  });
});

test('promo codes discount the subtotal and ignore junk codes', async () => {
  const { addListingToCart, getCheckoutTotals, getPromoRate } = await import(cartUrl);

  const cart = addListingToCart([], polaroid);
  const promoTotals = getCheckoutTotals(cart, { shippingPrice: 3, promoCode: 'yoink10' });

  assert.deepEqual(promoTotals, {
    subtotal: 120,
    shipping: 3,
    discount: 12,
    total: 111,
  });
  assert.equal(getPromoRate('NOTACODE'), 0);
  assert.equal(getCheckoutTotals(cart, { promoCode: 'NOTACODE' }).discount, 0);
});
