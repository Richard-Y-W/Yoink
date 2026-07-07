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
