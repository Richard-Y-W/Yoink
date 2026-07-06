import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseWatchedListings,
  serializeWatchedListings,
  toggleWatchedListing,
  watchedListingIds,
} from './watchedListings.js';

const listing = {
  id: 'f12',
  name: 'Cassette Walkman + 12 tapes',
  price: 640,
  cond: 'Refurbished',
  seller: 'pixelpawn',
  img: 'walkman',
  cta: 'Buy',
};

test('toggleWatchedListing adds and removes the actual market listing', () => {
  const added = toggleWatchedListing([], listing);

  assert.deepEqual(added, [listing]);
  assert.deepEqual(watchedListingIds(added), ['f12']);
  assert.deepEqual(toggleWatchedListing(added, listing), []);
});

test('toggleWatchedListing keeps newest saves first without duplicating ids', () => {
  const first = { ...listing, id: 'f1', name: 'First find' };
  const second = { ...listing, id: 'f2', name: 'Second find' };

  assert.deepEqual(
    toggleWatchedListing(toggleWatchedListing([], first), second).map((item) => item.id),
    ['f2', 'f1'],
  );
});

test('watched listings serialize and restore safely from localStorage text', () => {
  const encoded = serializeWatchedListings([listing]);

  assert.deepEqual(parseWatchedListings(encoded), [listing]);
  assert.deepEqual(parseWatchedListings(''), []);
  assert.deepEqual(parseWatchedListings('{bad json'), []);
  assert.deepEqual(parseWatchedListings(JSON.stringify({ nope: true })), []);
});
