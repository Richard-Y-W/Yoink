# High Detail Chrome Heart 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bulky Chrome Heart trophy render with a thinner, high-detail true-3D card that more closely matches the generated 2D Chrome Heart Foil Card.

**Architecture:** Keep the existing `HoloSlab3D` Three.js viewer, 360 pointer interaction, and Pocket trophy shell. Retune only the Chrome Heart preset internals: slimmer slab hardware, high-detail foil shader, layered card-face geometry, improved chrome heart sculpt, and dense small decorative details.

**Tech Stack:** React 18, Vite, Three.js, Node `--test`, existing browser screenshot script.

---

## File Structure

- Modify `yoink/src/holoTrophyViewer.test.js`: add a source-contract test for the high-detail 3D likeness pass.
- Modify `yoink/src/components/HoloSlab3D.jsx`: update helper functions, materials, geometry groups, and animation lookups.

### Task 1: Lock The High-Detail 3D Contract

**Files:**
- Modify: `yoink/src/holoTrophyViewer.test.js`

- [x] **Step 1: Write the failing test**

Add assertions requiring these production concepts in `HoloSlab3D.jsx`:

```js
assert.match(slabSource, /createHighDetailChromeHeartCard/);
assert.match(slabSource, /createReferenceHeartShape/);
assert.match(slabSource, /createIridescentChromeMaterial/);
assert.match(slabSource, /createFoilGlitterMaterial/);
assert.match(slabSource, /thinCardCore/);
assert.match(slabSource, /nestedIridescentFrame/);
assert.match(slabSource, /microGlitterField/);
assert.match(slabSource, /chromeHeartInnerGlow/);
assert.match(slabSource, /heartEyeHighlight/);
assert.match(slabSource, /slimCornerProtectors/);
assert.match(slabSource, /referenceBadgeDetails/);
assert.match(slabSource, /referenceBackDetails/);
assert.doesNotMatch(slabSource, /gumdropCornerGuards/);
assert.doesNotMatch(slabSource, /frontCandyFrame/);
assert.doesNotMatch(slabSource, /backCandyFrame/);
```

- [x] **Step 2: Run RED**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: FAIL because the current implementation still uses `createChromeHeartToyCard`, `gumdropCornerGuards`, and `frontCandyFrame`.

### Task 2: Build The Thinner High-Detail 3D Card

**Files:**
- Modify: `yoink/src/components/HoloSlab3D.jsx`

- [x] **Step 1: Rename the preset**

Replace `createChromeHeartToyCard` with `createHighDetailChromeHeartCard`, and make `cardPresetFor()` return the new function.

- [x] **Step 2: Replace the heart shape**

Replace `createPuffyHeartShape` with `createReferenceHeartShape`. The shape should be wider at the shoulders, pinched at the top center, and end in a deeper but soft bottom point.

- [x] **Step 3: Deepen material language**

Add `createIridescentChromeMaterial` for the heart and chrome rims. Add `createFoilGlitterMaterial` by expanding the foil shader with layered peach/magenta/violet/cyan/gold color, glitter specks, and cleaner diagonal shimmer.

- [x] **Step 4: Slim the slab hardware**

Replace `createJellyCaseRails` and `createGumdropCornerGuards` with `createSlimGlassRails` and `createSlimCornerProtectors`. Reduce depth/width, keep curved pink protectors and glossy highlight grooves.

- [x] **Step 5: Add reference-like card details**

Add these named groups on the front:

```js
thinCardCore
nestedIridescentFrame
microGlitterField
referenceBadgeDetails
chromeHeartInnerGlow
heartEyeHighlight
```

Keep the existing `raisedChromeHeart`, `pastelStickerSparkles`, `bottomBadgePlate`, and `mirroredToyBack` compatibility names unless a test is updated.

- [x] **Step 6: Mirror the back**

Add `referenceBackDetails` inside `mirroredToyBack`, using thinner nested borders, small sparkles, and a smaller chrome heart.

- [x] **Step 7: Run GREEN**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: PASS.

### Task 3: Verify And Publish

**Files:**
- No planned production changes unless verification exposes a defect.

- [x] **Step 1: Run full tests**

Run:

```bash
cd yoink
npm test
```

Expected: all tests pass.

- [x] **Step 2: Run production build**

Run:

```bash
cd yoink
npm run build
```

Expected: build exits 0. The existing lazy Three.js chunk warning is acceptable.

- [x] **Step 3: Browser-check the 3D viewer**

Run:

```bash
node /private/tmp/yoink-sculpted-card-visual-check.mjs
```

Expected: script reports one WebGL canvas, `data-spin-axis="360-yaw"`, no console issues, and writes updated front/spun screenshots.

- [x] **Step 4: Commit and push**

Run:

```bash
git add docs/superpowers/plans/2026-07-08-high-detail-chrome-heart-3d.md yoink/src/components/HoloSlab3D.jsx yoink/src/holoTrophyViewer.test.js
git commit -m "Refine Chrome Heart 3D card detail"
git push
```
