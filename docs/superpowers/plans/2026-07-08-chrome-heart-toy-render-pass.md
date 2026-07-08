# Chrome Heart Toy Render Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the sculpted Chrome Heart trophy card so it keeps 3D/360 interaction but reads like the original cute high-polish cartoon toy render instead of an engineered model.

**Architecture:** Keep `HoloSlab3D` as the shared Three.js viewer shell. Retune the Chrome Heart preset internals by renaming and reshaping the visual primitives around puffy, gumdrop, jelly, pastel, mirrored-toy-back language, with source-contract tests guarding against a return to circuit/serial/technical details.

**Tech Stack:** React 18, Vite, Node `--test`, Three.js, existing inline style helper `s()`.

---

## File Structure

- Modify `yoink/src/holoTrophyViewer.test.js`: update source-contract assertions for the toy-render art direction.
- Modify `yoink/src/components/HoloSlab3D.jsx`: retune mesh helper names, materials, shapes, and front/back details.

### Task 1: Lock The Toy Render Contract

**Files:**
- Modify: `yoink/src/holoTrophyViewer.test.js`

- [x] **Step 1: Write the failing test**

Replace the sculpted-layer expectations with assertions that require toy-render primitives and reject engineered reverse details:

```js
assert.match(slabSource, /createChromeHeartToyCard/);
assert.match(slabSource, /createPuffyHeartShape/);
assert.match(slabSource, /createSoftVinylMaterial/);
assert.match(slabSource, /gumdropCornerGuards/);
assert.match(slabSource, /jellyCaseRails/);
assert.match(slabSource, /pastelStickerSparkles/);
assert.match(slabSource, /frontToyCardFace/);
assert.match(slabSource, /mirroredToyBack/);
assert.match(slabSource, /backToyHeart/);
assert.doesNotMatch(slabSource, /rainbowCircuitFrame/);
assert.doesNotMatch(slabSource, /reverseSerialDots/);
assert.doesNotMatch(slabSource, /serialDot/);
```

- [x] **Step 2: Run RED**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: FAIL because the current preset is still named `createChromeHeartSculptedCard` and contains `rainbowCircuitFrame`/`reverseSerialDots`.

### Task 2: Rework The Chrome Heart Preset

**Files:**
- Modify: `yoink/src/components/HoloSlab3D.jsx`

- [x] **Step 1: Rename and retune primitives**

Use these production names:

```js
createChromeHeartToyCard
createPuffyHeartShape
createSoftVinylMaterial
createJellyCaseRails
createGumdropCornerGuards
```

- [x] **Step 2: Replace engineered details**

Remove `rainbowCircuitFrame`, `reverseSerialDots`, and `serialDot` naming/details. Replace them with wider pastel toy bands, sticker sparkles, puffy heart marks, and a `mirroredToyBack` group that mirrors the cute front language.

- [x] **Step 3: Keep interaction intact**

Do not change pointer drag, `spinRotation`, reduced motion, `data-spin-axis="360-yaw"`, cleanup, or the Trophy Viewer shell.

- [x] **Step 4: Run GREEN**

Run:

```bash
cd yoink
npm test -- src/holoTrophyViewer.test.js
```

Expected: PASS.

### Task 3: Visual And Release Verification

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

Expected: Vite exits 0. Existing lazy Three.js chunk warning is acceptable.

- [x] **Step 3: Browser-check front and back**

Use the existing `/private/tmp/yoink-sculpted-card-visual-check.mjs` browser script and inspect `/private/tmp/yoink-sculpted-card-front.png` and `/private/tmp/yoink-sculpted-card-spun.png`. The front should feel puffy/cute/pastel, and the back should mirror the front’s toy language rather than looking technical.
