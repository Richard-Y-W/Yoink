export function emitNativeNotification({ title, body, seconds = 1 } = {}) {
  if (!title && !body) return false;

  const bridge = typeof window !== 'undefined' ? window.ReactNativeWebView : null;
  if (!bridge || typeof bridge.postMessage !== 'function') return false;

  try {
    bridge.postMessage(JSON.stringify({
      source: 'yoink',
      type: 'notification',
      title,
      body,
      seconds,
    }));
    return true;
  } catch {
    return false;
  }
}
