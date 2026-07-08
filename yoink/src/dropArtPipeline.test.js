import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildCatalogToTarget,
  buildCodexJobs,
  copyLatestGeneratedImage,
  promptForItem,
  setRenderStatus,
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

test('copyLatestGeneratedImage finds the newest nested Codex PNG and creates the destination folder', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'yoink-generated-'));
  const destination = path.join(root, 'renders', 'fresh.png');
  const oldDir = path.join(root, 'generated_images', 'old');
  const newDir = path.join(root, 'generated_images', 'new');
  mkdirSync(oldDir, { recursive: true });
  mkdirSync(newDir, { recursive: true });
  writeFileSync(path.join(oldDir, 'old.png'), 'old');
  writeFileSync(path.join(newDir, 'new.png'), 'new');

  const copiedFrom = copyLatestGeneratedImage(destination, path.join(root, 'generated_images'));

  assert.equal(readFileSync(destination, 'utf8'), 'new');
  assert.equal(copiedFrom.endsWith(path.join('new', 'new.png')), true);
});

test('setRenderStatus writes manual status overrides without removing existing decisions', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'yoink-status-'));
  const statusPath = path.join(root, 'codex-render-status.json');

  setRenderStatus('pocket-tech-bubble-crt', 'approved', statusPath);
  setRenderStatus('pocket-tech-mint-game-brick', 'needs-regen', statusPath);

  const status = JSON.parse(readFileSync(statusPath, 'utf8'));
  assert.equal(status['pocket-tech-bubble-crt'], 'approved');
  assert.equal(status['pocket-tech-mint-game-brick'], 'needs-regen');
});
