import assert from 'node:assert/strict';
import test from 'node:test';
import { ART_HUES, ART_STYLES, ITEM_ART, artStageBackground, resolveArtKind } from './itemArt.js';
import { makeMarketFeed, MARKET_PAGE_SIZE, dropItems, pocketItems } from './data.js';

test('every art definition is renderable: known hue, silhouette, details', () => {
  for (const [kind, art] of Object.entries(ITEM_ART)) {
    assert.ok(ART_HUES[art.hue], `${kind} hue exists`);
    assert.ok(ART_HUES[art.hue2 ?? art.hue], `${kind} accent hue exists`);
    assert.ok(ART_HUES[art.bg], `${kind} sticker backdrop hue exists`);
    assert.ok(art.sil.length > 0, `${kind} has a silhouette`);
  }
});

test('the full generated market feed resolves to drawn art, no stripes left', () => {
  const feed = makeMarketFeed(0, MARKET_PAGE_SIZE * 2);
  for (const item of feed) {
    const kind = resolveArtKind(item);
    assert.ok(kind, `feed item "${item.img}" has art`);
    assert.ok(ITEM_ART[kind], `feed item "${item.img}" maps to a real definition`);
  }
});

test('pocket shop and drop catalog items resolve to art', () => {
  for (const item of [...pocketItems, ...dropItems]) {
    assert.ok(ITEM_ART[resolveArtKind(item)], `"${item.name}" has art`);
  }
});

test('unknown items fall back to null so stripes still render', () => {
  assert.equal(resolveArtKind({ name: 'Mystery Thing', img: 'mystery' }), null);
  assert.equal(resolveArtKind(null), null);
});

test('each art style produces a distinct stage background', () => {
  const backgrounds = ART_STYLES.map((artStyle) => artStageBackground(artStyle, 'duck'));
  assert.equal(new Set(backgrounds).size, ART_STYLES.length);
});
