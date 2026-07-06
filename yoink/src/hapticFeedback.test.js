import assert from 'node:assert/strict';
import test from 'node:test';

async function loadHapticModule() {
  try {
    return await import('./hapticFeedback.js');
  } catch (error) {
    assert.fail(`expected hapticFeedback.js to export the Expo bridge: ${error.message}`);
  }
}

test('emitHaptic posts the Yoink haptic contract to Expo WebView', async () => {
  const { HAPTIC_EVENTS, emitHaptic } = await loadHapticModule();
  const messages = [];
  global.window = {
    ReactNativeWebView: {
      postMessage: (message) => messages.push(message),
    },
  };

  assert.equal(emitHaptic(HAPTIC_EVENTS.cart), true);
  assert.deepEqual(JSON.parse(messages[0]), {
    source: 'yoink',
    type: 'haptic',
    name: 'cart',
  });

  delete global.window;
});

test('emitHaptic safely no-ops outside Expo Go', async () => {
  const { HAPTIC_EVENTS, emitHaptic } = await loadHapticModule();
  global.window = {};

  assert.equal(emitHaptic(HAPTIC_EVENTS.tap), false);

  delete global.window;
});
