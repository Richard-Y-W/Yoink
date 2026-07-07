import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const marketSource = readFileSync(new URL('./screens/MonoMarket.jsx', import.meta.url), 'utf8');
const productDetailSource = readFileSync(new URL('./screens/ProductDetail.jsx', import.meta.url), 'utf8');
const watchingSource = readFileSync(new URL('./screens/Watching.jsx', import.meta.url), 'utf8');
const checkoutSource = readFileSync(new URL('./screens/Checkout.jsx', import.meta.url), 'utf8');
const ordersSource = readFileSync(new URL('./screens/Orders.jsx', import.meta.url), 'utf8');

test('shop surfaces prefer generated item render images over old placeholder art', () => {
  assert.match(marketSource, /item\.imageUrl/);
  assert.match(productDetailSource, /detail\.imageUrl/);
  assert.match(watchingSource, /item\.imageUrl/);
  assert.match(checkoutSource, /imageUrl/);
  assert.match(ordersSource, /imageUrl/);
});
