// Ported verbatim from the Yoink Home Directions design logic.

const TINT = {
  pink:   ['#FFD6EA', '#FFB9DC'],
  purple: ['#E9DEFF', '#D6C2FF'],
  yellow: ['#FFEDA6', '#FFE177'],
  teal:   ['#C7F5EC', '#A6EEDD'],
  coral:  ['#FFD9C9', '#FFC1A6'],
  blue:   ['#CFE4FF', '#AFD2FF'],
};

const SAT = {
  pink: '#FF3D9A', purple: '#8B5CF6', yellow: '#EFA100',
  teal: '#10B5A0', coral: '#FF6B3D', blue: '#3B82F6',
};

export function stripe(a, b) {
  return `repeating-linear-gradient(135deg,${a} 0 11px,${b} 11px 22px)`;
}

const mk = (o) => ({
  ...o,
  stripe: stripe(TINT[o.hue][0], TINT[o.hue][1]),
  tagColor: SAT[o.hue],
});

export const bazaarItems = [
  mk({ id: 1, name: 'Holographic Frog Sticker Pack', img: 'holo stickers', tag: 'DEAL',  hue: 'pink',   price: '120',   was: '200',   rate: '4.9', sold: '2.1k', almost: true,  left: 16 }),
  mk({ id: 2, name: 'Y2K Bedazzled Flip Phone',       img: 'flip phone',   tag: 'RARE',  hue: 'purple', price: '4,800', was: '6,000', rate: '4.8', sold: '312',  almost: false, left: 0 }),
  mk({ id: 3, name: 'Rubber Duck Army · 50 pc',       img: 'duck army',    tag: 'HOT',   hue: 'yellow', price: '340',   was: '500',   rate: '4.7', sold: '5.4k', almost: false, left: 0 }),
  mk({ id: 4, name: 'Vintage Polaroid Camera',        img: 'polaroid',     tag: 'RETRO', hue: 'teal',   price: '2,200', was: '2,800', rate: '4.9', sold: '880',  almost: true,  left: 38 }),
  mk({ id: 5, name: 'Bubble Lava Lamp',               img: 'lava lamp',    tag: 'TREND', hue: 'coral',  price: '760',   was: '1,100', rate: '4.6', sold: '1.3k', almost: false, left: 0 }),
  mk({ id: 6, name: 'Squishy Mochi Plush',            img: 'mochi plush',  tag: 'CUTE',  hue: 'blue',   price: '290',   was: '420',   rate: '5.0', sold: '9.8k', almost: true,  left: 8 }),
];

export const chips = ['Y2K', 'Retro', 'Oddities', 'Plushies', 'Stickers', 'Tech'];

export const marketCats = ['Pocket Tech', 'Holo Finds', 'Desk Pets', 'Snack Relics', 'Rare Drops'];

export const MARKET_PAGE_SIZE = 8;

const YOINK_DROP_CATALOG = [
  {
    id: 'drop-pocket-tech-bubble-crt',
    name: 'Bubble CRT',
    family: 'Pocket Tech',
    rarity: 'Rare',
    editionSize: 40,
    stockLeft: 7,
    price: 420,
    img: 'bubble crt',
    imageUrl: '/yoink-items/pocket-tech-bubble-crt.png',
    hue: 'purple',
    mode: 'bin',
    seller: 'yoink_lab',
    traits: ['rounded CRT shell', 'grape screen glow', 'sticker antenna', 'foil trim'],
    description: 'A grape-purple desk CRT toy with a tiny pixel face and rare foil trim around the glassy screen.',
  },
  {
    id: 'drop-pocket-tech-jelly-flip-phone',
    name: 'Jelly Flip Phone',
    family: 'Pocket Tech',
    rarity: 'Uncommon',
    editionSize: 90,
    stockLeft: 22,
    price: 260,
    img: 'jelly flip phone',
    imageUrl: '/yoink-items/pocket-tech-jelly-flip-phone.png',
    hue: 'teal',
    mode: 'bin',
    seller: 'yoink_lab',
    traits: ['translucent shell', 'bubble keypad', 'mini screen smile', 'charm loop'],
    description: 'A translucent gummy flip phone with bubble keys, a tiny smiling screen, and a dangling charm loop.',
  },
  {
    id: 'drop-pocket-tech-pocket-pixel-mp3',
    name: 'Pocket Pixel MP3',
    family: 'Pocket Tech',
    rarity: 'Common',
    editionSize: 160,
    stockLeft: 58,
    price: 140,
    img: 'pocket pixel mp3',
    imageUrl: '/yoink-items/pocket-tech-pocket-pixel-mp3.png',
    hue: 'yellow',
    mode: 'bin',
    seller: 'yoink_lab',
    traits: ['pixel face', 'candy buttons', 'matte toy finish', 'lanyard nub'],
    description: 'A tiny yellow music-player toy with candy buttons and a cheerful pixel screen face.',
  },
  {
    id: 'drop-pocket-tech-flashpop-toy-camera',
    name: 'Flashpop Toy Camera',
    family: 'Pocket Tech',
    rarity: 'Ultra Rare',
    editionSize: 18,
    stockLeft: 3,
    price: 760,
    img: 'flashpop toy camera',
    imageUrl: '/yoink-items/pocket-tech-flashpop-toy-camera.png',
    hue: 'pink',
    mode: 'auction',
    seller: 'yoink_lab',
    traits: ['giant teal lens', 'star flash', 'hologlow strap', 'shimmer rim'],
    description: 'An ultra-rare bubblegum camera with a giant teal lens, star flash, and hologlow strap.',
  },
  {
    id: 'drop-holo-finds-frog-foil-card',
    name: 'Frog Foil Card',
    family: 'Holo Finds',
    rarity: 'Rare',
    editionSize: 55,
    stockLeft: 11,
    price: 390,
    img: 'frog foil card',
    imageUrl: '/yoink-items/holo-finds-frog-foil-card.png',
    hue: 'pink',
    mode: 'bin',
    seller: 'foil_friends',
    traits: ['original frog icon', 'rounded slab', 'rainbow foil frame', 'sparkle flecks'],
    description: 'A shiny slabbed card with an original frog icon, rainbow foil frame, and chunky case corners.',
  },
  {
    id: 'drop-holo-finds-cosmic-sticker-slab',
    name: 'Cosmic Sticker Slab',
    family: 'Holo Finds',
    rarity: 'Ultra Rare',
    editionSize: 22,
    stockLeft: 4,
    price: 820,
    img: 'cosmic sticker slab',
    imageUrl: '/yoink-items/holo-finds-cosmic-sticker-slab.png',
    hue: 'purple',
    mode: 'auction',
    seller: 'foil_friends',
    traits: ['clear display slab', 'puffy star sticker', 'iridescent rim', 'soft glow'],
    description: 'A clear display slab with a floating puffy star sticker and a soft cosmic shimmer.',
  },
  {
    id: 'drop-holo-finds-lucky-pog-stack',
    name: 'Lucky Pog Stack',
    family: 'Holo Finds',
    rarity: 'Uncommon',
    editionSize: 100,
    stockLeft: 31,
    price: 210,
    img: 'lucky pog stack',
    imageUrl: '/yoink-items/holo-finds-lucky-pog-stack.png',
    hue: 'coral',
    mode: 'offer',
    seller: 'foil_friends',
    traits: ['stacked tokens', 'foil top cap', 'lucky marks', 'rubbery edges'],
    description: 'A stacked token collectible with rubbery pastel edges and a shiny lucky top cap.',
  },
  {
    id: 'drop-holo-finds-glimmer-ticket-relic',
    name: 'Glimmer Ticket Relic',
    family: 'Holo Finds',
    rarity: 'One-Off',
    editionSize: 1,
    stockLeft: 1,
    price: 1800,
    img: 'glimmer ticket relic',
    imageUrl: '/yoink-items/holo-finds-glimmer-ticket-relic.png',
    hue: 'yellow',
    mode: 'bin',
    seller: 'foil_friends',
    traits: ['oversized ticket shape', 'foil tear edge', 'serial stamp shape', 'teal edge'],
    description: 'A one-off oversized ticket relic with warm shimmer, teal edging, and a tiny serial stamp shape.',
  },
  {
    id: 'drop-desk-pets-mochi-blob',
    name: 'Mochi Blob',
    family: 'Desk Pets',
    rarity: 'Common',
    editionSize: 200,
    stockLeft: 83,
    price: 120,
    img: 'mochi blob',
    imageUrl: '/yoink-items/desk-pets-mochi-blob.png',
    hue: 'pink',
    mode: 'bin',
    seller: 'desk_pet_co',
    traits: ['squishy body', 'dot eyes', 'stubby feet', 'soft blush'],
    description: 'A soft pink desk pet with tiny feet, dot eyes, and a clean matte toy finish.',
  },
  {
    id: 'drop-desk-pets-sleepy-star-charm',
    name: 'Sleepy Star Charm',
    family: 'Desk Pets',
    rarity: 'Rare',
    editionSize: 44,
    stockLeft: 9,
    price: 360,
    img: 'sleepy star charm',
    imageUrl: '/yoink-items/desk-pets-sleepy-star-charm.png',
    hue: 'purple',
    mode: 'bin',
    seller: 'desk_pet_co',
    traits: ['puffy star body', 'sleepy face', 'keychain loop', 'foil cheek patch'],
    description: 'A lavender puffy star charm with sleepy eyes, a tiny loop, and rare foil cheek patches.',
  },
  {
    id: 'drop-desk-pets-button-eye-sprout',
    name: 'Button-Eye Sprout',
    family: 'Desk Pets',
    rarity: 'Uncommon',
    editionSize: 88,
    stockLeft: 26,
    price: 240,
    img: 'button-eye sprout',
    imageUrl: '/yoink-items/desk-pets-button-eye-sprout.png',
    hue: 'teal',
    mode: 'offer',
    seller: 'desk_pet_co',
    traits: ['button eyes', 'leaf hat', 'stitched base', 'coral cheeks'],
    description: 'A sprout mascot with button eyes, a leafy hat, and a stitched vinyl base.',
  },
  {
    id: 'drop-desk-pets-tiny-desk-dino',
    name: 'Tiny Desk Dino',
    family: 'Desk Pets',
    rarity: 'Ultra Rare',
    editionSize: 16,
    stockLeft: 2,
    price: 900,
    img: 'tiny desk dino',
    imageUrl: '/yoink-items/desk-pets-tiny-desk-dino.png',
    hue: 'blue',
    mode: 'auction',
    seller: 'desk_pet_co',
    traits: ['keyboard saddle', 'glow belly', 'serial tag shape', 'purple spine bumps'],
    description: 'An ultra-rare teal desk dinosaur with a keyboard-key saddle and a soft glowing belly.',
  },
  {
    id: 'drop-snack-relics-cereal-prize-rocket',
    name: 'Cereal Prize Rocket',
    family: 'Snack Relics',
    rarity: 'Rare',
    editionSize: 50,
    stockLeft: 12,
    price: 350,
    img: 'cereal prize rocket',
    imageUrl: '/yoink-items/snack-relics-cereal-prize-rocket.png',
    hue: 'coral',
    mode: 'bin',
    seller: 'snack_relics',
    traits: ['rounded fins', 'sticker window', 'foil exhaust puff', 'prize toy finish'],
    description: 'A tiny prize rocket toy with chunky fins, a sticker window, and a foil exhaust puff.',
  },
  {
    id: 'drop-snack-relics-capsule-ghost-toy',
    name: 'Capsule Ghost Toy',
    family: 'Snack Relics',
    rarity: 'Uncommon',
    editionSize: 110,
    stockLeft: 37,
    price: 190,
    img: 'capsule ghost toy',
    imageUrl: '/yoink-items/snack-relics-capsule-ghost-toy.png',
    hue: 'purple',
    mode: 'offer',
    seller: 'snack_relics',
    traits: ['clear capsule', 'friendly ghost', 'pastel latch', 'prize dots'],
    description: 'A vending capsule with a friendly ghost toy tucked inside a glossy pastel shell.',
  },
  {
    id: 'drop-snack-relics-vending-ring-pop-relic',
    name: 'Vending Ring Pop Relic',
    family: 'Snack Relics',
    rarity: 'Ultra Rare',
    editionSize: 20,
    stockLeft: 5,
    price: 700,
    img: 'vending ring pop relic',
    imageUrl: '/yoink-items/snack-relics-vending-ring-pop-relic.png',
    hue: 'teal',
    mode: 'auction',
    seller: 'snack_relics',
    traits: ['toy ring shape', 'faceted gem', 'purple base', 'teal shimmer'],
    description: 'An ultra-rare toy ring relic with a faceted gem, chunky purple base, and teal shimmer.',
  },
  {
    id: 'drop-snack-relics-crinkle-pack-mascot',
    name: 'Crinkle Pack Mascot',
    family: 'Snack Relics',
    rarity: 'One-Off',
    editionSize: 1,
    stockLeft: 1,
    price: 1600,
    img: 'crinkle pack mascot',
    imageUrl: '/yoink-items/snack-relics-crinkle-pack-mascot.png',
    hue: 'yellow',
    mode: 'bin',
    seller: 'snack_relics',
    traits: ['sealed crinkle pack', 'mascot face', 'odd colorway', 'stamp shape'],
    description: 'A one-off sealed crinkle-pack mascot in an odd blackcurrant-lime colorway.',
  },
];

const MARKET_FEED_ORDER = [
  'drop-pocket-tech-pocket-pixel-mp3',
  'drop-pocket-tech-jelly-flip-phone',
  'drop-desk-pets-mochi-blob',
  'drop-desk-pets-button-eye-sprout',
  'drop-snack-relics-capsule-ghost-toy',
  'drop-holo-finds-lucky-pog-stack',
  'drop-pocket-tech-bubble-crt',
  'drop-snack-relics-cereal-prize-rocket',
  'drop-desk-pets-sleepy-star-charm',
  'drop-holo-finds-frog-foil-card',
  'drop-pocket-tech-flashpop-toy-camera',
  'drop-holo-finds-cosmic-sticker-slab',
  'drop-desk-pets-tiny-desk-dino',
  'drop-snack-relics-vending-ring-pop-relic',
  'drop-holo-finds-glimmer-ticket-relic',
  'drop-snack-relics-crinkle-pack-mascot',
];

const MARKET_FEED_CATALOG = MARKET_FEED_ORDER
  .map((id) => YOINK_DROP_CATALOG.find((item) => item.id === id))
  .filter(Boolean);

export const MARKET_MAX_ITEMS = MARKET_FEED_CATALOG.length;

const flashTierFor = (rarity) => {
  if (rarity === 'Rare') return 'rare';
  if (rarity === 'Ultra Rare' || rarity === 'One-Off') return 'ultra';
  return null;
};

function decorateDropListing(item, index) {
  const flashTier = flashTierFor(item.rarity);

  return {
    ...item,
    cond: `${item.rarity} Drop`,
    cta: 'Buy',
    isAuction: false,
    isOffer: false,
    isBin: true,
    price: item.price.toLocaleString(),
    shipFree: item.rarity !== 'One-Off',
    paidShip: item.rarity === 'One-Off',
    ship: '+80 ship',
    fb: `${98 + (index % 2)}.${index % 10}%`,
    topRated: item.rarity === 'Rare' || item.rarity === 'Ultra Rare',
    stripe: stripe(TINT[item.hue][0], TINT[item.hue][1]),
    editionLabel: `Edition of ${item.editionSize}`,
    stockLabel: `${item.stockLeft}/${item.editionSize} left`,
    flashTier,
    flashLabel: flashTier === 'rare' ? 'Rare Flash' : flashTier === 'ultra' ? 'Ultra Rare Drop' : null,
    feedIndex: index,
  };
}

export function makeMarketFeed(start, count) {
  const safeStart = Math.max(0, Math.min(Number(start) || 0, MARKET_MAX_ITEMS));
  const safeCount = Math.max(0, Math.min(Number(count) || 0, MARKET_MAX_ITEMS - safeStart));
  return MARKET_FEED_CATALOG
    .slice(safeStart, safeStart + safeCount)
    .map((item, index) => decorateDropListing(item, safeStart + index));
}

export function appendMarketFeed(current, pageSize = MARKET_PAGE_SIZE, maxItems = MARKET_MAX_ITEMS) {
  if (current.length >= maxItems) return current;
  const nextCount = Math.min(pageSize, maxItems - current.length);
  return current.concat(makeMarketFeed(current.length, nextCount));
}

// Listing-mode filter behind the search bar's "All" chip.
export const MARKET_MODES = ['All', 'Buy now'];

const MODE_MATCHERS = {
  'Buy now': (item) => item.isBin,
};

// Category chips map onto the generated catalog by keyword/condition.
const CATEGORY_MATCHERS = {
  'Pocket Tech': (item) => item.family === 'Pocket Tech',
  'Holo Finds': (item) => item.family === 'Holo Finds',
  'Desk Pets': (item) => item.family === 'Desk Pets',
  'Snack Relics': (item) => item.family === 'Snack Relics',
  'Rare Drops': (item) => ['Rare', 'Ultra Rare', 'One-Off'].includes(item.rarity),
};

export function filterMarketFeed(items, { category = 'For you', mode = 'All', query = '' } = {}) {
  const term = String(query ?? '').trim().toLowerCase();
  const byCategory = CATEGORY_MATCHERS[category];
  const byMode = MODE_MATCHERS[mode];

  return items.filter((item) => {
    if (byCategory && !byCategory(item)) return false;
    if (byMode && !byMode(item)) return false;
    const searchable = [
      item.name,
      item.seller,
      item.family,
      item.rarity,
      item.img,
      ...(item.traits ?? []),
    ].join(' ').toLowerCase();
    if (term && !searchable.includes(term)) return false;
    return true;
  });
}

export const MARKET_SORTS = [
  { id: 'best', label: 'Best match' },
  { id: 'price-low', label: 'Price: low first' },
  { id: 'price-high', label: 'Price: high first' },
  { id: 'rarity', label: 'Rare first' },
];

const priceOf = (item) => Number(String(item.price).replace(/,/g, '')) || 0;
const rarityRank = (item) => ({
  'One-Off': 5,
  'Ultra Rare': 4,
  Rare: 3,
  Uncommon: 2,
  Common: 1,
}[item.rarity] ?? 0);

export function sortMarketFeed(items, sortId = 'best') {
  if (sortId === 'best') return items;
  const sorted = [...items];
  if (sortId === 'price-low') sorted.sort((a, b) => priceOf(a) - priceOf(b));
  if (sortId === 'price-high') sorted.sort((a, b) => priceOf(b) - priceOf(a));
  if (sortId === 'rarity') sorted.sort((a, b) => rarityRank(b) - rarityRank(a) || priceOf(b) - priceOf(a));
  return sorted;
}

export const dropItems = [
  mk({ id: 1, name: 'Crystal Boba Keychain',    img: 'boba charm',   hue: 'purple', price: '480',   left: 8,  total: 40 }),
  mk({ id: 2, name: 'Holo Trading Card · Foil', img: 'foil card',    hue: 'pink',   price: '1,250', left: 23, total: 60 }),
  mk({ id: 3, name: 'Pixel Mini Console',       img: 'mini console', hue: 'teal',   price: '2,900', left: 4,  total: 30 }),
  mk({ id: 4, name: 'Galaxy Slime Jar',         img: 'slime jar',    hue: 'blue',   price: '210',   left: 51, total: 120 }),
].map((it) => ({ ...it, leftPct: Math.max(6, Math.round((it.left / it.total) * 100)) }));

export const pocketItems = [
  mk({ id: 1, name: 'Retro Arcade Coin',     img: 'arcade coin',  hue: 'teal',   price: '180' }),
  mk({ id: 2, name: 'Mini Claw Machine',     img: 'claw machine', hue: 'yellow', price: '1,400' }),
  mk({ id: 3, name: 'Kawaii Cat Eraser Set', img: 'eraser set',   hue: 'pink',   price: '95' }),
  mk({ id: 4, name: 'Pixel Heart Pin',       img: 'heart pin',    hue: 'coral',  price: '150' }),
];

export const sets = [
  { id: 1, name: 'Retro Arcade', have: 3, total: 5, reward: '500', accent: '#6A5ACD', thumbs: [{ h: 'teal', o: true }, { h: 'yellow', o: true }, { h: 'pink', o: true }, { h: 'purple', o: false }, { h: 'coral', o: false }] },
  { id: 2, name: 'Kawaii Squad', have: 2, total: 6, reward: '800', accent: '#6A5ACD', thumbs: [{ h: 'pink', o: true }, { h: 'blue', o: true }, { h: 'yellow', o: false }, { h: 'teal', o: false }, { h: 'purple', o: false }, { h: 'coral', o: false }] },
].map((set) => ({
  ...set,
  pct: Math.round((set.have / set.total) * 100),
  thumbs: set.thumbs.map((th) => ({ ...th, stripe: stripe(TINT[th.h][0], TINT[th.h][1]), locked: !th.o })),
}));

// Quest board definitions. Progress is demo data like the rest of the
// catalog; the server layers claim state (per day / per week) on top.
export const questDefs = [
  { id: 'd-watch',  period: 'daily',  title: 'Watch 3 listings',        icon: 'favorite',              have: 2, goal: 3, reward: 40 },
  { id: 'd-cart',   period: 'daily',  title: 'Add an item to your cart', icon: 'shopping_cart',         have: 1, goal: 1, reward: 60 },
  { id: 'd-browse', period: 'daily',  title: 'Browse 5 categories',      icon: 'category',              have: 3, goal: 5, reward: 30 },
  { id: 'w-orders', period: 'weekly', title: 'Yoink 2 orders',           icon: 'package_2',             have: 1, goal: 2, reward: 250 },
  { id: 'w-set',    period: 'weekly', title: 'Finish a collection set',  icon: 'grid_view',             have: 0, goal: 1, reward: 500 },
  { id: 'w-streak', period: 'weekly', title: 'Keep a 7-day streak',      icon: 'local_fire_department', have: 6, goal: 7, reward: 700 },
];

export const streak = [
  { d: 'M', done: true }, { d: 'T', done: true }, { d: 'W', done: true },
  { d: 'T', done: true }, { d: 'F', done: true }, { d: 'S', done: true, today: true },
  { d: 'S', done: false },
].map((day) => ({ ...day, todo: !day.done }));
