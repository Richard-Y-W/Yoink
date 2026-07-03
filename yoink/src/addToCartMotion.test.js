import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const motionComponentUrl = new URL('./components/AddToCartMotion.jsx', import.meta.url);
const motionCssUrl = new URL('./components/AddToCartMotion.css', import.meta.url);
const designHtmlUrl = [
  new URL('../../claude-design/Yoink Add To Cart Animations.dc.html', import.meta.url),
  new URL('../../Claude Design Upload/Yoink Add To Cart Animations.dc.html', import.meta.url),
].find((url) => existsSync(url));
const appUrl = new URL('./App.jsx', import.meta.url);
const monoMarketUrl = new URL('./screens/MonoMarket.jsx', import.meta.url);
const productDetail = readFileSync(new URL('./screens/ProductDetail.jsx', import.meta.url), 'utf8');

test('add to cart motion is cart-only without hand frames or ding text', () => {
  assert.equal(existsSync(motionComponentUrl), true, 'missing AddToCartMotion component');
  assert.equal(existsSync(motionCssUrl), true, 'missing AddToCartMotion CSS');

  const component = readFileSync(motionComponentUrl, 'utf8');
  const css = readFileSync(motionCssUrl, 'utf8');

  assert.doesNotMatch(component, /yoink-glove-hand-[a-z-]+\.png/);
  assert.doesNotMatch(component, /Ding!/);
  assert.doesNotMatch(css, /yoinkCartHybridHand|hand-frame|yoink-glove-hand/);
  assert.match(component, /cartCount/);
});

test('add to cart motion keeps the item toss and makes the cart disappear', () => {
  const component = readFileSync(motionComponentUrl, 'utf8');
  const css = readFileSync(motionCssUrl, 'utf8');

  assert.match(component, /yoink-cart-motion__item-bubble/);
  assert.match(component, /yoink-cart-motion__cart/);
  assert.match(component, /yoink-cart-motion__cart-badge/);
  assert.match(css, /yoinkCartOnlyItem/);
  assert.match(css, /yoinkCartOnlyCart/);
  assert.match(css, /yoinkCartOnlyBadge/);
  assert.match(css, /100%[\s\S]*opacity: 0;[\s\S]*translate3d\(148px, -18px, 0\)/);
});

test(
  'claude design add-to-cart study mirrors the cart-only motion',
  { skip: designHtmlUrl ? false : 'Claude Design files are packaged separately from this React source copy' },
  () => {
  const html = readFileSync(designHtmlUrl, 'utf8');

  assert.doesNotMatch(html, /yoink-glove-hand-[a-z-]+\.png/);
  assert.doesNotMatch(html, /Ding!/);
  assert.match(html, /yoinkCartOnlyItem/);
  assert.match(html, /yoinkCartOnlyCart/);
  assert.match(html, /headerCount/);
  assert.match(html, /motionCount/);
  },
);

test('product detail triggers cart-only motion and count increment from add-to-cart CTAs', () => {
  assert.match(productDetail, /import AddToCartMotion/);
  assert.match(productDetail, /cartCount = 0/);
  assert.match(productDetail, /onAddToCart = \(\) => \{\}/);
  assert.match(productDetail, /onOpenCart = \(\) => \{\}/);
  assert.match(productDetail, /const \[cartMotionKey, setCartMotionKey\]/);
  assert.match(productDetail, /const playCartMotion = \(\) =>/);
  assert.match(productDetail, /onAddToCart\(qty\)/);
  assert.match(productDetail, /<AddToCartMotion playKey=\{cartMotionKey\} cartCount=\{cartCount\}/);
  assert.match(productDetail, /const handlePrimary = primaryAddsToCart \? playCartMotion : bidOrOffer/);
  assert.match(productDetail, /const handleSecondary = secondaryAddsToCart \? playCartMotion : buyNow/);
  assert.match(productDetail, /onClick=\{handlePrimary\}/);
  assert.match(productDetail, /onClick=\{handleSecondary\}/);
});

test('app owns cart items and market header displays the total quantity', () => {
  const app = readFileSync(appUrl, 'utf8');
  const monoMarket = readFileSync(monoMarketUrl, 'utf8');

  assert.match(app, /const \[cartItems, setCartItems\] = useState\(\[\]\)/);
  assert.match(app, /const cartCount = getCartQuantity\(cartItems\)/);
  assert.match(app, /addListingToCart\(current, listing, quantity\)/);
  assert.match(app, /<ProductDetail[\s\S]*cartCount=\{cartCount\}[\s\S]*onAddToCart=\{\(quantity\) => addToCart\(flow\.selectedListing, quantity\)\}/);
  assert.match(app, /<MonoMarket[\s\S]*onOpenCart=\{handleOpenCart\}[\s\S]*cartCount=\{cartCount\}/);
  assert.match(monoMarket, /export default function MonoMarket\(\{ onOpenProduct = \(\) => \{\}, onOpenCart = \(\) => \{\}, cartCount = 0, balance = 0 \}\)/);
  assert.match(monoMarket, /\{cartCount\}/);
});
