# Expo Haptics Account Design

**Goal:** Make Market Copy feel like an iPhone shopping app in Expo Go while keeping the local Vite app as the single UI source.

**Approved scope:** Local-only repo work. iPhone/Expo Go is in scope. Android and web install/PWA work are out of scope.

## Design

Market Copy stays a Vite React app in `yoink/`. A new `yoink-expo/` shell opens that local app inside `react-native-webview`, which is included for Expo Go usage. The web app emits small JSON haptic messages through `window.ReactNativeWebView.postMessage`; the Expo shell maps those events to `expo-haptics`.

The Account page becomes a shopping-account dashboard instead of three plain stats. It uses a cartoon Yoink ID panel, order pulse, wallet/cart summary, and compact quick actions inspired by common shopping app account screens: orders, saved items, wallet, support, and preferences. The page keeps Market Copy's purple/pink toy-market language, but adds gold and mint accents so it does not read as a single-hue screen.

Watching and Account use `shopping_cart` everywhere, matching the home header and cart affordance. The Watching empty state stays balance-free.

## Behavior

Haptics are light and purposeful:

- Bottom nav selection uses a selection tick.
- Opening cart uses a light impact.
- Watching or unwatching an item uses a small impact.
- Successful add-to-cart uses success feedback.

When the app runs in a normal browser, the haptic bridge safely no-ops.

## Testing

Static source tests cover the account layout, cart icons, app-level haptic wiring, and Expo shell files. A small unit test covers the haptic bridge JSON contract and browser no-op behavior.
