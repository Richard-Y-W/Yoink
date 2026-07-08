# Pocket 3D Holo Shelf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active Watching tab with a Pocket shelf where owned Holo Finds slabs/cards open into a playful 3D Trophy Viewer.

**Architecture:** Use the existing order delivery -> `collection` backend flow as the ownership source. Add a pure client resolver that joins collection entries to market catalog metadata, render Pocket as a shelf/carousel, and isolate Three.js inside `HoloSlab3D` so the rest of the app remains testable with source-string and pure helper tests.

**Tech Stack:** React 18, Vite, Node `--test`, existing inline style helper `s()`, Material Symbols, Three.js via the `three` package.

---

## File Structure

- Modify `yoink/package.json` and `yoink/package-lock.json`: add `three`.
- Modify `yoink/src/appFlow.js`: replace active `watching` tab with `pocket`.
- Modify `yoink/src/App.jsx`: route `APP_SCREENS.pocket` to `Pocket`; stop importing active `Watching`.
- Modify `yoink/src/components/YoinkNav.jsx`: replace Watching nav item with Pocket.
- Modify `yoink/src/screens/Account.jsx`: replace the Watching quick action with Pocket.
- Modify `yoink/src/data.js`: expose catalog lookup helpers for collection metadata.
- Create `yoink/src/pocketItems.js`: pure collection-to-Pocket resolver.
- Replace `yoink/src/screens/Pocket.jsx`: make Pocket the owned shelf screen instead of a shop hybrid.
- Create `yoink/src/components/PocketShelf.jsx`: shelf/carousel presentation.
- Create `yoink/src/components/HoloTrophyViewer.jsx`: full-screen viewer shell and metadata hotspots.
- Create `yoink/src/components/HoloSlab3D.jsx`: Three.js procedural slab/card scene.
- Create or modify tests:
  - `yoink/src/appFlow.test.js`
  - `yoink/src/components/YoinkNav.test.js`
  - `yoink/src/accountScreen.test.js`
  - `yoink/src/appShell.test.js`
  - `yoink/src/pocketItems.test.js`
  - `yoink/src/pocketScreen.test.js`
  - `yoink/src/holoTrophyViewer.test.js`

## Task 1: Active Navigation Uses Pocket Instead Of Watching

**Files:**
- Modify: `yoink/src/appFlow.test.js`
- Modify: `yoink/src/components/YoinkNav.test.js`
- Modify: `yoink/src/accountScreen.test.js`
- Modify: `yoink/src/appShell.test.js`
- Modify: `yoink/src/appFlow.js`
- Modify: `yoink/src/components/YoinkNav.jsx`
- Modify: `yoink/src/App.jsx`
- Modify: `yoink/src/screens/Account.jsx`

- [ ] **Step 1: Write failing navigation tests**

In `yoink/src/appFlow.test.js`, replace the bottom-nav test body with:

```js
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
```

In `yoink/src/components/YoinkNav.test.js`, change the label loop:

```js
for (const label of ['Home', 'Search', 'Orders', 'Pocket', 'Account']) {
  assert.match(navSource, new RegExp(`label: '${label}'`));
}
assert.doesNotMatch(navSource, /Watching/);
assert.match(navSource, /id: APP_SCREENS\.pocket/);
assert.match(navSource, /inventory_2/);
```

In `yoink/src/accountScreen.test.js`, change the tests to assert Pocket:

```js
const pocketSource = readFileSync(new URL('./screens/Pocket.jsx', import.meta.url), 'utf8');

test('account and pocket header cart buttons use the cart icon', () => {
  assert.match(accountSource, /shopping_cart/);
  assert.match(pocketSource, /shopping_cart/);
  assert.doesNotMatch(accountSource, /shopping_bag/);
  assert.doesNotMatch(pocketSource, /shopping_bag/);
});
```

Replace the quick-action assertions in the same file:

```js
for (const action of ['Orders', 'Pocket', 'Wallet', 'Support', 'Settings']) {
  assert.match(accountSource, new RegExp(`label: '${action}'`));
}

assert.match(accountSource, /onOpenPocket = \(\) => \{\}/);
assert.doesNotMatch(accountSource, /onOpenWatching/);
```

Replace the app handler assertion:

```js
assert.match(appSource, /onOpenPocket=\{\(\) => handleSelectTab\(APP_SCREENS\.pocket\)\}/);
assert.doesNotMatch(appSource, /onOpenWatching=/);
```

In `yoink/src/appShell.test.js`, add:

```js
test('market copy app shell routes active collection surface to Pocket', () => {
  assert.match(appSource, /screens\/Pocket/);
  assert.match(appSource, /flow\.screen === APP_SCREENS\.pocket/);
  assert.doesNotMatch(appSource, /screens\/Watching/);
  assert.doesNotMatch(appSource, /APP_SCREENS\.watching/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd yoink
npm test -- src/appFlow.test.js src/components/YoinkNav.test.js src/accountScreen.test.js src/appShell.test.js
```

Expected: FAIL because `APP_SCREENS.pocket` does not exist, nav still renders Watching, App imports Watching, and Account still has `onOpenWatching`.

- [ ] **Step 3: Implement Pocket routing and nav**

In `yoink/src/appFlow.js`, replace the active screen config with:

```js
export const APP_SCREENS = {
  home: 'home',
  search: 'search',
  orders: 'orders',
  pocket: 'pocket',
  account: 'account',
  productDetail: 'product-detail',
  checkout: 'checkout',
};

export const TAB_SCREENS = [
  APP_SCREENS.home,
  APP_SCREENS.search,
  APP_SCREENS.orders,
  APP_SCREENS.pocket,
  APP_SCREENS.account,
];
```

In `yoink/src/components/YoinkNav.jsx`, replace the Watching tab object with:

```js
{ id: APP_SCREENS.pocket, icon: 'inventory_2', label: 'Pocket' },
```

In `yoink/src/App.jsx`, replace:

```js
import Watching from './screens/Watching.jsx';
```

with:

```js
import Pocket from './screens/Pocket.jsx';
```

Replace the tab accent key:

```js
[APP_SCREENS.pocket]: '#6A5ACD',
```

Replace the Watching route branch:

```jsx
) : flow.screen === APP_SCREENS.pocket ? (
  <Pocket
    balance={wallet.balance}
    cartCount={cartCount}
    onOpenCart={handleOpenCart}
    onOpenMarket={() => handleSelectTab(APP_SCREENS.home)}
    onToast={showToast}
  />
```

In the Account route props, replace:

```jsx
onOpenWatching={() => handleSelectTab(APP_SCREENS.watching)}
```

with:

```jsx
onOpenPocket={() => handleSelectTab(APP_SCREENS.pocket)}
```

In `yoink/src/screens/Account.jsx`, rename the prop:

```js
onOpenPocket = () => {},
```

Replace the quick action object:

```js
{ label: 'Pocket', icon: 'inventory_2', color: '#C7F5EC', onPress: onOpenPocket },
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
cd yoink
npm test -- src/appFlow.test.js src/components/YoinkNav.test.js src/accountScreen.test.js src/appShell.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add yoink/src/appFlow.js yoink/src/App.jsx yoink/src/components/YoinkNav.jsx yoink/src/screens/Account.jsx yoink/src/appFlow.test.js yoink/src/components/YoinkNav.test.js yoink/src/accountScreen.test.js yoink/src/appShell.test.js
git commit -m "Route active collection tab to Pocket"
```

## Task 2: Add Pocket Holo Collection Data Resolver

**Files:**
- Modify: `yoink/src/data.js`
- Create: `yoink/src/pocketItems.js`
- Create: `yoink/src/pocketItems.test.js`

- [ ] **Step 1: Write failing pure helper tests**

Create `yoink/src/pocketItems.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { makePocketHoloItems } from './pocketItems.js';

test('Pocket resolver keeps owned Holo Finds slabs and joins catalog metadata', () => {
  const owned = makePocketHoloItems([
    {
      id: 'drop-holo-finds-prism-star-foil-card',
      title: 'Prism Star Foil Card',
      imageUrl: '/yoink-items/holo-finds-prism-star-foil-card.png',
      imageStripe: 'stripe-a',
      seller: 'foil_friends',
      unitPrice: 1400,
      quantity: 1,
      acquiredAt: 1783450000000,
    },
    {
      id: 'drop-desk-pets-mochi-blob',
      title: 'Mochi Blob',
      imageUrl: '/yoink-items/desk-pets-mochi-blob.png',
      imageStripe: 'stripe-b',
      seller: 'desk_pet_co',
      unitPrice: 120,
      quantity: 2,
      acquiredAt: 1783450000000,
    },
  ]);

  assert.equal(owned.length, 1);
  assert.equal(owned[0].id, 'drop-holo-finds-prism-star-foil-card');
  assert.equal(owned[0].name, 'Prism Star Foil Card');
  assert.equal(owned[0].family, 'Holo Finds');
  assert.equal(owned[0].rarity, 'Ultra Rare');
  assert.equal(owned[0].editionLabel, 'Edition of 12');
  assert.equal(owned[0].quantity, 1);
  assert.equal(owned[0].ownedLabel, 'owned 1');
  assert.equal(owned[0].interactive3d, true);
  assert.match(owned[0].imageUrl, /holo-finds-prism-star-foil-card/);
});

test('Pocket resolver groups duplicate Holo entries by id', () => {
  const owned = makePocketHoloItems([
    { id: 'drop-holo-finds-frog-foil-card', title: 'Frog Foil Card', quantity: 1, acquiredAt: 1000 },
    { id: 'drop-holo-finds-frog-foil-card', title: 'Frog Foil Card', quantity: 2, acquiredAt: 2000 },
  ]);

  assert.equal(owned.length, 1);
  assert.equal(owned[0].quantity, 3);
  assert.equal(owned[0].ownedLabel, 'owned 3');
  assert.equal(owned[0].acquiredAt, 2000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd yoink
npm test -- src/pocketItems.test.js
```

Expected: FAIL with module not found for `./pocketItems.js`.

- [ ] **Step 3: Export catalog lookup helpers**

In `yoink/src/data.js`, after `makeTimedDrop`, add:

```js
export function getDropCatalogItem(itemId) {
  return ALL_MARKET_DROP_CATALOG.find((item) => item.id === itemId) ?? null;
}

export function getDecoratedDropListingById(itemId) {
  const index = ALL_MARKET_DROP_CATALOG.findIndex((item) => item.id === itemId);
  if (index < 0) return null;
  return decorateDropListing(ALL_MARKET_DROP_CATALOG[index], index);
}
```

- [ ] **Step 4: Create Pocket resolver**

Create `yoink/src/pocketItems.js`:

```js
import { getDecoratedDropListingById, stripe } from './data.js';

const FALLBACK_STRIPE = stripe('#E9DEFF', '#D6C2FF');

function quantityOf(item) {
  return Math.max(1, Math.floor(Number(item?.quantity) || 1));
}

function acquiredAtOf(item) {
  const value = Number(item?.acquiredAt) || 0;
  return Number.isFinite(value) ? value : 0;
}

export function isPocketHoloItem(item) {
  const id = String(item?.id ?? '');
  const title = String(item?.title ?? item?.name ?? '').toLowerCase();
  const catalog = getDecoratedDropListingById(id);
  return catalog?.family === 'Holo Finds'
    || id.startsWith('drop-holo-finds-')
    || title.includes('foil card')
    || title.includes('sticker slab');
}

export function makePocketHoloItems(collection = []) {
  const grouped = new Map();

  for (const item of Array.isArray(collection) ? collection : []) {
    if (!isPocketHoloItem(item)) continue;
    const id = String(item.id ?? item.title ?? 'holo-find');
    const existing = grouped.get(id);
    const catalog = getDecoratedDropListingById(id);
    const quantity = quantityOf(item);
    const acquiredAt = acquiredAtOf(item);

    const next = {
      ...(catalog ?? {}),
      id,
      name: catalog?.name ?? item.title ?? item.name ?? 'Holo Find',
      title: item.title ?? catalog?.name ?? 'Holo Find',
      family: catalog?.family ?? 'Holo Finds',
      rarity: catalog?.rarity ?? 'Rare',
      seller: item.seller ?? catalog?.seller ?? 'foil_friends',
      price: catalog?.price ?? item.unitPrice ?? 0,
      unitPrice: Number(item.unitPrice ?? catalog?.price ?? 0) || 0,
      imageUrl: item.imageUrl || catalog?.imageUrl || '',
      imageStripe: item.imageStripe || catalog?.stripe || FALLBACK_STRIPE,
      stripe: catalog?.stripe || item.imageStripe || FALLBACK_STRIPE,
      editionLabel: catalog?.editionLabel ?? 'Pocket edition',
      stockLabel: catalog?.stockLabel ?? '',
      traits: catalog?.traits ?? [],
      quantity,
      ownedLabel: `owned ${quantity}`,
      acquiredAt,
      interactive3d: true,
    };

    if (existing) {
      existing.quantity += quantity;
      existing.ownedLabel = `owned ${existing.quantity}`;
      existing.acquiredAt = Math.max(existing.acquiredAt, acquiredAt);
    } else {
      grouped.set(id, next);
    }
  }

  return [...grouped.values()].sort((a, b) => b.acquiredAt - a.acquiredAt || a.name.localeCompare(b.name));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
cd yoink
npm test -- src/pocketItems.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add yoink/src/data.js yoink/src/pocketItems.js yoink/src/pocketItems.test.js
git commit -m "Add Pocket Holo collection resolver"
```

## Task 3: Build Pocket Shelf Screen From Owned Holo Items

**Files:**
- Modify: `yoink/src/screens/Pocket.jsx`
- Create: `yoink/src/components/PocketShelf.jsx`
- Create: `yoink/src/pocketScreen.test.js`
- Modify: `yoink/src/marketRenderAssets.test.js`

- [ ] **Step 1: Write failing Pocket screen source tests**

Create `yoink/src/pocketScreen.test.js`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pocketSource = readFileSync(new URL('./screens/Pocket.jsx', import.meta.url), 'utf8');
const shelfSource = readFileSync(new URL('./components/PocketShelf.jsx', import.meta.url), 'utf8');

test('Pocket fetches collection and renders the Holo shelf instead of a shop grid', () => {
  assert.match(pocketSource, /fetchCollection/);
  assert.match(pocketSource, /makePocketHoloItems/);
  assert.match(pocketSource, /PocketShelf/);
  assert.match(pocketSource, /HoloTrophyViewer/);
  assert.match(pocketSource, /Your Pocket is waiting/);
  assert.match(pocketSource, /Back to market/);
  assert.doesNotMatch(pocketSource, /Add to your collection/);
  assert.doesNotMatch(pocketSource, /visibleShopItems/);
  assert.doesNotMatch(pocketSource, /priceSort/);
});

test('Pocket shelf has centered selected item, side-card angles, and open action', () => {
  assert.match(shelfSource, /selectedIndex/);
  assert.match(shelfSource, /rotateY/);
  assert.match(shelfSource, /Open trophy viewer/);
  assert.match(shelfSource, /ownedLabel/);
  assert.match(shelfSource, /editionLabel/);
  assert.match(shelfSource, /animation:ypop/);
});
```

In `yoink/src/marketRenderAssets.test.js`, replace the Watching source with Pocket:

```js
const pocketSource = readFileSync(new URL('./screens/Pocket.jsx', import.meta.url), 'utf8');
```

and update the assertion:

```js
assert.match(pocketSource, /imageUrl/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd yoink
npm test -- src/pocketScreen.test.js src/marketRenderAssets.test.js
```

Expected: FAIL because `PocketShelf.jsx` does not exist and `Pocket.jsx` still contains shop-grid code.

- [ ] **Step 3: Create PocketShelf component**

Create `yoink/src/components/PocketShelf.jsx`:

```jsx
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

function offsetFor(index, selectedIndex, length) {
  const raw = index - selectedIndex;
  if (raw > length / 2) return raw - length;
  if (raw < -length / 2) return raw + length;
  return raw;
}

export default function PocketShelf({ items = [], selectedIndex = 0, onSelect = () => {}, onOpen = () => {} }) {
  const selected = items[selectedIndex] ?? null;

  return (
    <section style={s('position:relative;background:#fff;border:1.5px solid #EDEAF6;border-radius:20px;padding:15px 13px 14px;box-shadow:0 4px 14px rgba(23,19,38,.06);overflow:hidden')}>
      <div style={s('display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px')}>
        <div>
          <div style={s(`font:900 21px 'Fredoka';color:${ink}`)}>Pocket</div>
          <div style={s(`font:800 12px 'Nunito';color:${muted};margin-top:2px`)}>Owned Holo Finds</div>
        </div>
        <span style={s(`display:inline-flex;align-items:center;gap:5px;border-radius:999px;background:${attentionBadgeBackground};color:${attentionBadgeText};padding:5px 9px;font:900 10.5px 'Fredoka'`)}>
          <span className="mi" style={s("font-size:13px;font-variation-settings:'FILL' 1")}>auto_awesome</span>
          3D Ready
        </span>
      </div>

      <div style={s('position:relative;height:254px;margin:0 -4px 10px;display:flex;align-items:center;justify-content:center;perspective:760px')}>
        <div style={s('position:absolute;left:24px;right:24px;bottom:22px;height:38px;border-radius:50%;background:radial-gradient(ellipse,rgba(106,90,205,.22),transparent 70%)')} />
        {items.map((item, index) => {
          const offset = offsetFor(index, selectedIndex, items.length);
          const visible = Math.abs(offset) <= 2;
          const active = offset === 0;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={active ? 'Open trophy viewer' : `Select ${item.name}`}
              onClick={() => (active ? onOpen(item) : onSelect(index))}
              style={s(`position:absolute;width:${active ? 142 : 96}px;height:${active ? 202 : 142}px;border:${active ? '3px' : '2px'} solid #392674;border-radius:${active ? 26 : 20}px;background:linear-gradient(135deg,rgba(255,255,255,.82),rgba(169,134,255,.30),rgba(80,240,224,.28));box-shadow:${active ? '0 28px 55px rgba(106,90,205,.26)' : '0 16px 28px rgba(23,19,38,.13)'};transform:translateX(${offset * 86}px) rotateY(${offset * -24}deg) scale(${active ? 1 : .88});opacity:${visible ? (active ? 1 : .72) : 0};z-index:${10 - Math.abs(offset)};cursor:pointer;transition:transform .28s ease,opacity .28s ease,box-shadow .28s ease;overflow:hidden;padding:0;animation:${active ? 'ypop .36s ease both' : 'none'}`)}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block')} />
              ) : (
                <span style={s(`position:absolute;inset:15px;border-radius:18px;background:${item.stripe}`)} />
              )}
              <span style={s('position:absolute;inset:0;background:linear-gradient(110deg,transparent 0 34%,rgba(255,255,255,.48) 46%,transparent 58%);mix-blend-mode:screen')} />
            </button>
          );
        })}
      </div>

      {selected && (
        <div style={s(`border:1.5px solid ${line};border-radius:16px;background:#F9F7FF;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:12px`)}>
          <div style={s('min-width:0')}>
            <div style={s(`font:900 16px/1.15 'Fredoka';color:${ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>{selected.name}</div>
            <div style={s(`font:800 11.5px 'Nunito';color:${muted};margin-top:4px`)}>{selected.rarity} · {selected.editionLabel} · {selected.ownedLabel}</div>
          </div>
          <button
            type="button"
            onClick={() => onOpen(selected)}
            style={s(`border:0;border-radius:13px;background:${brand};color:#fff;font:900 12px 'Fredoka';height:42px;padding:0 14px;box-shadow:0 4px 0 #4B3BA6;cursor:pointer;white-space:nowrap`)}
          >
            Open
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Replace Pocket screen with owned shelf integration**

Replace `yoink/src/screens/Pocket.jsx` with:

```jsx
import { useEffect, useMemo, useState } from 'react';
import { fetchCollection } from '../api.js';
import { makePocketHoloItems } from '../pocketItems.js';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';
import PocketShelf from '../components/PocketShelf.jsx';
import HoloTrophyViewer from '../components/HoloTrophyViewer.jsx';

const { ink, wash, muted, brand, currencyButtonBackground, cartCountBackground } = marketTheme;

export default function Pocket({ balance = 0, cartCount = 0, onOpenCart = () => {}, onOpenMarket = () => {}, onToast = () => {} }) {
  const [collection, setCollection] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerItem, setViewerItem] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchCollection().then((data) => {
      if (alive && Array.isArray(data.collection)) setCollection(data.collection);
    }).catch(() => {
      if (alive) setCollection([]);
      onToast('Pocket could not load right now.');
    });
    return () => { alive = false; };
  }, [onToast]);

  const holoItems = useMemo(() => makePocketHoloItems(collection ?? []), [collection]);
  const loading = collection === null;

  return (
    <div style={s(`position:relative;min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>
      {viewerItem && (
        <HoloTrophyViewer item={viewerItem} onClose={() => setViewerItem(null)} />
      )}

      <div style={s("position:sticky;top:0;z-index:30;background:#fff;padding:47px 13px 11px;box-shadow:0 3px 14px rgba(23,19,38,.06)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between")}>
          <div>
            <div style={s(`font:900 23px 'Fredoka';color:${brand};letter-spacing:.2px`)}>Pocket</div>
            <div style={s(`font:800 11.5px 'Nunito';color:${muted};margin-top:1px`)}>Your delivered Holo Finds</div>
          </div>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <div style={s(`display:flex;align-items:center;gap:5px;background:${currencyButtonBackground};border:1.5px solid ${currencyButtonBackground};border-radius:999px;padding:4px 10px 4px 5px`)}>
              <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:${currencyButtonBackground};flex:none`)}>Y</span>
              <span style={s("font:700 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
            </div>
            <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`position:relative;width:36px;height:36px;border:0;border-radius:11px;background:${wash};display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0`)}>
              <span className="mi" style={s(`font-size:21px;color:${ink}`)}>shopping_cart</span>
              <span style={s(`position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:${cartCountBackground};color:#fff;font:700 9.5px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>{cartCount}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={s('flex:1;padding:14px 14px 98px;display:flex;flex-direction:column;gap:15px')}>
        {loading && (
          <div style={s('height:330px;border-radius:20px;background:#fff;border:1.5px solid #EDEAF6;display:flex;align-items:center;justify-content:center')}>
            <div style={s('width:30px;height:30px;border-radius:50%;border:3px solid #EDEAF6;border-top-color:#171326;animation:yspin .8s linear infinite')} />
          </div>
        )}

        {!loading && holoItems.length > 0 && (
          <PocketShelf
            items={holoItems}
            selectedIndex={Math.min(selectedIndex, holoItems.length - 1)}
            onSelect={setSelectedIndex}
            onOpen={setViewerItem}
          />
        )}

        {!loading && holoItems.length === 0 && (
          <section style={s('background:#fff;border:1.5px dashed #DCD5EF;border-radius:22px;padding:30px 18px;text-align:center;box-shadow:0 4px 14px rgba(23,19,38,.04)')}>
            <div style={s(`width:76px;height:76px;border-radius:26px;margin:0 auto 14px;background:linear-gradient(135deg,#E9DEFF,#C7F5EC);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 0 rgba(106,90,205,.14)`)}>
              <span className="mi" style={s(`font-size:36px;color:${brand};font-variation-settings:'FILL' 1`)}>inventory_2</span>
            </div>
            <div style={s(`font:900 21px 'Fredoka';color:${ink}`)}>Your Pocket is waiting</div>
            <div style={s(`font:800 12.5px/1.4 'Nunito';color:${muted};margin:8px auto 18px;max-width:260px`)}>
              Delivered Holo Finds will show up here as playable slab trophies.
            </div>
            <button type="button" onClick={onOpenMarket} style={s(`height:46px;border:0;border-radius:14px;background:${brand};color:#fff;font:900 13px 'Fredoka';padding:0 18px;box-shadow:0 5px 0 #4B3BA6;cursor:pointer`)}>
              Back to market
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
cd yoink
npm test -- src/pocketScreen.test.js src/marketRenderAssets.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add yoink/src/screens/Pocket.jsx yoink/src/components/PocketShelf.jsx yoink/src/pocketScreen.test.js yoink/src/marketRenderAssets.test.js
git commit -m "Build Pocket Holo shelf screen"
```

## Task 4: Add Trophy Viewer Shell With Metadata Hotspots

**Files:**
- Create: `yoink/src/components/HoloTrophyViewer.jsx`
- Create: `yoink/src/holoTrophyViewer.test.js`

- [ ] **Step 1: Write failing viewer tests**

Create `yoink/src/holoTrophyViewer.test.js`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const viewerSource = readFileSync(new URL('./components/HoloTrophyViewer.jsx', import.meta.url), 'utf8');
const slabSource = readFileSync(new URL('./components/HoloSlab3D.jsx', import.meta.url), 'utf8');

test('Trophy Viewer keeps the Yoink cartoon shell and item metadata hotspots', () => {
  assert.match(viewerSource, /HoloSlab3D/);
  assert.match(viewerSource, /Drag to rotate/);
  assert.match(viewerSource, /tilt to shimmer/);
  assert.match(viewerSource, /editionLabel/);
  assert.match(viewerSource, /ownedLabel/);
  assert.match(viewerSource, /traits/);
  assert.match(viewerSource, /aria-label="Close trophy viewer"/);
  assert.match(viewerSource, /ULTRA RARE/);
});

test('3D slab component exposes pointer rotation, foil shimmer, and fallback behavior', () => {
  assert.match(slabSource, /from 'three'/);
  assert.match(slabSource, /pointermove/);
  assert.match(slabSource, /rotateY/);
  assert.match(slabSource, /foilUniform/);
  assert.match(slabSource, /prefers-reduced-motion/);
  assert.match(slabSource, /canvas/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: FAIL because `HoloTrophyViewer.jsx` and `HoloSlab3D.jsx` do not exist.

- [ ] **Step 3: Create Trophy Viewer shell**

Create `yoink/src/components/HoloTrophyViewer.jsx`:

```jsx
import { useMemo, useState } from 'react';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';
import HoloSlab3D from './HoloSlab3D.jsx';

const { ink, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

const HOTSPOTS = [
  { id: 'rarity', label: 'Rarity' },
  { id: 'edition', label: 'Edition' },
  { id: 'traits', label: 'Traits' },
];

export default function HoloTrophyViewer({ item, onClose = () => {} }) {
  const [activeHotspot, setActiveHotspot] = useState('rarity');
  const traitCopy = useMemo(() => (item?.traits ?? []).slice(0, 3).join(' · '), [item]);
  if (!item) return null;

  const detail = {
    rarity: `${item.rarity ?? 'Rare'} Holo Find`,
    edition: `${item.editionLabel ?? 'Pocket edition'} · ${item.ownedLabel ?? 'owned 1'}`,
    traits: traitCopy || 'foil case · raised icon · cartoon slab',
  }[activeHotspot];

  return (
    <div style={s("position:absolute;inset:0;z-index:980;background:radial-gradient(circle at 50% 28%,#FFF1B6 0 12%,transparent 24%),linear-gradient(180deg,#171326,#35245F);font-family:'Nunito',sans-serif;color:#fff;overflow:hidden;animation:ypop .24s ease both")}>
      <div style={s('position:absolute;left:14px;right:14px;top:46px;z-index:2;display:flex;align-items:center;justify-content:space-between')}>
        <button type="button" aria-label="Close trophy viewer" onClick={onClose} style={s('width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0')}>
          <span className="mi" style={s('font-size:22px')}>arrow_back</span>
        </button>
        <span style={s(`border-radius:999px;background:${attentionBadgeBackground};color:${attentionBadgeText};padding:6px 10px;font:900 10.5px 'Fredoka'`)}>
          {String(item.rarity ?? 'ULTRA RARE').toUpperCase()}
        </span>
      </div>

      <div style={s('position:absolute;inset:86px 0 166px;display:flex;align-items:center;justify-content:center')}>
        <HoloSlab3D item={item} />
      </div>

      <section style={s('position:absolute;left:14px;right:14px;bottom:22px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.18);border-radius:20px;padding:14px;box-shadow:0 20px 44px rgba(0,0,0,.24)')}>
        <div style={s("font:900 20px/1.1 'Fredoka';color:#fff")}>{item.name}</div>
        <div style={s("font:800 12px/1.35 'Nunito';color:#D9D0FF;margin-top:5px")}>Drag to rotate · tilt to shimmer · tap corners for detail pips</div>

        <div style={s('display:flex;gap:7px;margin-top:12px;flex-wrap:wrap')}>
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              aria-pressed={activeHotspot === spot.id}
              onClick={() => setActiveHotspot(spot.id)}
              style={s(`border:0;border-radius:999px;padding:6px 9px;background:${activeHotspot === spot.id ? attentionBadgeBackground : 'rgba(255,255,255,.14)'};color:${activeHotspot === spot.id ? attentionBadgeText : '#fff'};font:900 10.5px 'Fredoka';cursor:pointer`)}
            >
              {spot.label}
            </button>
          ))}
        </div>

        <div style={s(`margin-top:11px;border-radius:14px;background:rgba(255,255,255,.12);padding:10px 11px;font:800 12.5px/1.35 'Nunito';color:#fff`)}>
          {detail}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add a temporary HoloSlab3D module for integration**

Create `yoink/src/components/HoloSlab3D.jsx` with this temporary implementation. Task 5 replaces it with Three.js:

```jsx
import { s } from '../style.js';

export default function HoloSlab3D({ item }) {
  return (
    <div style={s('position:relative;width:210px;height:296px;transform:perspective(760px) rotateY(-10deg) rotateX(6deg);animation:ypulse 3s ease-in-out infinite')}>
      <div style={s('position:absolute;inset:0;border:3px solid #0F0B20;border-radius:30px;background:linear-gradient(135deg,rgba(255,255,255,.86),rgba(169,134,255,.36),rgba(80,240,224,.36));box-shadow:0 32px 70px rgba(0,0,0,.38),inset 0 0 0 11px rgba(255,255,255,.2);overflow:hidden')}>
        {item?.imageUrl && <img src={item.imageUrl} alt={item.name} style={s('width:100%;height:100%;object-fit:cover;display:block')} />}
        <span style={s('position:absolute;inset:0;background:linear-gradient(110deg,transparent 0 34%,rgba(255,255,255,.55) 46%,transparent 58%);mix-blend-mode:screen')} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test and confirm expected partial failure**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: FAIL only on the second test because `HoloSlab3D.jsx` does not yet import Three.js or pointer handlers.

- [ ] **Step 6: Commit viewer shell**

```bash
git add yoink/src/components/HoloTrophyViewer.jsx yoink/src/components/HoloSlab3D.jsx yoink/src/holoTrophyViewer.test.js
git commit -m "Add Holo trophy viewer shell"
```

## Task 5: Add Three.js Procedural Holo Slab

**Files:**
- Modify: `yoink/package.json`
- Modify: `yoink/package-lock.json`
- Modify: `yoink/src/components/HoloSlab3D.jsx`

- [ ] **Step 1: Add Three.js dependency**

Run:

```bash
cd yoink
npm install three
```

Expected: `package.json` includes `"three"` in `dependencies`, and `package-lock.json` updates.

- [ ] **Step 2: Replace HoloSlab3D with Three.js scene**

Replace `yoink/src/components/HoloSlab3D.jsx` with:

```jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { s } from '../style.js';

function colorFor(item, fallback) {
  const hue = item?.hue;
  return {
    pink: 0xff7dda,
    purple: 0xa986ff,
    yellow: 0xffdf72,
    teal: 0x66f0df,
    coral: 0xff9a72,
    blue: 0x7fc8ff,
  }[hue] ?? fallback;
}

function makeRoundedBox(width, height, depth, radius, smoothness = 5) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: radius / smoothness, bevelThickness: depth / 4, bevelSegments: 4 });
}

function makeStarShape(radius = 0.42) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3 });
}

export default function HoloSlab3D({ item }) {
  const mountRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, dragging: false });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const width = mount.clientWidth || 260;
    const height = mount.clientHeight || 330;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.dataset.testid = 'holo-slab-canvas';
    renderer.domElement.setAttribute('aria-label', `${item?.name ?? 'Holo slab'} 3D trophy viewer`);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const caseMaterial = new THREE.MeshPhysicalMaterial({
      color: colorFor(item, 0xa986ff),
      transparent: true,
      opacity: 0.58,
      roughness: 0.18,
      metalness: 0.08,
      transmission: 0.28,
      thickness: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const darkLine = new THREE.MeshBasicMaterial({ color: 0x0f0b20 });
    const foilUniform = { value: 0 };
    const foilMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7c5cff,
      roughness: 0.16,
      metalness: 0.65,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      emissive: new THREE.Color(0x35245f),
      emissiveIntensity: 0.18,
    });
    const iconMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff7dda,
      roughness: 0.2,
      metalness: 0.25,
      clearcoat: 1,
      emissive: new THREE.Color(0xffb84d),
      emissiveIntensity: 0.12,
    });

    const back = new THREE.Mesh(makeRoundedBox(2.35, 3.35, 0.18, 0.2), darkLine);
    back.position.z = -0.15;
    group.add(back);

    const slab = new THREE.Mesh(makeRoundedBox(2.2, 3.2, 0.24, 0.22), caseMaterial);
    slab.position.z = -0.05;
    group.add(slab);

    const foil = new THREE.Mesh(makeRoundedBox(1.55, 2.25, 0.05, 0.14), foilMaterial);
    foil.position.z = 0.15;
    group.add(foil);

    const icon = new THREE.Mesh(makeStarShape(0.48), iconMaterial);
    icon.position.set(0, 0.1, 0.24);
    group.add(icon);

    const cornerGeometry = makeRoundedBox(0.55, 0.42, 0.16, 0.12);
    for (const [x, y] of [[-.88, 1.32], [.88, 1.32], [-.88, -1.32], [.88, -1.32]]) {
      const corner = new THREE.Mesh(cornerGeometry, caseMaterial);
      corner.position.set(x, y, 0.2);
      group.add(corner);
    }

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(2.4, 3.2, 5);
    scene.add(key);
    const pink = new THREE.PointLight(0xff7dda, 2.5, 6);
    pink.position.set(-2.2, 1.1, 2.5);
    scene.add(pink);
    const teal = new THREE.PointLight(0x66f0df, 2.2, 6);
    teal.position.set(2.2, -0.9, 2.5);
    scene.add(teal);

    const rotateY = (x) => THREE.MathUtils.clamp(x * 0.55, -0.55, 0.55);
    const rotateX = (y) => THREE.MathUtils.clamp(-y * 0.32, -0.32, 0.32);

    const onPointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      pointerRef.current.dragging = event.buttons === 1;
      foilUniform.value = pointerRef.current.x;
    };
    const onPointerLeave = () => {
      pointerRef.current.dragging = false;
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    let frame = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const targetY = rotateY(pointerRef.current.x) + (prefersReduced ? 0 : Math.sin(Date.now() / 2400) * 0.045);
      const targetX = rotateX(pointerRef.current.y);
      group.rotation.y += (targetY - group.rotation.y) * 0.12;
      group.rotation.x += (targetX - group.rotation.x) * 0.12;
      foilMaterial.color.setHSL((0.76 + pointerRef.current.x * 0.12 + 1) % 1, 0.88, 0.62);
      icon.rotation.z += prefersReduced ? 0 : 0.003;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nextWidth = mount.clientWidth || width;
      const nextHeight = mount.clientHeight || height;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.dispose();
      cornerGeometry.dispose();
      mount.replaceChildren();
    };
  }, [item]);

  return (
    <div style={s('position:relative;width:min(78vw,280px);height:min(92vw,360px);display:flex;align-items:center;justify-content:center')}>
      <div ref={mountRef} style={s('position:absolute;inset:0;touch-action:none;cursor:grab')} />
      <div style={s('position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:180px;height:34px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.34),transparent 70%);pointer-events:none')} />
    </div>
  );
}
```

- [ ] **Step 3: Run viewer tests**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
cd yoink
npm run build
```

Expected: PASS and Vite emits `dist/`.

- [ ] **Step 5: Commit**

```bash
git add yoink/package.json yoink/package-lock.json yoink/src/components/HoloSlab3D.jsx
git commit -m "Add Three.js Holo slab trophy renderer"
```

## Task 6: Full Flow Verification And Cleanup

**Files:**
- No source edits in this task. If a verification command fails, stop and use `superpowers:systematic-debugging` before changing files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd yoink
npm test -- src/appFlow.test.js src/components/YoinkNav.test.js src/accountScreen.test.js src/appShell.test.js src/pocketItems.test.js src/pocketScreen.test.js src/holoTrophyViewer.test.js src/marketRenderAssets.test.js server/store.test.js
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
cd yoink
npm test
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
cd yoink
npm run build
```

Expected: PASS.

- [ ] **Step 4: Manual local verification**

Run:

```bash
cd yoink
npm run dev
```

Open the Vite URL. Use a Holo Finds item from the market, place an order, wait until the accelerated tracker reaches delivered, then open Pocket. Confirm:

- Bottom nav says `Pocket`, not `Watching`.
- Pocket empty state appears before any delivered Holo item.
- Delivered Holo item appears on the shelf after delivery.
- Tapping the shelf item opens Trophy Viewer.
- Dragging over the slab rotates it.
- Pointer movement changes the foil color/shimmer.
- Hotspot chips change the metadata text.
- Close returns to the shelf with the same selected item centered.
- Browser console has no WebGL, asset, or React errors.

- [ ] **Step 5: Confirm verification state**

Run:

```bash
git status --short
```

Expected: only intentional uncommitted user work remains. Do not create an empty commit for verification.
