import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DROP_BGS, FAMILIES, RARITIES, RARITY_META,
  artPromptFor, dropBatch2, dropCatalog, dropHeroes,
} from './dropCatalog.js';

test('catalog ids and names are unique', () => {
  const ids = new Set(dropCatalog.map((it) => it.id));
  const names = new Set(dropCatalog.map((it) => it.name));
  assert.equal(ids.size, dropCatalog.length);
  assert.equal(names.size, dropCatalog.length);
});

test('every item has a valid family, rarity, and backdrop', () => {
  for (const it of dropCatalog) {
    assert.ok(FAMILIES.includes(it.family), `${it.id} family`);
    assert.ok(RARITIES.includes(it.rarity), `${it.id} rarity`);
    assert.ok(DROP_BGS[it.bg], `${it.id} backdrop`);
    assert.ok(it.motif.length > 10, `${it.id} has a real motif`);
    assert.ok(it.emoji, `${it.id} has a placeholder emoji`);
  }
});

test('mint counts and prices sit inside their rarity band', () => {
  for (const it of dropCatalog) {
    const meta = RARITY_META[it.rarity];
    assert.ok(it.made >= meta.made[0] && it.made <= meta.made[1], `${it.id} made ${it.made}`);
    assert.ok(it.price >= meta.price[0] && it.price <= meta.price[1], `${it.id} price ${it.price}`);
  }
});

test('one-offs are truly one of one', () => {
  const oneOffs = dropCatalog.filter((it) => it.rarity === 'One-Off');
  assert.ok(oneOffs.length >= 2);
  for (const it of oneOffs) assert.equal(it.made, 1);
});

test('the 16 hero collectibles from the art pack are present verbatim', () => {
  assert.equal(dropHeroes.length, 16);
  const byName = new Map(dropHeroes.map((it) => [it.name, it]));
  assert.equal(byName.get('Bubble CRT').made, 40);
  assert.equal(byName.get('Bubble CRT').rarity, 'Rare');
  assert.equal(byName.get('Glimmer Ticket Relic').rarity, 'One-Off');
  assert.equal(byName.get('Mochi Blob').made, 200);
  assert.equal(byName.get('Tiny Desk Dino').made, 16);
  assert.equal(byName.get('Crinkle Pack Mascot').rarity, 'One-Off');
});

test('batch 2 lands in the requested 50-70 range and covers every family', () => {
  assert.ok(dropBatch2.length >= 50 && dropBatch2.length <= 70, `got ${dropBatch2.length}`);
  for (const family of FAMILIES) {
    assert.ok(dropBatch2.filter((it) => it.family === family).length >= 12, family);
  }
});

test('art prompts carry the house style and holo rules', () => {
  for (const it of dropCatalog) {
    const prompt = artPromptFor(it);
    assert.ok(prompt.includes('chibi 3D collectible'), it.id);
    assert.ok(prompt.includes(`pastel ${it.bg} studio backdrop`), it.id);
    const wantsHolo = it.family === 'Holo Finds' || it.rarity === 'Ultra Rare' || it.rarity === 'One-Off';
    assert.equal(prompt.includes('holographic'), wantsHolo, `${it.id} holo rule`);
  }
});
