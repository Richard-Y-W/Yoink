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

const viewerSource = readSource('./components/HoloTrophyViewer.jsx');
const slabSource = readSource('./components/HoloSlab3D.jsx');

test('Holo trophy viewer shell exposes slab, interaction copy, metadata, and close control', () => {
  assert.match(viewerSource, /HoloSlab3D/);
  assert.match(viewerSource, /Drag to rotate/);
  assert.match(viewerSource, /tilt to shimmer/);
  assert.match(viewerSource, /editionLabel/);
  assert.match(viewerSource, /ownedLabel/);
  assert.match(viewerSource, /traits/);
  assert.match(viewerSource, /aria-label="Close trophy viewer"/);
  assert.match(viewerSource, /ULTRA RARE/);
});

test('Holo slab source reserves the Task 5 Three.js interaction hooks', () => {
  assert.match(slabSource, /from 'three'/);
  assert.match(slabSource, /pointermove/);
  assert.match(slabSource, /rotateY/);
  assert.match(slabSource, /foilUniform/);
  assert.match(slabSource, /prefers-reduced-motion/);
  assert.match(slabSource, /canvas/);
});
