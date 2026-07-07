import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  try {
    return readFileSync(new URL(path, import.meta.url), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}

const pocketSource = readSource('./screens/Pocket.jsx');
const shelfSource = readSource('./components/PocketShelf.jsx');
const viewerSource = readSource('./components/HoloTrophyViewer.jsx');
const appSource = readSource('./App.jsx');

test('Pocket screen renders the owned Holo shelf flow instead of the old shop grid', () => {
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

test('Pocket shelf centers owned Holo items with carousel trophy controls', () => {
  assert.match(shelfSource, /selectedIndex/);
  assert.match(shelfSource, /rotateY/);
  assert.match(shelfSource, /Open trophy viewer/);
  assert.match(shelfSource, /ownedLabel/);
  assert.match(shelfSource, /editionLabel/);
  assert.match(shelfSource, /animation:ypop/);
});

test('Pocket shelf keeps pop animation off the transformed carousel card', () => {
  const shelfCardStyle = shelfSource.match(/function shelfCardStyle[\s\S]*?\n}\n/)?.[0] ?? '';
  assert.match(shelfCardStyle, /transform:/);
  assert.doesNotMatch(shelfCardStyle, /animation:ypop/);
  assert.match(shelfSource, /activeCardContentStyle/);
});

test('Pocket distinguishes load errors from a truly empty owned shelf', () => {
  assert.match(pocketSource, /loadError/);
  assert.match(pocketSource, /setLoadError/);
  assert.match(pocketSource, /Pocket could not load right now\./);
  assert.match(pocketSource, /Try again/);
  assert.match(pocketSource, /onRetry/);
  assert.match(pocketSource, /data\?\.ok === false/);
});

test('placeholder trophy viewer manages dialog focus without duplicate close labels', () => {
  assert.match(viewerSource, /useEffect/);
  assert.match(viewerSource, /useRef/);
  assert.match(viewerSource, /dialogRef/);
  assert.match(viewerSource, /previousFocusRef/);
  assert.match(viewerSource, /Escape/);
  assert.equal(viewerSource.match(/aria-label="Close trophy viewer"/g)?.length, 1);
});

test('App no longer passes stale shop-era props to Pocket', () => {
  const pocketCall = appSource.match(/<Pocket[\s\S]*?\/>/)?.[0] ?? '';
  assert.doesNotMatch(pocketCall, /streak=/);
  assert.doesNotMatch(pocketCall, /onAddToCart=/);
});
