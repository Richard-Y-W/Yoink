# Codex Usage Drop Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a no-API drop-art pipeline that prepares 400 Yoink render jobs for Codex usage-based image generation.

**Architecture:** Add a focused Node ESM module under `yoink-drop-art/tools/` with pure helpers and a CLI. The module expands the catalog, writes prompts/jobs/status/contact sheets, and syncs approved renders into the current app asset directory without calling image APIs.

**Tech Stack:** Node.js ESM, built-in `node:test`, JSON files, static HTML contact sheet, existing Yoink Vite app tests.

---

### Task 1: Pipeline Test Coverage

**Files:**
- Create: `yoink/src/dropArtPipeline.test.js`
- Create later: `yoink-drop-art/tools/codex-usage-pipeline.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildCatalogToTarget,
  buildCodexJobs,
  promptForItem,
  syncAppRenders,
} from '../../yoink-drop-art/tools/codex-usage-pipeline.mjs';

const baseCatalog = {
  pack: 'yoink-drop-art',
  version: '0.2.0',
  style: { name: 'Yoink cartoon collectible shop object', rarityRules: {} },
  items: [
    {
      id: 'pocket-tech-bubble-crt',
      name: 'Bubble CRT',
      family: 'Pocket Tech',
      rarity: 'Rare',
      editionSize: 40,
      dropRole: 'hero',
      price: 420,
      traits: ['rounded CRT shell', 'grape screen glow'],
      renderFile: 'renders/pocket-tech-bubble-crt.png',
      promptFile: 'prompts/pocket-tech-bubble-crt.txt',
    },
  ],
};

test('catalog expansion preserves existing items and reaches the requested target', () => {
  const expanded = buildCatalogToTarget(baseCatalog, 400);
  assert.equal(expanded.items.length, 400);
  assert.equal(expanded.items[0].id, 'pocket-tech-bubble-crt');
  assert.equal(new Set(expanded.items.map((item) => item.id)).size, 400);
  assert.ok(expanded.items[399].renderFile.endsWith('.png'));
  assert.ok(expanded.items[399].promptFile.endsWith('.txt'));
});

test('prompts carry Yoink style constraints without API instructions', () => {
  const prompt = promptForItem(buildCatalogToTarget(baseCatalog, 2).items[1]);
  assert.match(prompt, /high-polish cartoon 3D toy render/);
  assert.match(prompt, /thick dark outlines/);
  assert.match(prompt, /no real logos/i);
  assert.match(prompt, /no readable text/i);
  assert.doesNotMatch(prompt, /OPENAI_API_KEY|GEMINI_API_KEY|https:\/\/api/i);
});

test('jobs derive generated status from render files and respect manual overrides', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'yoink-drop-art-'));
  mkdirSync(path.join(root, 'renders'), { recursive: true });
  writeFileSync(path.join(root, 'renders', 'pocket-tech-bubble-crt.png'), 'png');
  const catalog = buildCatalogToTarget(baseCatalog, 3);
  const jobs = buildCodexJobs(catalog, root, {
    'pocket-tech-bubble-crt': 'approved',
    [catalog.items[1].id]: 'needs-regen',
  });
  assert.equal(jobs[0].status, 'approved');
  assert.equal(jobs[1].status, 'needs-regen');
  assert.equal(jobs[2].status, 'pending');
  assert.equal(jobs[0].target, 'yoink-drop-art/renders/pocket-tech-bubble-crt.png');
});

test('syncAppRenders copies only generated or approved render jobs', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'yoink-drop-art-'));
  const appPublic = path.join(root, 'public', 'yoink-items');
  mkdirSync(path.join(root, 'renders'), { recursive: true });
  writeFileSync(path.join(root, 'renders', 'pocket-tech-bubble-crt.png'), 'png-a');
  const catalog = buildCatalogToTarget(baseCatalog, 2);
  const jobs = buildCodexJobs(catalog, root, { 'pocket-tech-bubble-crt': 'approved' });
  const copied = syncAppRenders(jobs, root, appPublic);
  assert.deepEqual(copied, ['pocket-tech-bubble-crt.png']);
  assert.equal(readFileSync(path.join(appPublic, 'pocket-tech-bubble-crt.png'), 'utf8'), 'png-a');
  assert.equal(existsSync(path.join(appPublic, `${catalog.items[1].id}.png`)), false);
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- dropArtPipeline`

Expected: FAIL because `yoink-drop-art/tools/codex-usage-pipeline.mjs` does not exist.

### Task 2: Pipeline Module And CLI

**Files:**
- Create: `yoink-drop-art/tools/codex-usage-pipeline.mjs`

- [ ] **Step 1: Implement the exported helpers**

The module must export `buildCatalogToTarget`, `promptForItem`, `buildCodexJobs`, and `syncAppRenders`. `buildCatalogToTarget` should preserve existing items, then append deterministic items across Pocket Tech, Holo Finds, Desk Pets, and Snack Relics until the target is reached.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- dropArtPipeline`

Expected: PASS for the four pipeline tests.

### Task 3: CLI Commands And Generated Files

**Files:**
- Modify: `yoink-drop-art/tools/codex-usage-pipeline.mjs`
- Modify/generated: `yoink-drop-art/item-catalog.json`
- Create/generated: `yoink-drop-art/codex-render-jobs.json`
- Create/generated: `yoink-drop-art/codex-render-status.json`
- Create/generated: `yoink-drop-art/codex-contact-sheet.html`
- Create/generated: `yoink-drop-art/prompts/*.txt`

- [ ] **Step 1: Add CLI commands**

Commands:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs expand --target 400
node yoink-drop-art/tools/codex-usage-pipeline.mjs jobs
node yoink-drop-art/tools/codex-usage-pipeline.mjs next
node yoink-drop-art/tools/codex-usage-pipeline.mjs sheet
node yoink-drop-art/tools/codex-usage-pipeline.mjs sync-app
```

- [ ] **Step 2: Generate the catalog and job files**

Run:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs expand --target 400
node yoink-drop-art/tools/codex-usage-pipeline.mjs jobs
node yoink-drop-art/tools/codex-usage-pipeline.mjs sheet
```

Expected:

- `item-catalog.json` contains exactly 400 items.
- `codex-render-jobs.json` contains exactly 400 jobs.
- Existing 50 renders show as generated unless overridden.
- Missing renders show as pending.

### Task 4: Verification And Publish

**Files:**
- All files changed by Tasks 1-3.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- dropArtPipeline`

Expected: PASS.

- [ ] **Step 2: Run full app tests**

Run: `npm test`

Expected: PASS with the existing skipped test unchanged.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit and push**

Run:

```bash
git status -sb
git add docs/superpowers/specs/2026-07-08-codex-usage-drop-pipeline-design.md docs/superpowers/plans/2026-07-08-codex-usage-drop-pipeline.md yoink/src/dropArtPipeline.test.js yoink-drop-art/tools/codex-usage-pipeline.mjs yoink-drop-art/item-catalog.json yoink-drop-art/codex-render-jobs.json yoink-drop-art/codex-render-status.json yoink-drop-art/codex-contact-sheet.html yoink-drop-art/prompts
git commit -m "Add Codex usage drop render pipeline"
git push -u origin codex/usage-drop-pipeline
```

Expected: branch is pushed with the no-API pipeline and 400 prepared render jobs.
