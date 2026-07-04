export const APP_SCREENS = {
  market: 'market',
  quests: 'quests',
  pocket: 'pocket',
  orders: 'orders',
  productDetail: 'product-detail',
  checkout: 'checkout',
};

// Screens reachable from the bottom nav; everything else is a stack screen
// pushed on top of the current tab.
export const TAB_SCREENS = [
  APP_SCREENS.market,
  APP_SCREENS.quests,
  APP_SCREENS.pocket,
  APP_SCREENS.orders,
];

export function openTab(currentFlow, tab) {
  if (!TAB_SCREENS.includes(tab)) return currentFlow;
  return { screen: tab, selectedListing: null };
}

export function openOrders(celebrateOrderId = null) {
  return { screen: APP_SCREENS.orders, selectedListing: null, celebrateOrderId };
}

const PRODUCT_OPEN_TRIGGERS = ['listing', 'Buy', 'Bid', 'Offer'];

export function getInitialScreen() {
  return APP_SCREENS.market;
}

export function getProductOpenTriggers() {
  return PRODUCT_OPEN_TRIGGERS;
}

export function openProductDetail(selectedListing, trigger = 'listing') {
  return {
    screen: APP_SCREENS.productDetail,
    selectedListing,
    trigger,
    productDetailVariant: '11a',
  };
}

export function returnToMarket() {
  return {
    screen: APP_SCREENS.market,
    selectedListing: null,
  };
}

export function openCheckout(currentFlow) {
  return {
    ...currentFlow,
    screen: APP_SCREENS.checkout,
    checkoutReturnScreen: currentFlow.screen,
  };
}

export function returnFromCheckout(currentFlow) {
  return {
    ...currentFlow,
    screen: currentFlow.checkoutReturnScreen ?? APP_SCREENS.market,
    checkoutReturnScreen: null,
  };
}
