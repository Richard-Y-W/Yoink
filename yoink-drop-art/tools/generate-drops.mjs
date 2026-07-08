// Batch-generate the Drop Art Pack renders that are still missing.
//
// Usage (from the yoink/ directory):
//   node tools/generate-drops.mjs --dry-run          # list what would be generated
//   node tools/generate-drops.mjs                    # generate every missing render
//   node tools/generate-drops.mjs --only id1,id2     # regenerate specific items
//   node tools/generate-drops.mjs --limit 4          # small style-check run first
//   node tools/generate-drops.mjs sheet              # write the review contact sheet
//
// Provider is picked from whichever key is set (or forced with --provider):
//   OPENAI_API_KEY  -> gpt-image-1        (--quality high|medium, default high)
//   GEMINI_API_KEY  -> gemini-2.5-flash-image
// Generate the whole remaining set with ONE provider and one quality setting
// so the pack reads as a single artist (see docs/yoink-drop-art-style-guide.md).

import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dropCatalog, artPromptFor } from '../src/dropCatalog.js';

const DROPS_DIR = fileURLToPath(new URL('../src/assets/drops/', import.meta.url));
const SHEET_PATH = fileURLToPath(new URL('../../docs/drop-render-batches/contact-sheet.html', import.meta.url));

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? true) : undefined;
};

const CONCURRENCY = Number(flag('concurrency') ?? 4);
const QUALITY = flag('quality') ?? 'high';
const LIMIT = flag('limit') ? Number(flag('limit')) : Infinity;
const ONLY = flag('only') ? String(flag('only')).split(',').map((s) => s.trim()) : null;
const DRY = args.includes('--dry-run');

function haveRender(id) {
  return existsSync(path.join(DROPS_DIR, `${id}.png`));
}

function pickProvider() {
  const forced = flag('provider');
  if (forced) return forced;
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

async function generateOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', quality: QUALITY }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('openai: no image in response');
  return Buffer.from(b64, 'base64');
}

async function generateGemini(prompt) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) throw new Error('gemini: no image in response');
  return Buffer.from(img.inlineData.data, 'base64');
}

async function generateWithRetry(provider, item) {
  const prompt = artPromptFor(item);
  const gen = provider === 'openai' ? generateOpenAI : generateGemini;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await gen(prompt);
    } catch (err) {
      lastErr = err;
      const wait = attempt * 5000;
      console.warn(`  retry ${attempt}/3 for ${item.id} in ${wait / 1000}s — ${err.message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function writeContactSheet() {
  const rows = dropCatalog
    .map((it) => {
      const has = haveRender(it.id);
      const img = has
        ? `<img src="../../yoink/src/assets/drops/${it.id}.png" loading="lazy" alt="${it.name}">`
        : '<div class="missing">missing</div>';
      return `<figure class="${has ? '' : 'gap'}">${img}<figcaption><b>${it.name}</b><br>${it.family} · ${it.rarity} · ${it.made} made<br><code>${it.id}</code></figcaption></figure>`;
    })
    .join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>Yoink drop renders — contact sheet</title>
<style>
  body{font-family:system-ui;background:#faf7ff;margin:24px}
  main{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
  figure{margin:0;background:#fff;border-radius:12px;padding:8px;box-shadow:0 1px 4px #0002}
  img{width:100%;border-radius:8px;display:block}
  .missing{aspect-ratio:1;display:grid;place-items:center;background:#eee;border-radius:8px;color:#999}
  figcaption{font-size:12px;padding-top:6px;line-height:1.5}
  .gap{outline:2px dashed #e89b2e}
</style>
<h1>Drop Art Pack — ${dropCatalog.filter((it) => haveRender(it.id)).length}/${dropCatalog.length} rendered</h1>
<p>Off-style checklist: no kawaii face, dark/photo background, realistic instead of toy-like, visible text.
Regenerate misses with <code>node tools/generate-drops.mjs --only id1,id2</code>.</p>
<main>${rows}</main>`;
  writeFileSync(SHEET_PATH, html);
  console.log(`contact sheet -> ${SHEET_PATH}`);
}

async function main() {
  mkdirSync(DROPS_DIR, { recursive: true });

  if (args.includes('sheet')) {
    writeContactSheet();
    return;
  }

  let todo = dropCatalog.filter((it) => (ONLY ? ONLY.includes(it.id) : !haveRender(it.id)));
  todo = todo.slice(0, LIMIT);

  if (todo.length === 0) {
    console.log('Nothing to generate — every catalog item has a render.');
    return;
  }
  console.log(`${todo.length} render(s) to generate:`);
  for (const it of todo) console.log(`  ${it.id}  (${it.family} · ${it.rarity})`);

  if (DRY) {
    console.log(`\nSample prompt for ${todo[0].id}:\n${artPromptFor(todo[0])}`);
    return;
  }

  const provider = pickProvider();
  if (!provider) {
    console.error('\nNo API key found. Set OPENAI_API_KEY or GEMINI_API_KEY and re-run.');
    process.exit(1);
  }
  console.log(`\nprovider: ${provider}${provider === 'openai' ? ` (quality: ${QUALITY})` : ''}, concurrency: ${CONCURRENCY}\n`);

  const queue = [...todo];
  const failed = [];
  let done = 0;
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const png = await generateWithRetry(provider, item);
        writeFileSync(path.join(DROPS_DIR, `${item.id}.png`), png);
        console.log(`[${++done}/${todo.length}] ${item.id}.png`);
      } catch (err) {
        failed.push(item.id);
        console.error(`FAILED ${item.id}: ${err.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

  writeContactSheet();
  if (failed.length) {
    console.error(`\n${failed.length} failed — re-run with:\n  node tools/generate-drops.mjs --only ${failed.join(',')}`);
    process.exit(1);
  }
  console.log('\nAll done. Open the contact sheet and style-check before committing.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
