# Expo Haptics Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Market Copy Account experience, standardize cart icons, add web-to-Expo haptic messages, and provide an Expo Go iPhone wrapper.

**Architecture:** Keep `yoink/` as the single source of UI truth. Add `yoink/src/hapticFeedback.js` as a tiny bridge with no browser dependency, and add `yoink-expo/` as a native shell that hosts the local Vite URL in `react-native-webview` while translating haptic messages with `expo-haptics`.

**Tech Stack:** React 18, Vite, Node test runner, Expo Go, `react-native-webview`, `expo-haptics`.

---

### Task 1: Account and Icon Tests

**Files:**
- Create: `yoink/src/accountScreen.test.js`
- Modify: `yoink/src/watchedListingsScreen.test.js`

- [ ] **Step 1: Write the failing test**

Create tests that assert Account and Watching use `shopping_cart`, Account contains `Yoink ID`, `Order pulse`, and quick actions, and Watching remains balance-free.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/accountScreen.test.js src/watchedListingsScreen.test.js`

Expected: FAIL because Account still uses the old plain stats layout and `shopping_bag`.

- [ ] **Step 3: Implement minimal UI changes**

Update `Account.jsx` and `Watching.jsx` to use `shopping_cart`. Rebuild Account as the approved dashboard with working quick-action callbacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/accountScreen.test.js src/watchedListingsScreen.test.js`

Expected: PASS.

### Task 2: Haptic Bridge Tests

**Files:**
- Create: `yoink/src/hapticFeedback.js`
- Create: `yoink/src/hapticFeedback.test.js`
- Create: `yoink/src/hapticFeedbackScreen.test.js`
- Modify: `yoink/src/App.jsx`

- [ ] **Step 1: Write the failing tests**

Add a unit test for `emitHaptic()` posting `{ source: 'yoink', type: 'haptic', name }` to `window.ReactNativeWebView.postMessage`, plus static tests that App wires haptics into tab selection, cart opening, watching, unwatching, and add-to-cart.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/hapticFeedback.test.js src/hapticFeedbackScreen.test.js`

Expected: FAIL because `hapticFeedback.js` does not exist and App has no haptic imports.

- [ ] **Step 3: Implement minimal bridge and wiring**

Add `HAPTIC_EVENTS`, implement safe `emitHaptic()`, import both in `App.jsx`, and call the bridge in the existing app handlers.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/hapticFeedback.test.js src/hapticFeedbackScreen.test.js`

Expected: PASS.

### Task 3: Expo Wrapper Tests

**Files:**
- Create: `yoink/src/expoShell.test.js`
- Create: `yoink-expo/App.js`
- Create: `yoink-expo/app.json`
- Create: `yoink-expo/package.json`
- Create: `yoink-expo/README.md`

- [ ] **Step 1: Write the failing test**

Add a static test that asserts the Expo shell depends on `expo-haptics` and `react-native-webview`, reads `EXPO_PUBLIC_YOINK_URL`, handles `onMessage`, and documents Expo Go setup.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/expoShell.test.js`

Expected: FAIL because `yoink-expo/` does not exist.

- [ ] **Step 3: Implement minimal Expo shell**

Add the Expo shell files with a WebView pointing to the local Vite URL and haptic event mapping.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/expoShell.test.js`

Expected: PASS.

### Task 4: Full Verification and Commit

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run focused tests**

Run: `node --test src/accountScreen.test.js src/hapticFeedback.test.js src/hapticFeedbackScreen.test.js src/expoShell.test.js src/watchedListingsScreen.test.js`

Expected: PASS.

- [ ] **Step 2: Run full web test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS and `dist/` output.

- [ ] **Step 4: Commit**

Commit message: `Add Expo haptics wrapper and account dashboard`.
