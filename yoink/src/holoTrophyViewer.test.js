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
  assert.match(viewerSource, /Spin 360/);
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

test('Holo slab builds the Chrome Heart card as sculpted 3D layers', () => {
  assert.match(slabSource, /createChromeHeartSculptedCard/);
  assert.match(slabSource, /createHeartShape/);
  assert.match(slabSource, /createSparkleShape/);
  assert.match(slabSource, /chromeHeartPreset/);
  assert.match(slabSource, /pinkCornerGuards/);
  assert.match(slabSource, /transparentCaseRails/);
  assert.match(slabSource, /raisedChromeHeart/);
  assert.match(slabSource, /holoCardFace/);
  assert.match(slabSource, /bottomBadgePlate/);
  assert.match(slabSource, /sparkleRelief/);
  assert.match(slabSource, /reverseHoloBack/);
  assert.match(slabSource, /reverseSerialDots/);
  assert.doesNotMatch(slabSource, /new THREE\.TextureLoader/);
  assert.doesNotMatch(slabSource, /createLabelTexture/);
});

test('Holo trophy viewer supports full 360 spin instead of a small yaw clamp', () => {
  assert.match(viewerSource, /Spin 360/);
  assert.match(slabSource, /data-spin-axis="360-yaw"/);
  assert.match(slabSource, /pointerdown/);
  assert.match(slabSource, /pointerup/);
  assert.match(slabSource, /spinRotation/);
  assert.doesNotMatch(slabSource, /targetRotation\.y = THREE\.MathUtils\.clamp/);
});
