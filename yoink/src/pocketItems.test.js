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

test('Pocket resolver falls back to numeric unit price from catalog metadata', () => {
  const owned = makePocketHoloItems([
    { id: 'drop-holo-finds-prism-star-foil-card', title: 'Prism Star Foil Card', quantity: 1 },
  ]);

  assert.equal(owned.length, 1);
  assert.equal(owned[0].unitPrice, 1400);
});

test('Pocket resolver parses comma-formatted collection unit prices', () => {
  const owned = makePocketHoloItems([
    {
      id: 'drop-holo-finds-prism-star-foil-card',
      title: 'Prism Star Foil Card',
      unitPrice: '1,400',
      quantity: 1,
    },
  ]);

  assert.equal(owned.length, 1);
  assert.equal(owned[0].unitPrice, 1400);
});
