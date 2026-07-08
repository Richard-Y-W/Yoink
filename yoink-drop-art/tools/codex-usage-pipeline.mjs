import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ART_ROOT = join(TOOL_DIR, '..');
const REPO_ROOT = join(ART_ROOT, '..');
const CATALOG_PATH = join(ART_ROOT, 'item-catalog.json');
const STATUS_PATH = join(ART_ROOT, 'codex-render-status.json');
const JOBS_PATH = join(ART_ROOT, 'codex-render-jobs.json');
const SHEET_PATH = join(ART_ROOT, 'codex-contact-sheet.html');
const APP_ITEMS_DIR = join(REPO_ROOT, 'yoink', 'public', 'yoink-items');

const FAMILY_DEFS = [
  {
    family: 'Pocket Tech',
    slug: 'pocket-tech',
    subject: 'nostalgic pocket electronics reimagined as soft vinyl desk toys',
    motifs: [
      'game brick',
      'pixel pet cam',
      'mini console',
      'mouse ball',
      'tape deck',
      'pager pal',
      'robo walkie',
      'jelly joystick',
      'boombox',
      'keyboard',
      'dial rotary',
      'disc player',
      'antenna tv',
      'synth keys',
      'projector pod',
      'bubble modem',
      'tiny tablet',
      'capsule scanner',
      'pocket speaker',
      'candy earbuds',
    ],
    traitPool: [
      'rounded tech shell',
      'bubble buttons',
      'soft screen glow',
      'sticker antenna',
      'rubbery feet',
      'lanyard nub',
      'toy speaker grille',
      'chunky side dial',
    ],
  },
  {
    family: 'Holo Finds',
    slug: 'holo-finds',
    subject: 'shiny collectible cards, slabs, tokens, and sticker relics',
    motifs: [
      'foil card',
      'sticker slab',
      'ticket relic',
      'pog stack',
      'prism token',
      'moon badge',
      'star stamp',
      'chrome charm',
      'glimmer pass',
      'holo puck',
      'foil frame',
      'sparkle tab',
      'lucky seal',
      'rainbow chip',
      'display slab',
      'shimmer tag',
      'arcade sticker',
      'bubble crest',
      'plush badge',
      'orbit decal',
    ],
    traitPool: [
      'rounded display slab',
      'foil rim',
      'iridescent corner',
      'floating sticker shape',
      'soft sparkle flecks',
      'clear plastic sleeve',
      'serial-stamp shape',
      'toy chrome edge',
    ],
  },
  {
    family: 'Desk Pets',
    slug: 'desk-pets',
    subject: 'small mascot desk objects with simple faces and soft toy forms',
    motifs: [
      'mochi blob',
      'sleepy star',
      'button sprout',
      'tiny desk dino',
      'pillow pal',
      'button charm',
      'cloud cubby',
      'bean buddy',
      'pebble stack',
      'mini sprout pot',
      'puffy comet',
      'bubble beetle',
      'soft cube',
      'wobble wink',
      'tiny moon',
      'desk dumpling',
      'star seed',
      'jelly leaf',
      'pocket pebble',
      'snug capsule',
    ],
    traitPool: [
      'tiny face',
      'blush cheeks',
      'soft vinyl body',
      'plush rounded corners',
      'small charm loop',
      'button eyes',
      'toy seam detail',
      'sticker belly mark',
    ],
  },
  {
    family: 'Snack Relics',
    slug: 'snack-relics',
    subject: 'capsule-machine treasures, cereal prizes, and tiny vending relics',
    motifs: [
      'rocket prize',
      'capsule ghost',
      'vending ring',
      'crinkle pack',
      'soda tab',
      'gum token',
      'mini spoon',
      'wrapper charm',
      'prize whistle',
      'jelly coin',
      'toy straw',
      'cereal badge',
      'capsule crown',
      'tiny launcher',
      'bubble token',
      'lucky scoop',
      'snack stamp',
      'foil wrapper',
      'vending gem',
      'packet mascot',
    ],
    traitPool: [
      'capsule dome',
      'crimped wrapper edge',
      'toy prize silhouette',
      'glossy plastic shell',
      'tiny mascot face',
      'sticker star',
      'rounded token edge',
      'foil corner detail',
    ],
  },
];

const COLORWAYS = [
  'Mint',
  'Berry',
  'Lemon',
  'Coral',
  'Sky',
  'Grape',
  'Melon',
  'Peach',
  'Teal',
  'Lilac',
  'Bubblegum',
  'Blueberry',
  'Citrus',
  'Sunrise',
  'Cloud',
  'Pebble',
  'Sherbet',
  'Marshmallow',
  'Opal',
  'Starlit',
  'Prism',
  'Taffy',
  'Gummy',
  'Chrome',
  'Dreamy',
];

const ACCENTS = [
  'star',
  'heart',
  'moon',
  'spark',
  'button',
  'bubble',
  'ribbon',
  'jelly',
  'foil',
  'pixel',
  'glow',
  'charm',
];

const RARITY_ORDER = [
  'Common',
  'Common',
  'Common',
  'Common',
  'Uncommon',
  'Uncommon',
  'Uncommon',
  'Rare',
  'Rare',
  'Ultra Rare',
  'Common',
  'Uncommon',
  'Rare',
  'Common',
  'Uncommon',
  'One-Off',
];

const RARITY_META = {
  Common: { editionSize: 180, price: 160, role: 'codex-common' },
  Uncommon: { editionSize: 100, price: 280, role: 'codex-uncommon' },
  Rare: { editionSize: 46, price: 480, role: 'codex-rare' },
  'Ultra Rare': { editionSize: 14, price: 1250, role: 'codex-chase' },
  'One-Off': { editionSize: 1, price: 2200, role: 'codex-one-off' },
};

const RARITY_TREATMENT = {
  Common: 'clean matte toy finish with one clear silhouette and no special particles',
  Uncommon: 'small sticker badge, charm loop, or extra material contrast',
  Rare: 'foil edge, glossy accent, or shiny trim that supports the object',
  'Ultra Rare': 'subtle glow, shimmer rim, or iridescent material while staying readable',
  'One-Off': 'odd colorway with a tiny serial-stamp shape and one unmistakable special trait',
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function uniqueIdFor(base, usedIds) {
  if (!usedIds.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!usedIds.has(candidate)) return candidate;
  }
}

function traitSet(familyDef, color, motif, accent, rarity, ordinal) {
  const pool = familyDef.traitPool;
  const traits = [
    `${color.toLowerCase()} body`,
    `${accent} accent`,
    pool[ordinal % pool.length],
    pool[(ordinal + 3) % pool.length],
  ];
  if (rarity === 'Ultra Rare') traits[3] = 'iridescent chase shimmer';
  if (rarity === 'One-Off') traits[3] = 'tiny serial-stamp shape';
  if (motif.includes('foil') || motif.includes('holo')) traits[2] = 'foil edge detail';
  return [...new Set(traits)].slice(0, 4);
}

function generatedItemAt(ordinal, usedIds) {
  const familyDef = FAMILY_DEFS[ordinal % FAMILY_DEFS.length];
  const motif = familyDef.motifs[Math.floor(ordinal / FAMILY_DEFS.length) % familyDef.motifs.length];
  const color = COLORWAYS[Math.floor(ordinal / FAMILY_DEFS.length) % COLORWAYS.length];
  const accent = ACCENTS[(ordinal + Math.floor(ordinal / 3)) % ACCENTS.length];
  const rarity = RARITY_ORDER[ordinal % RARITY_ORDER.length];
  const meta = RARITY_META[rarity];
  const baseName = `${color} ${titleCase(motif)}`;
  const baseId = `${familyDef.slug}-${slugify(color)}-${slugify(motif)}`;
  const id = uniqueIdFor(baseId, usedIds);
  usedIds.add(id);
  const traits = traitSet(familyDef, color, motif, accent, rarity, ordinal);

  return {
    id,
    name: id === baseId ? baseName : `${baseName} ${id.split('-').at(-1).toUpperCase()}`,
    family: familyDef.family,
    rarity,
    editionSize: Math.max(1, meta.editionSize - (ordinal % 9) * (rarity === 'Common' ? 2 : 1)),
    dropRole: meta.role,
    price: meta.price + (ordinal % 7) * 20,
    traits,
    renderFile: `renders/${id}.png`,
    promptFile: `prompts/${id}.txt`,
  };
}

export function buildCatalogToTarget(catalog, target = 400) {
  const next = {
    ...catalog,
    version: catalog.version ?? '0.3.0',
    items: catalog.items.map((item) => ({
      ...item,
      renderFile: item.renderFile ?? `renders/${item.id}.png`,
      promptFile: item.promptFile ?? `prompts/${item.id}.txt`,
    })),
  };
  const usedIds = new Set(next.items.map((item) => item.id));
  let ordinal = 0;

  while (next.items.length < target) {
    const candidate = generatedItemAt(ordinal, usedIds);
    ordinal += 1;
    if (catalog.items.some((item) => item.id === candidate.id)) continue;
    next.items.push(candidate);
  }

  if (next.items.length > target) {
    next.items = next.items.slice(0, target);
  }

  return next;
}

export function promptForItem(item) {
  const familyDef = FAMILY_DEFS.find((def) => def.family === item.family);
  const subject = familyDef?.subject ?? 'cartoon collectible shop object';
  return [
    'Use case: stylized-concept',
    'Asset type: Yoink marketplace collectible item render',
    `Primary request: Create "${item.name}" as a Yoink ${item.family} collectible.`,
    `Subject: ${subject}; specific object traits: ${item.traits.join(', ')}.`,
    'Style/medium: high-polish cartoon 3D toy render with thick dark outlines, soft vinyl or clay lighting, rounded chunky forms, pastel body colors, one bold accent color, and sticker-like details.',
    'Scene/backdrop: clean pastel digital studio background with generous padding and a soft contact shadow.',
    'Composition/framing: centered front three-quarter view, square 1024px source framing, item readable at 96px thumbnail size.',
    `Rarity treatment: ${item.rarity}; ${RARITY_TREATMENT[item.rarity] ?? RARITY_TREATMENT.Common}.`,
    'Constraints: no real logos, no readable text, no watermark, no exact protected characters, no casino or loot-box language.',
    'Avoid: dark moody lighting, realistic grime, horror styling, busy backgrounds, cropped object edges, flat icon style.',
  ].join('\n');
}

export function buildCodexJobs(catalog, artRoot = ART_ROOT, statusOverrides = {}) {
  return catalog.items.map((item, index) => {
    const renderExists = existsSync(join(artRoot, item.renderFile));
    const derivedStatus = renderExists ? 'generated' : 'pending';
    const status = statusOverrides[item.id] ?? derivedStatus;
    return {
      index,
      id: item.id,
      name: item.name,
      family: item.family,
      rarity: item.rarity,
      status,
      promptFile: `yoink-drop-art/${item.promptFile}`,
      target: `yoink-drop-art/${item.renderFile}`,
      appTarget: `yoink/public/yoink-items/${item.id}.png`,
      prompt: promptForItem(item),
    };
  });
}

export function syncAppRenders(jobs, artRoot = ART_ROOT, appItemsDir = APP_ITEMS_DIR) {
  mkdirSync(appItemsDir, { recursive: true });
  const copied = [];

  for (const job of jobs) {
    if (!['generated', 'approved'].includes(job.status)) continue;
    const source = join(artRoot, 'renders', `${job.id}.png`);
    if (!existsSync(source)) continue;
    const destination = join(appItemsDir, `${job.id}.png`);
    copyFileSync(source, destination);
    copied.push(`${job.id}.png`);
  }

  return copied;
}

export function findLatestPng(root) {
  if (!existsSync(root)) return null;
  const found = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        found.push({ path: fullPath, mtimeMs: statSync(fullPath).mtimeMs });
      }
    }
  };
  visit(root);
  found.sort((a, b) => b.mtimeMs - a.mtimeMs || b.path.localeCompare(a.path));
  return found[0]?.path ?? null;
}

export function copyLatestGeneratedImage(destination, generatedRoot = join(process.env.CODEX_HOME ?? join(process.env.HOME, '.codex'), 'generated_images')) {
  const source = findLatestPng(generatedRoot);
  if (!source) {
    throw new Error(`No generated PNG files found in ${generatedRoot}`);
  }
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  return source;
}

export function setRenderStatus(id, status, statusPath = STATUS_PATH) {
  const allowed = new Set(['pending', 'generated', 'approved', 'needs-regen']);
  if (!allowed.has(status)) {
    throw new Error(`Unsupported render status: ${status}`);
  }
  const current = readJson(statusPath, {});
  current[id] = status;
  writeJson(statusPath, current);
  return current;
}

function writePromptFiles(catalog, artRoot = ART_ROOT) {
  for (const item of catalog.items) {
    const promptPath = join(artRoot, item.promptFile);
    mkdirSync(dirname(promptPath), { recursive: true });
    writeFileSync(promptPath, `${promptForItem(item)}\n`);
  }
}

function loadCatalog() {
  return readJson(CATALOG_PATH, { pack: 'yoink-drop-art', version: '0.3.0', items: [] });
}

function loadStatus() {
  return readJson(STATUS_PATH, {});
}

function writeStatusIfMissing() {
  if (!existsSync(STATUS_PATH)) writeJson(STATUS_PATH, {});
}

function writeJobs(catalog) {
  const jobs = buildCodexJobs(catalog, ART_ROOT, loadStatus());
  writeJson(JOBS_PATH, jobs);
  return jobs;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeContactSheet(jobs) {
  const counts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1;
    return acc;
  }, {});
  const cards = jobs
    .map((job) => {
      const relativeRender = job.target.replace('yoink-drop-art/', '');
      const hasRender = existsSync(join(ART_ROOT, relativeRender));
      const media = hasRender
        ? `<img src="${escapeHtml(relativeRender)}" loading="lazy" alt="${escapeHtml(job.name)}">`
        : '<div class="missing">pending</div>';
      return `<figure class="card ${escapeHtml(job.status)}">${media}<figcaption><b>${escapeHtml(job.name)}</b><span>${escapeHtml(job.family)} / ${escapeHtml(job.rarity)}</span><code>${escapeHtml(job.id)}</code><em>${escapeHtml(job.status)}</em></figcaption></figure>`;
    })
    .join('\n');
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Yoink Codex Render Jobs</title>
<style>
  body{margin:24px;background:#faf7ff;color:#211a33;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  header{display:flex;align-items:end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:18px}
  h1{font-size:28px;margin:0}
  p{margin:6px 0;color:#746b86}
  .stats{display:flex;gap:8px;flex-wrap:wrap}
  .stats span{background:#fff;border:1px solid #ded8ee;border-radius:8px;padding:7px 10px;font-size:13px;font-weight:800}
  main{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
  .card{margin:0;background:#fff;border:1px solid #ded8ee;border-radius:8px;overflow:hidden;box-shadow:0 8px 18px #1f18330f}
  .card img,.missing{width:100%;aspect-ratio:1;display:grid;place-items:center;background:#eee8ff;color:#8b819d;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
  .card img{object-fit:cover}
  figcaption{display:grid;gap:4px;padding:10px;font-size:12px}
  b{font-size:14px}
  span{color:#746b86}
  code{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#5c4eb1}
  em{font-style:normal;font-weight:900;text-transform:uppercase;color:#fff;background:#8b819d;border-radius:6px;padding:4px 6px;width:max-content}
  .approved em{background:#11937e}.generated em{background:#6f58d3}.pending em{background:#8b819d}.needs-regen em{background:#ff5d3d}
</style>
<header>
  <div>
    <h1>Yoink Codex Render Jobs</h1>
    <p>${jobs.length} catalog items. Generate pending prompts with Codex usage, save PNGs to each target path, then rerun this sheet.</p>
  </div>
  <div class="stats">${Object.entries(counts)
    .sort()
    .map(([status, count]) => `<span>${escapeHtml(status)}: ${count}</span>`)
    .join('')}</div>
</header>
<main>
${cards}
</main>
`;
  writeFileSync(SHEET_PATH, html);
}

function flag(args, name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return args[index + 1] ?? true;
}

function printNextJob(jobs) {
  const job = jobs.find((candidate) => ['pending', 'needs-regen'].includes(candidate.status));
  if (!job) {
    console.log('No pending Codex render jobs.');
    return;
  }
  console.log(`id: ${job.id}`);
  console.log(`target: ${job.target}`);
  console.log(`promptFile: ${job.promptFile}`);
  console.log('prompt:');
  console.log(job.prompt);
}

function runCli() {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'help';
  if (command === 'help' || command === '--help') {
    console.log([
      'Usage:',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs expand --target 400',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs jobs',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs next',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs copy-latest --to yoink-drop-art/renders/item-id.png',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs mark --id item-id --status approved',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs sheet',
      '  node yoink-drop-art/tools/codex-usage-pipeline.mjs sync-app',
    ].join('\n'));
    return;
  }

  if (command === 'expand') {
    const target = Number(flag(args, 'target', 400));
    const catalog = buildCatalogToTarget(loadCatalog(), target);
    writeJson(CATALOG_PATH, catalog);
    writePromptFiles(catalog);
    writeStatusIfMissing();
    const jobs = writeJobs(catalog);
    writeContactSheet(jobs);
    console.log(`Expanded catalog to ${catalog.items.length} items.`);
    console.log(`Jobs -> ${JOBS_PATH}`);
    console.log(`Contact sheet -> ${SHEET_PATH}`);
    return;
  }

  if (command === 'jobs') {
    const catalog = loadCatalog();
    writePromptFiles(catalog);
    writeStatusIfMissing();
    const jobs = writeJobs(catalog);
    console.log(`Wrote ${jobs.length} Codex render jobs.`);
    return;
  }

  if (command === 'next') {
    const catalog = loadCatalog();
    printNextJob(buildCodexJobs(catalog, ART_ROOT, loadStatus()));
    return;
  }

  if (command === 'sheet') {
    const jobs = buildCodexJobs(loadCatalog(), ART_ROOT, loadStatus());
    writeContactSheet(jobs);
    writeJobs(loadCatalog());
    console.log(`Contact sheet -> ${SHEET_PATH}`);
    return;
  }

  if (command === 'copy-latest') {
    const destination = flag(args, 'to');
    if (!destination || destination === true) {
      console.error('copy-latest requires --to <path>');
      process.exit(2);
    }
    const source = copyLatestGeneratedImage(join(REPO_ROOT, destination));
    console.log(`Copied ${source} -> ${join(REPO_ROOT, destination)}`);
    return;
  }

  if (command === 'mark') {
    const id = flag(args, 'id');
    const status = flag(args, 'status');
    if (!id || id === true || !status || status === true) {
      console.error('mark requires --id <item-id> --status <pending|generated|approved|needs-regen>');
      process.exit(2);
    }
    setRenderStatus(id, status);
    const jobs = writeJobs(loadCatalog());
    writeContactSheet(jobs);
    console.log(`Marked ${id} as ${status}.`);
    return;
  }

  if (command === 'sync-app') {
    const copied = syncAppRenders(buildCodexJobs(loadCatalog(), ART_ROOT, loadStatus()));
    console.log(`Copied ${copied.length} render(s) into ${APP_ITEMS_DIR}.`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
