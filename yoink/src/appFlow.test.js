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

  assert.equal(getInitialScreen(), APP_SCREENS.market);
  assert.deepEqual(getProductOpenTriggers(), ['listing', 'Buy', 'Bid', 'Offer']);

  const detailState = openProductDetail(listing, 'Offer');

  assert.equal(detailState.screen, APP_SCREENS.productDetail);
  assert.equal(detailState.productDetailVariant, '11a');
  assert.equal(detailState.selectedListing, listing);
  assert.equal(detailState.trigger, 'Offer');
  assert.deepEqual(returnToMarket(), { screen: APP_SCREENS.market, selectedListing: null });
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

test('bottom nav switches between the four tab screens and ignores stack screens', () => {
  assert.deepEqual(TAB_SCREENS, ['market', 'quests', 'pocket', 'orders']);

  const fromMarket = openTab({ screen: APP_SCREENS.market, selectedListing: { id: 'f1' } }, APP_SCREENS.quests);
  assert.deepEqual(fromMarket, { screen: APP_SCREENS.quests, selectedListing: null });

  const unchanged = openTab({ screen: APP_SCREENS.market }, APP_SCREENS.checkout);
  assert.deepEqual(unchanged, { screen: APP_SCREENS.market });
});

test('placing an order lands on the orders tab with the new order celebrated', () => {
  assert.deepEqual(openOrders('YK-1001'), {
    screen: APP_SCREENS.orders,
    selectedListing: null,
    celebrateOrderId: 'YK-1001',
  });
  assert.equal(openOrders().celebrateOrderId, null);
});
