# Chrome Heart Sculpted Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat image-mapped Chrome Heart trophy card with a sculpted, layered Three.js card that recreates the render's pink guards, transparent rails, holo face, raised chrome heart, sparkles, and badge details.

**Architecture:** Keep `HoloSlab3D` as the shared viewer shell for camera, lighting, animation, 360 drag spin, resize, and cleanup. Add a Chrome Heart-specific preset inside the Three.js scene using named helper builders so the next foil cards can become presets that reuse the same layer primitives.

**Tech Stack:** React 18, Vite, Node `--test`, Three.js, existing inline style helper `s()`.

---

## File Structure

- Modify `yoink/src/holoTrophyViewer.test.js`: require sculpted Chrome Heart preset helpers, layered mesh names, and 360 spin copy.
- Modify `yoink/src/components/HoloSlab3D.jsx`: replace the flat texture art plane with a procedural Chrome Heart 3D preset.
- Modify `yoink/src/components/HoloTrophyViewer.jsx`: keep the Trophy Viewer shell and interaction copy aligned to the 360 sculpted-object behavior.

## Task 1: Lock The Sculpted Preset Contract

**Files:**
- Modify: `yoink/src/holoTrophyViewer.test.js`

- [ ] **Step 1: Write the failing test**

Add source-contract assertions requiring:

```js
assert.match(slabSource, /createChromeHeartSculptedCard/);
assert.match(slabSource, /createHeartShape/);
assert.match(slabSource, /createSparkleShape/);
assert.match(slabSource, /chromeHeartPreset/);
assert.match(slabSource, /pinkCornerGuards/);
assert.match(slabSource, /transparentCaseRails/);
assert.match(slabSource, /raisedChromeHeart/);
assert.match(slabSource, /holoCardFace/);
assert.match(slabSource, /bottomBadgePlate/);
assert.doesNotMatch(slabSource, /new THREE\.TextureLoader/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: FAIL because the current viewer uses `TextureLoader` and does not expose the sculpted Chrome Heart preset contract.

## Task 2: Build The Sculpted Chrome Heart Card

**Files:**
- Modify: `yoink/src/components/HoloSlab3D.jsx`

- [ ] **Step 1: Implement the preset helpers**

Add small helpers for heart geometry, sparkle geometry, rounded plates, rails, corner guards, face pieces, and badge pieces. Keep helpers local to `HoloSlab3D.jsx` so the first preset is easy to iterate visually.

- [ ] **Step 2: Replace the flat art planes**

Remove the real-image `TextureLoader` path, `frameArtTexture`, and square art planes. Add `createChromeHeartSculptedCard({ palette, name, rarityLabel, traitLine })` and attach the returned group to `slabGroup`.

- [ ] **Step 3: Preserve interaction behavior**

Keep pointerdown/pointermove/pointerup drag accumulation through `spinRotation`, `data-spin-axis="360-yaw"`, reduced-motion behavior, shimmer shader animation, resize cleanup, and scene disposal.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: PASS.

## Task 3: Verify Build And Visual Behavior

**Files:**
- No production file changes unless verification exposes a defect.

- [ ] **Step 1: Run full tests**

Run:

```bash
cd yoink
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
cd yoink
npm run build
```

Expected: Vite build exits 0. Existing chunk-size warnings are acceptable.

- [ ] **Step 3: Browser-check the viewer**

Open the running local app, force a Pocket collection item for Chrome Heart, open the Trophy Viewer, drag-spin the object, and confirm the front and rear angles show a sculpted 3D card rather than a pasted flat image.
