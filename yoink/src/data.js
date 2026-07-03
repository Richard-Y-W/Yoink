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

export const marketCats = ['Deals', 'Ending soon', 'Trading cards', 'Retro tech', 'Vintage', 'Plushies'];

export const MARKET_PAGE_SIZE = 8;
export const MARKET_MAX_ITEMS = 240;

export function makeMarketFeed(start, count) {
  const tints = [
    ['#F0EEF8', '#E6E3F2'],
    ['#F2F0F9', '#E9E6F4'],
    ['#ECE9F5', '#E0DCEE'],
    ['#F4F2FA', '#EBE8F4'],
    ['#EEEBF6', '#E2DEEF'],
    ['#E8E5F2', '#DBD6EA'],
  ];
  const names = [
    'Vintage Polaroid SX-70 — tested',
    'Holo Charizard 1st Ed · PSA 8',
    'Y2K Bedazzled Flip Phone (works)',
    'Rubber Duck Army — 50-pc lot',
    'Lava Lamp · Galaxy Edition',
    'Pixel Mini Console + 200 games',
    'Sanrio Gachapon Mystery Lot',
    'Translucent iMac G3 (works)',
    'Beanie Baby — rare tag error',
    'Tamagotchi Angel 1997',
    'Sticker Bomb Pack · 200 pc',
    'Brass Pocket Kaleidoscope',
    'Cassette Walkman + 12 tapes',
    'Holographic Pog Slammer Set',
    'Glass Marble Jar · 80 pc',
    'Enamel Pin Grab Bag',
  ];
  const imgs = [
    'polaroid sx-70',
    'graded slab',
    'flip phone',
    'duck lot',
    'lava lamp',
    'mini console',
    'gacha lot',
    'imac g3',
    'beanie baby',
    'tamagotchi',
    'sticker pack',
    'kaleidoscope',
    'walkman',
    'pog set',
    'marble jar',
    'pin bag',
  ];
  const sellers = [
    'retro_optics',
    'cardvault',
    'y2k_dreams',
    'odd.goods',
    'glowco',
    '8bit_lab',
    'tokyo_finds',
    'vault77',
    'nostalgia.co',
    'pixelpawn',
  ];
  const conds = ['New', 'Used · Good', 'Used · Fair', 'Refurbished', 'Graded'];
  const modes = ['bin', 'auction', 'offer', 'bin', 'auction', 'bin'];
  const prices = [120, 18400, 4800, 340, 520, 2900, 260, 1500, 90, 210, 75, 640, 430, 180, 120, 55];
  const out = [];

  for (let i = 0; i < count; i += 1) {
    const k = start + i;
    const mode = modes[k % modes.length];
    const isAuction = mode === 'auction';
    const isOffer = mode === 'offer';
    const isBin = mode === 'bin';
    const urgent = isAuction && k % 4 === 1;
    const shipFree = k % 3 !== 1;

    out.push({
      id: `f${k}`,
      name: names[k % names.length],
      img: imgs[k % imgs.length],
      cond: conds[k % conds.length],
      mode,
      isAuction,
      isOffer,
      isBin,
      urgent,
      calm: isAuction && !urgent,
      cta: isAuction ? 'Bid' : isOffer ? 'Offer' : 'Buy',
      bids: String(3 + (k % 28)),
      timeLeft: urgent ? `${8 + (k % 50)}m` : `${1 + (k % 6)}d ${k % 23}h`,
      price: (prices[k % prices.length] + (k % 7) * 15).toLocaleString(),
      shipFree,
      paidShip: !shipFree,
      ship: `+${40 + (k % 6) * 10} ship`,
      seller: sellers[k % sellers.length],
      fb: `${97 + (k % 3)}.${k % 10}%`,
      topRated: k % 5 === 0,
      stripe: stripe(tints[k % tints.length][0], tints[k % tints.length][1]),
    });
  }

  return out;
}

export function appendMarketFeed(current, pageSize = MARKET_PAGE_SIZE, maxItems = MARKET_MAX_ITEMS) {
  if (current.length >= maxItems) return current;
  const nextCount = Math.min(pageSize, maxItems - current.length);
  return current.concat(makeMarketFeed(current.length, nextCount));
}

// Listing-mode filter behind the search bar's "All" chip.
export const MARKET_MODES = ['All', 'Auctions', 'Buy now', 'Offers'];

const MODE_MATCHERS = {
  Auctions: (item) => item.isAuction,
  'Buy now': (item) => item.isBin,
  Offers: (item) => item.isOffer,
};

// Category chips map onto the generated catalog by keyword/condition.
const CATEGORY_MATCHERS = {
  Deals: (item) => item.shipFree,
  'Ending soon': (item) => item.isAuction,
  'Trading cards': (item) => /charizard|pog|beanie|pin|card/i.test(item.name),
  'Retro tech': (item) => /polaroid|imac|walkman|console|phone|tamagotchi/i.test(item.name),
  Vintage: (item) => /used|graded|refurbished/i.test(item.cond),
  Plushies: (item) => /plush|sanrio|gacha|beanie/i.test(item.name),
};

export function filterMarketFeed(items, { category = 'For you', mode = 'All', query = '' } = {}) {
  const term = String(query ?? '').trim().toLowerCase();
  const byCategory = CATEGORY_MATCHERS[category];
  const byMode = MODE_MATCHERS[mode];

  return items.filter((item) => {
    if (byCategory && !byCategory(item)) return false;
    if (byMode && !byMode(item)) return false;
    if (term && !item.name.toLowerCase().includes(term) && !item.seller.toLowerCase().includes(term)) return false;
    return true;
  });
}

export const MARKET_SORTS = [
  { id: 'best', label: 'Best match' },
  { id: 'price-low', label: 'Price: low first' },
  { id: 'price-high', label: 'Price: high first' },
  { id: 'bids', label: 'Most bids' },
];

const priceOf = (item) => Number(String(item.price).replace(/,/g, '')) || 0;

export function sortMarketFeed(items, sortId = 'best') {
  if (sortId === 'best') return items;
  const sorted = [...items];
  if (sortId === 'price-low') sorted.sort((a, b) => priceOf(a) - priceOf(b));
  if (sortId === 'price-high') sorted.sort((a, b) => priceOf(b) - priceOf(a));
  if (sortId === 'bids') sorted.sort((a, b) => Number(b.bids) - Number(a.bids));
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
  { id: 1, name: 'Retro Arcade', have: 3, total: 5, reward: '500', accent: '#10B5A0', thumbs: [{ h: 'teal', o: true }, { h: 'yellow', o: true }, { h: 'pink', o: true }, { h: 'purple', o: false }, { h: 'coral', o: false }] },
  { id: 2, name: 'Kawaii Squad', have: 2, total: 6, reward: '800', accent: '#FF3D9A', thumbs: [{ h: 'pink', o: true }, { h: 'blue', o: true }, { h: 'yellow', o: false }, { h: 'teal', o: false }, { h: 'purple', o: false }, { h: 'coral', o: false }] },
].map((set) => ({
  ...set,
  pct: Math.round((set.have / set.total) * 100),
  thumbs: set.thumbs.map((th) => ({ ...th, stripe: stripe(TINT[th.h][0], TINT[th.h][1]), locked: !th.o })),
}));

export const streak = [
  { d: 'M', done: true }, { d: 'T', done: true }, { d: 'W', done: true },
  { d: 'T', done: true }, { d: 'F', done: true }, { d: 'S', done: true, today: true },
  { d: 'S', done: false },
].map((day) => ({ ...day, todo: !day.done }));
