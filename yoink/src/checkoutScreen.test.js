import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const checkoutUrl = new URL('./screens/Checkout.jsx', import.meta.url);
const appUrl = new URL('./App.jsx', import.meta.url);
const marketUrl = new URL('./screens/MonoMarket.jsx', import.meta.url);
const detailUrl = new URL('./screens/ProductDetail.jsx', import.meta.url);

test('checkout screen renders option A review-and-pay structure from the design', () => {
  assert.equal(existsSync(checkoutUrl), true, 'missing Checkout screen');
  const checkout = readFileSync(checkoutUrl, 'utf8');

  assert.match(checkout, /export default function Checkout/);
  assert.match(checkout, /Review & Pay|Checkout/);
  assert.match(checkout, /Ship to/);
  assert.match(checkout, /Delivery/);
  assert.match(checkout, /Plan/);
  assert.match(checkout, /Payment/);
  assert.match(checkout, /Add discount/);
  assert.match(checkout, /Yoink it now/);
  assert.match(checkout, /cartItems/);
  assert.match(checkout, /quantity/);
  assert.match(checkout, /subtotal/);
  assert.match(checkout, /shipping/);
  assert.match(checkout, /total/);
});

test('checkout screen mirrors the recording with interactive accordion options', () => {
  assert.equal(existsSync(checkoutUrl), true, 'missing Checkout screen');
  const checkout = readFileSync(checkoutUrl, 'utf8');

  assert.match(checkout, /useState/);
  assert.match(checkout, /expandedRow/);
  assert.match(checkout, /setExpandedRow/);
  assert.match(checkout, /selectedAddress/);
  assert.match(checkout, /selectedShipping/);
  assert.match(checkout, /selectedPlan/);
  assert.match(checkout, /selectedPayment/);
  assert.match(checkout, /Home address - fastest checkout/);
  assert.match(checkout, /Campus pickup locker/);
  assert.match(checkout, /Yoink Standard - Y 3/);
  assert.match(checkout, /Yoink Rush - Y 7/);
  assert.match(checkout, /Hold for 15 minutes/);
  assert.match(checkout, /Apple Pay/);
  assert.match(checkout, /Yoink Wallet/);
  assert.match(checkout, /Visa ending 4242/);
  assert.match(checkout, /attentionBadgeBackground/);
  assert.match(checkout, /aria-pressed/);
});

test('app wires cart state to checkout, market cart button, and product detail cart button', () => {
  const app = readFileSync(appUrl, 'utf8');
  const market = readFileSync(marketUrl, 'utf8');
  const detail = readFileSync(detailUrl, 'utf8');

  assert.match(app, /import Checkout/);
  assert.match(app, /addListingToCart/);
  assert.match(app, /getCartQuantity/);
  assert.match(app, /const \[cartItems, setCartItems\] = useState\(\[\]\)/);
  assert.match(app, /openCheckout\(current\)/);
  assert.match(app, /returnFromCheckout\(current\)/);
  assert.match(app, /<Checkout[\s\S]*cartItems=\{cartItems\}/);
  assert.match(market, /onOpenCart = \(\) => \{\}/);
  assert.match(market, /onClick=\{onOpenCart\}/);
  assert.match(detail, /onOpenCart = \(\) => \{\}/);
  assert.match(detail, /onOpenCart/);
});
