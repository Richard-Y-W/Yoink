export const HAPTIC_EVENTS = Object.freeze({
  tap: 'tap',
  tab: 'tab',
  cart: 'cart',
  watch: 'watch',
  unwatch: 'unwatch',
  success: 'success',
  error: 'error',
  searchSubmit: 'search-submit',
  loaderPageLoad: 'loader-page-load',
  orders: 'orders',
  deliveryUpdate: 'delivery-update',
  reward: 'reward',
});

export function emitHaptic(name) {
  if (!name) return false;

  const bridge = typeof window !== 'undefined' ? window.ReactNativeWebView : null;
  if (!bridge || typeof bridge.postMessage !== 'function') return false;

  try {
    bridge.postMessage(JSON.stringify({
      source: 'yoink',
      type: 'haptic',
      name,
    }));
    return true;
  } catch {
    return false;
  }
}
