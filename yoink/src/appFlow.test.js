import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APP_SCREENS,
  TAB_SCREENS,
  getInitialScreen,
  getProductOpenTriggers,
  openCheckout,
  openOrders,
  openProductDetail,
  openTab,
  returnFromCheckout,
  returnToMarket,
} from './appFlow.js';

test('app flow starts on mono market and opens 11a product detail from every listing trigger', () => {
  const listing = { id: 'f12', cta: 'Buy', name: 'Cassette Walkman + 12 tapes' };

  assert.equal(getInitialScreen(), APP_SCREENS.home);
  assert.deepEqual(getProductOpenTriggers(), ['listing', 'Buy', 'ultra-drop']);

  const detailState = openProductDetail(listing, 'ultra-drop');

  assert.equal(detailState.screen, APP_SCREENS.productDetail);
  assert.equal(detailState.productDetailVariant, '11a');
  assert.equal(detailState.selectedListing, listing);
  assert.equal(detailState.trigger, 'ultra-drop');
  assert.deepEqual(returnToMarket(), { screen: APP_SCREENS.home, selectedListing: null });
});

test('app flow opens checkout from the current screen and returns to the previous screen', () => {
  const listing = { id: 'f0', cta: 'Buy', name: 'Vintage Polaroid SX-70 - tested' };
  const detailState = openProductDetail(listing, 'Buy');
  const checkoutState = openCheckout(detailState);

  assert.equal(APP_SCREENS.checkout, 'checkout');
  assert.equal(checkoutState.screen, APP_SCREENS.checkout);
  assert.equal(checkoutState.selectedListing, listing);
  assert.equal(checkoutState.checkoutReturnScreen, APP_SCREENS.productDetail);

  assert.deepEqual(returnFromCheckout(checkoutState), {
    screen: APP_SCREENS.productDetail,
    selectedListing: listing,
    trigger: 'Buy',
    productDetailVariant: '11a',
    checkoutReturnScreen: null,
  });
});

test('market copy bottom nav switches between the five market tabs and rejects exchange', () => {
  assert.deepEqual(TAB_SCREENS, ['home', 'search', 'orders', 'pocket', 'account']);

  const fromHome = openTab({ screen: APP_SCREENS.home, selectedListing: { id: 'f1' } }, APP_SCREENS.search);
  assert.deepEqual(fromHome, { screen: APP_SCREENS.search, selectedListing: null });

  const fromSearch = openTab({ screen: APP_SCREENS.search }, APP_SCREENS.orders);
  assert.deepEqual(fromSearch, { screen: APP_SCREENS.orders, selectedListing: null });

  const fromOrders = openTab({ screen: APP_SCREENS.orders }, APP_SCREENS.pocket);
  assert.deepEqual(fromOrders, { screen: APP_SCREENS.pocket, selectedListing: null });

  const unchangedCheckout = openTab({ screen: APP_SCREENS.home }, APP_SCREENS.checkout);
  assert.deepEqual(unchangedCheckout, { screen: APP_SCREENS.home });

  assert.equal(APP_SCREENS.watching, undefined);
  assert.equal(APP_SCREENS.exchange, undefined);
  const unchangedExchange = openTab({ screen: APP_SCREENS.home }, 'exchange');
  assert.deepEqual(unchangedExchange, { screen: APP_SCREENS.home });
});

test('placing an order lands on the orders tab with the new order celebrated', () => {
  assert.deepEqual(openOrders('YK-1001'), {
    screen: APP_SCREENS.orders,
    selectedListing: null,
    celebrateOrderId: 'YK-1001',
  });
  assert.equal(openOrders().celebrateOrderId, null);
});
