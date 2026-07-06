# Market Copy Local Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `/Users/byungkim/yoink-market-copy` as a separate local-only Market Copy repo with a four-tab market navigation and no user-facing Exchange/Bell entry point.

**Architecture:** Copy the current updated Yoink repo, remove its remote, and make the Market Copy changes only in the copied repo. Keep the app shell and existing market/cart/checkout/backend modules, but replace the Exchange tab model with a market-focused tab model and remove Exchange imports from the app shell.

**Tech Stack:** React 18, Vite 5, Node `node:test`, local git.

---

## File Structure

- Create repo directory: `/Users/byungkim/yoink-market-copy`
- Modify in new repo: `yoink/src/appFlow.js`
- Modify in new repo: `yoink/src/appFlow.test.js`
- Modify in new repo: `yoink/src/components/YoinkNav.jsx`
- Create in new repo: `yoink/src/components/YoinkNav.test.js`
- Modify in new repo: `yoink/src/App.jsx`
- Create in new repo: `yoink/src/screens/Watching.jsx`
- Create in new repo: `yoink/src/screens/Account.jsx`
- Optionally create in new repo: `yoink/src/screens/Search.jsx`

## Task 1: Create The Local-Only Repo

**Files:**
- Create: `/Users/byungkim/yoink-market-copy`

- [ ] **Step 1: Copy the current repo**

Run:

```bash
rsync -a --exclude node_modules --exclude yoink/node_modules --exclude yoink/dist /Users/byungkim/yoink/ /Users/byungkim/yoink-market-copy/
```

Expected: `/Users/byungkim/yoink-market-copy` exists and contains the same source files as `/Users/byungkim/yoink`.

- [ ] **Step 2: Make the copy a local-only repo**

Run:

```bash
git -C /Users/byungkim/yoink-market-copy remote remove origin
git -C /Users/byungkim/yoink-market-copy status --short --branch
```

Expected: no remote named `origin`; branch may retain the copied branch name, but the repo is local-only.

- [ ] **Step 3: Commit the repo split baseline**

Run:

```bash
git -C /Users/byungkim/yoink-market-copy status --short --branch
```

Expected: clean working tree. No commit is required if the copy already contains the current committed state.

## Task 2: Red Test For Market Copy App Flow

**Files:**
- Modify: `/Users/byungkim/yoink-market-copy/yoink/src/appFlow.test.js`

- [ ] **Step 1: Write the failing app-flow test**

Replace the existing bottom-nav test with:

```js
test('market copy bottom nav switches between the four market tabs and rejects exchange', () => {
  assert.deepEqual(TAB_SCREENS, ['home', 'search', 'watching', 'account']);

  const fromHome = openTab({ screen: APP_SCREENS.home, selectedListing: { id: 'f1' } }, APP_SCREENS.search);
  assert.deepEqual(fromHome, { screen: APP_SCREENS.search, selectedListing: null });

  const fromSearch = openTab({ screen: APP_SCREENS.search }, APP_SCREENS.watching);
  assert.deepEqual(fromSearch, { screen: APP_SCREENS.watching, selectedListing: null });

  const unchangedCheckout = openTab({ screen: APP_SCREENS.home }, APP_SCREENS.checkout);
  assert.deepEqual(unchangedCheckout, { screen: APP_SCREENS.home });

  assert.equal(APP_SCREENS.exchange, undefined);
  const unchangedExchange = openTab({ screen: APP_SCREENS.home }, 'exchange');
  assert.deepEqual(unchangedExchange, { screen: APP_SCREENS.home });
});
```

Update the first app-flow test to expect `getInitialScreen()` and `returnToMarket()` to use `APP_SCREENS.home`.

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
node --test src/appFlow.test.js
```

Expected: FAIL because `TAB_SCREENS` is still `['market', 'quests', 'pocket', 'orders']` and `APP_SCREENS.exchange` still exists.

## Task 3: Implement Market Copy App Flow

**Files:**
- Modify: `/Users/byungkim/yoink-market-copy/yoink/src/appFlow.js`
- Modify: `/Users/byungkim/yoink-market-copy/yoink/src/appFlow.test.js`

- [ ] **Step 1: Replace app screens and tab screens**

Use these screen names:

```js
export const APP_SCREENS = {
  home: 'home',
  search: 'search',
  watching: 'watching',
  account: 'account',
  productDetail: 'product-detail',
  checkout: 'checkout',
};

export const TAB_SCREENS = [
  APP_SCREENS.home,
  APP_SCREENS.search,
  APP_SCREENS.watching,
  APP_SCREENS.account,
];
```

Update `getInitialScreen()` and `returnToMarket()` to return `APP_SCREENS.home`.

Remove `openExchange()` and `closeExchange()` exports.

Update `openOrders()` only if it is still used. If it remains for checkout celebration, make it return `APP_SCREENS.account`; otherwise remove it from tests and imports.

- [ ] **Step 2: Run app-flow tests to verify GREEN**

Run:

```bash
node --test src/appFlow.test.js
```

Expected: PASS.

## Task 4: Red Test For Market Copy Nav Structure

**Files:**
- Create: `/Users/byungkim/yoink-market-copy/yoink/src/components/YoinkNav.test.js`

- [ ] **Step 1: Add a static nav structure test**

Create:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navSource = readFileSync(new URL('./YoinkNav.jsx', import.meta.url), 'utf8');

test('market copy nav exposes four tabs without a center exchange button', () => {
  for (const label of ['Home', 'Search', 'Watching', 'Account']) {
    assert.match(navSource, new RegExp(`label: '${label}'`));
  }

  assert.doesNotMatch(navSource, /Open the Bell/);
  assert.doesNotMatch(navSource, /onExchange/);
  assert.doesNotMatch(navSource, /notifications_active/);
  assert.doesNotMatch(navSource, /Bell/);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
node --test src/components/YoinkNav.test.js
```

Expected: FAIL because the current nav still contains `onExchange`, `Open the Bell`, and `Bell`.

## Task 5: Implement Market Copy Nav

**Files:**
- Modify: `/Users/byungkim/yoink-market-copy/yoink/src/components/YoinkNav.jsx`

- [ ] **Step 1: Replace nav component tabs**

Use four evenly-spaced tab definitions:

```js
const tabs = [
  { id: APP_SCREENS.home, icon: 'home', label: 'Home' },
  { id: APP_SCREENS.search, icon: 'search', label: 'Search' },
  { id: APP_SCREENS.watching, icon: 'visibility', label: 'Watching' },
  { id: APP_SCREENS.account, icon: 'person', label: 'Account' },
];
```

Change the component signature to:

```js
export default function YoinkNav({ tab, onSelectTab = () => {}, accent = '#6A5ACD' }) {
```

Render all tabs with:

```jsx
{tabs.map(renderTab)}
```

Remove the center button and remove `ordersInFlight` and `onExchange` props.

- [ ] **Step 2: Run nav test to verify GREEN**

Run:

```bash
node --test src/components/YoinkNav.test.js
```

Expected: PASS.

## Task 6: Red Test For App Shell Removing Exchange

**Files:**
- Create or modify: `/Users/byungkim/yoink-market-copy/yoink/src/appShell.test.js`

- [ ] **Step 1: Add a static app-shell test**

Create:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('market copy app shell does not import or route to exchange', () => {
  assert.doesNotMatch(appSource, /screens\/Exchange/);
  assert.doesNotMatch(appSource, /openExchange/);
  assert.doesNotMatch(appSource, /closeExchange/);
  assert.doesNotMatch(appSource, /APP_SCREENS\.exchange/);
  assert.doesNotMatch(appSource, /onExchange=/);
  assert.doesNotMatch(appSource, /onBellTap=/);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
node --test src/appShell.test.js
```

Expected: FAIL because the current app imports `Exchange` and wires `openExchange`, `closeExchange`, `APP_SCREENS.exchange`, and Bell tap props.

## Task 7: Implement Market Copy App Shell

**Files:**
- Modify: `/Users/byungkim/yoink-market-copy/yoink/src/App.jsx`
- Create: `/Users/byungkim/yoink-market-copy/yoink/src/screens/Watching.jsx`
- Create: `/Users/byungkim/yoink-market-copy/yoink/src/screens/Account.jsx`

- [ ] **Step 1: Create `Watching.jsx`**

Use a simple screen that matches existing visual language and accepts cart props:

```jsx
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, muted, brand } = marketTheme;

export default function Watching({ balance = 0, cartCount = 0, onOpenCart = () => {} }) {
  return (
    <div style={s('min-height:100%;background:#fff;color:#171326;padding-bottom:92px')}>
      <div style={s('position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EEEAF6;padding:12px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <div>
          <div style={s(`font:800 22px 'Fredoka';color:${ink}`)}>Watching</div>
          <div style={s(`font:700 12px 'Nunito';color:${muted}`)}>Saved finds and watched drops</div>
        </div>
        <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`border:0;border-radius:16px;background:${brand};color:#fff;padding:8px 11px;font:800 12px 'Fredoka';display:flex;align-items:center;gap:5px;cursor:pointer`)}>
          <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>shopping_bag</span>
          {cartCount}
        </button>
      </div>
      <div style={s('padding:18px 16px 0')}>
        <div style={s(`border:1px solid ${line};background:${wash};border-radius:8px;padding:18px`)}>
          <div style={s(`font:800 16px 'Fredoka';color:${ink}`)}>Nothing watched yet</div>
          <div style={s(`margin-top:6px;font:700 13px 'Nunito';color:${muted};line-height:1.35`)}>Heart items from the market later and they will land here.</div>
          <div style={s(`margin-top:14px;font:800 13px 'Fredoka';color:${brand}`)}>Balance Ȳ{balance}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `Account.jsx`**

Use a simple account screen backed by wallet/order count props:

```jsx
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, muted, brand } = marketTheme;

export default function Account({ balance = 0, streak = 0, ordersInFlight = 0, cartCount = 0, onOpenCart = () => {} }) {
  const stats = [
    { label: 'Balance', value: `Ȳ${balance}` },
    { label: 'Streak', value: `${streak}d` },
    { label: 'Orders', value: `${ordersInFlight}` },
  ];

  return (
    <div style={s('min-height:100%;background:#fff;color:#171326;padding-bottom:92px')}>
      <div style={s('position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EEEAF6;padding:12px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <div>
          <div style={s(`font:800 22px 'Fredoka';color:${ink}`)}>Account</div>
          <div style={s(`font:700 12px 'Nunito';color:${muted}`)}>Wallet, orders, and profile</div>
        </div>
        <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`border:0;border-radius:16px;background:${brand};color:#fff;padding:8px 11px;font:800 12px 'Fredoka';display:flex;align-items:center;gap:5px;cursor:pointer`)}>
          <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>shopping_bag</span>
          {cartCount}
        </button>
      </div>
      <div style={s('padding:18px 16px 0;display:grid;gap:10px')}>
        {stats.map((stat) => (
          <div key={stat.label} style={s(`border:1px solid ${line};background:${wash};border-radius:8px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between`)}>
            <span style={s(`font:800 13px 'Fredoka';color:${ink}`)}>{stat.label}</span>
            <span style={s(`font:900 18px 'Fredoka';color:${brand}`)}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `App.jsx`**

Remove these imports:

```js
import Exchange from './screens/Exchange.jsx';
import { fetchBell, fetchOrders, fetchWallet, placeOrder } from './api.js';
import { bellLabel } from './bellView.js';
import { closeExchange, openExchange } from './appFlow.js';
```

Replace API import with:

```js
import { fetchOrders, fetchWallet, placeOrder } from './api.js';
```

Add:

```js
import Account from './screens/Account.jsx';
import Watching from './screens/Watching.jsx';
```

Remove `bellStatus`, `handleExchange`, `refreshBellStatus`, `isExchange`, and Bell polling.

Change tab accents to:

```js
const TAB_ACCENTS = {
  [APP_SCREENS.home]: '#6A5ACD',
  [APP_SCREENS.search]: '#6A5ACD',
  [APP_SCREENS.watching]: '#6A5ACD',
  [APP_SCREENS.account]: '#6A5ACD',
};
```

Render screens:

```jsx
) : flow.screen === APP_SCREENS.search ? (
  <MonoMarket ... />
) : flow.screen === APP_SCREENS.watching ? (
  <Watching balance={wallet.balance} cartCount={cartCount} onOpenCart={handleOpenCart} />
) : flow.screen === APP_SCREENS.account ? (
  <Account balance={wallet.balance} streak={wallet.streak} ordersInFlight={ordersInFlight} cartCount={cartCount} onOpenCart={handleOpenCart} />
) : (
  <MonoMarket ... />
)
```

When rendering `MonoMarket`, omit `bell` and `onBellTap` props.

Update `handleYoinkDone()` to route to `APP_SCREENS.account` instead of `openOrders()`.

Render nav with:

```jsx
<YoinkNav
  tab={flow.screen}
  onSelectTab={handleSelectTab}
  accent={TAB_ACCENTS[flow.screen]}
/>
```

- [ ] **Step 4: Run app shell test to verify GREEN**

Run:

```bash
node --test src/appShell.test.js
```

Expected: PASS.

## Task 8: Full Verification And Localhost

**Files:**
- Verify: `/Users/byungkim/yoink-market-copy/yoink`

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test src/appFlow.test.js src/components/YoinkNav.test.js src/appShell.test.js
```

Expected: PASS.

- [ ] **Step 2: Run all direct test files**

Run:

```bash
node --test src/**/*.test.js server/**/*.test.js
```

Expected: PASS, with any existing intentional skips preserved.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: Vite build exits 0.

- [ ] **Step 4: Commit Market Copy implementation**

Run:

```bash
git add .
git commit -m "Create market copy navigation"
```

Expected: commit succeeds in `/Users/byungkim/yoink-market-copy`.

- [ ] **Step 5: Start localhost from Market Copy**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL. If `5173` is occupied by Exchange Copy, stop that server or use the next available port.

- [ ] **Step 6: Verify frontend and backend endpoint**

Run:

```bash
curl -I http://127.0.0.1:5173/
curl -s http://127.0.0.1:5173/api/wallet
```

Expected: frontend returns `HTTP/1.1 200 OK`, and `/api/wallet` returns JSON.
