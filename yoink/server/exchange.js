// Yoink Exchange price engine, v2 — a realistic market simulator that is
// still a pure deterministic function of (ticker seed, timestamp). No cron,
// no stored prices; tests and candles just ask for any moment in time.
//
// Realism layers (each one maps to a real-market phenomenon):
//   1. Fractal Brownian motion — 7 octaves of smoothed value noise from
//      ~3 days down to 1 minute. Markets are self-similar across
//      timescales; this is what makes a 5m chart look like a 4h chart.
//   2. Volatility clustering (GARCH-like) — a slow noise field scales local
//      volatility 0.5×–1.8×, so tickers have calm hours and violent hours.
//   3. Jump diffusion (Merton-style) — rare fat-tailed shocks that decay
//      with a ~45 min half-life: flash spikes and dumps that recover.
//   4. Mean reversion — log-price deviation is clamped around the catalog
//      "retail anchor", so every ticker orbits its fundamental value and
//      the economy stays bounded (a Neopets-style kindness).
//   5. Micro jitter — a 2.5 s interpolated tick so watched prices breathe
//      at broker-app pace.

const TAU = Math.PI * 2;

// Personality → base volatility (per-unit log deviation).
export const PERSONALITY_VOL = {
  steady: 0.05,
  moody: 0.1,
  wild: 0.17,
};

// Personality → chance a 10-minute block fires a jump event.
const JUMP_CHANCE = {
  steady: 0.008,
  moody: 0.022,
  wild: 0.05,
};

// Hard band: log-price never strays more than vol × MAX_DEV_MULT from the
// anchor. Steady ≈ ±19%, moody ≈ ±42%, wild ≈ ±81% at the extremes.
const MAX_DEV_MULT = 3.5;

// The curated board: 12 tickers, each a catalog character with an art kind
// the <ItemArt> spin style can render. `base` is the retail anchor.
export const TICKERS = [
  { id: 'DUCK', name: 'Rubber Duck Army', artKind: 'duck', base: 340, personality: 'steady', seed: 11 },
  { id: 'HOLO', name: 'Charizard Slab · PSA 8', artKind: 'slab', base: 18400, personality: 'wild', seed: 23 },
  { id: 'FLIP', name: 'Y2K Bedazzled Flip Phone', artKind: 'flipphone', base: 4800, personality: 'moody', seed: 37 },
  { id: 'POLA', name: 'Polaroid SX-70', artKind: 'polaroid', base: 2200, personality: 'steady', seed: 41 },
  { id: 'LAVA', name: 'Galaxy Lava Lamp', artKind: 'lava', base: 760, personality: 'moody', seed: 53 },
  { id: 'PIXL', name: 'Pixel Mini Console', artKind: 'console', base: 2900, personality: 'moody', seed: 67 },
  { id: 'TAMA', name: 'Tamagotchi Angel 1997', artKind: 'tamagotchi', base: 1150, personality: 'wild', seed: 71 },
  { id: 'IMAC', name: 'Translucent iMac G3', artKind: 'imac', base: 1500, personality: 'steady', seed: 83 },
  { id: 'BEAN', name: 'Beanie Baby · Tag Error', artKind: 'beanie', base: 620, personality: 'wild', seed: 89 },
  { id: 'MOCH', name: 'Squishy Mochi Plush', artKind: 'plush', base: 290, personality: 'steady', seed: 97 },
  { id: 'WALK', name: 'Cassette Walkman', artKind: 'walkman', base: 430, personality: 'moody', seed: 101 },
  { id: 'BOBA', name: 'Crystal Boba Charm', artKind: 'boba', base: 480, personality: 'steady', seed: 103 },
  { id: 'GACH', name: 'Sanrio Gachapon Lot', artKind: 'gacha', base: 260, personality: 'moody', seed: 107 },
  { id: 'STIK', name: 'Sticker Bomb Pack', artKind: 'stickerpack', base: 75, personality: 'steady', seed: 109 },
  { id: 'KALE', name: 'Brass Kaleidoscope', artKind: 'kaleidoscope', base: 640, personality: 'steady', seed: 113 },
  { id: 'POGS', name: 'Holo Pog Slammer Set', artKind: 'pog', base: 180, personality: 'wild', seed: 127 },
  { id: 'MARB', name: 'Glass Marble Jar', artKind: 'marbles', base: 120, personality: 'steady', seed: 131 },
  { id: 'PINZ', name: 'Enamel Pin Grab Bag', artKind: 'pin', base: 55, personality: 'moody', seed: 137 },
  { id: 'COIN', name: 'Retro Arcade Coin', artKind: 'coin', base: 180, personality: 'moody', seed: 139 },
  { id: 'CLAW', name: 'Mini Claw Machine', artKind: 'claw', base: 1400, personality: 'moody', seed: 149 },
  { id: 'ERSR', name: 'Kawaii Eraser Set', artKind: 'eraser', base: 95, personality: 'steady', seed: 151 },
  { id: 'SLIM', name: 'Galaxy Slime Jar', artKind: 'slime', base: 210, personality: 'wild', seed: 157 },
];

// Only buys are capped — you can always exit a position. The cap is
// generous enough to never bite in normal play; it just stops bots.
export const MAX_BUYS_PER_TICKER_PER_DAY = 15;
export const MAX_SHARES_PER_TRADE = 99;
export const ROOKIE_TRADES = 10;
export const ROOKIE_MAX_LOSS = 0.1;

// Integer hash → [0, 1). Stable across runs and platforms.
export function hashNoise(seed, n) {
  let h = (seed ^ Math.imul(n | 0, 0x9e3779b1)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (f) => f * f * (3 - 2 * f);

// One octave of smoothed value noise in [-1, 1]. `channel` keeps the
// engine's independent noise fields from correlating.
function octaveNoise(seed, channel, t, periodMin) {
  const s = t / periodMin;
  const i = Math.floor(s);
  const f = smooth(s - i);
  const a = hashNoise(seed + channel * 7919, i) * 2 - 1;
  const b = hashNoise(seed + channel * 7919, i + 1) * 2 - 1;
  return a + (b - a) * f;
}

// Fractal Brownian motion: octave periods in minutes with halving-ish
// weights (sum = 1). Slowest octave ≈ 2.8 days → multi-day trends.
const FBM_OCTAVES = [
  [4096, 0.36],
  [1024, 0.24],
  [256, 0.16],
  [64, 0.11],
  [16, 0.07],
  [4, 0.04],
  [1, 0.02],
];

function fbm(seed, t) {
  let total = 0;
  for (let k = 0; k < FBM_OCTAVES.length; k += 1) {
    total += FBM_OCTAVES[k][1] * octaveNoise(seed, 1 + k * 101, t, FBM_OCTAVES[k][0]);
  }
  return total;
}

// GARCH-flavored volatility clustering: local vol swings ~0.55×–1.8×.
export function volClusterAt(ticker, now = Date.now()) {
  const t = now / 60000;
  const n = 0.7 * octaveNoise(ticker.seed, 33, t, 300) + 0.3 * octaveNoise(ticker.seed, 34, t, 60);
  return Math.exp(0.6 * n);
}

// Merton-style jump diffusion. Each 10-minute block may fire one shock;
// sizes are fat-tailed (u·|u| — mostly small, occasionally huge) and decay
// with a 45-minute half-life, so spikes get bought back down and dips
// bounce, like real flash moves.
const JUMP_BLOCK_MIN = 10;
const JUMP_WINDOW_BLOCKS = 24; // shocks influence ~4 hours
const JUMP_HALF_LIFE_MIN = 45;

export function jumpAt(ticker, now = Date.now()) {
  const vol = PERSONALITY_VOL[ticker.personality] ?? PERSONALITY_VOL.steady;
  const chance = JUMP_CHANCE[ticker.personality] ?? JUMP_CHANCE.steady;
  const t = now / 60000;
  const block = Math.floor(t / JUMP_BLOCK_MIN);
  let sum = 0;
  for (let b = block - JUMP_WINDOW_BLOCKS; b <= block; b += 1) {
    if (hashNoise(ticker.seed + 4241, b) >= chance) continue;
    const u = hashNoise(ticker.seed + 5347, b) * 2 - 1;
    const magnitude = u * Math.abs(u) * vol * 6;
    const ageMin = t - b * JUMP_BLOCK_MIN;
    if (ageMin < 0) continue;
    sum += magnitude * Math.pow(0.5, ageMin / JUMP_HALF_LIFE_MIN);
  }
  return sum;
}

// Micro jitter steps under a second (broker-app pace), smoothly interpolated
// so watched prices tick rather than teleport.
const JITTER_STEP_MS = 650;

export function priceAt(ticker, now = Date.now()) {
  const vol = PERSONALITY_VOL[ticker.personality] ?? PERSONALITY_VOL.steady;
  const t = now / 60000;

  const walk = fbm(ticker.seed, t);
  const cluster = volClusterAt(ticker, now);

  const step = Math.floor(now / JITTER_STEP_MS);
  const frac = smooth((now - step * JITTER_STEP_MS) / JITTER_STEP_MS);
  const j0 = hashNoise(ticker.seed, 1000000 + step);
  const j1 = hashNoise(ticker.seed, 1000000 + step + 1);
  const jitter = (j0 + (j1 - j0) * frac) * 2 - 1;

  // Weights tuned so charts show structure, not noise: the walk carries
  // the shape, jumps add rare shocks, jitter only makes the tape breathe.
  let pct = vol * 2.8 * walk * cluster + jumpAt(ticker, now) + vol * 0.45 * jitter;
  const maxDev = vol * MAX_DEV_MULT;
  pct = Math.max(-maxDev, Math.min(maxDev, pct));
  return Math.max(1, Math.round(ticker.base * Math.exp(pct)));
}

export function sparkline(ticker, now = Date.now(), points = 28, spanMs = 90 * 60000, priceFn = priceAt) {
  const out = [];
  for (let i = points - 1; i >= 0; i -= 1) {
    out.push(priceFn(ticker, now - (i * spanMs) / (points - 1)));
  }
  return out;
}

// ── candles ──────────────────────────────────────────────────────────────

export const TIMEFRAMES = {
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1h': 3600000,
  '4h': 14400000,
};

const CANDLE_SAMPLES = 14;
export const MAX_CANDLES = 120;

// OHLCV candles ending at `now` (last candle is the live, partial one).
// Close of candle n equals open of candle n+1 by construction, exactly
// like a continuous tape. Volume is synthesized to correlate with the
// candle's absolute return — busy candles trade heavy, like real markets.
export function candlesFor(ticker, tf = '5m', count = 48, now = Date.now(), priceFn = priceAt) {
  const tfMs = TIMEFRAMES[tf];
  if (!tfMs) return null;
  const raw = Math.floor(Number(count));
  const n = Math.max(2, Math.min(MAX_CANDLES, raw > 0 ? raw : 48));
  const currentStart = Math.floor(now / tfMs) * tfMs;
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = currentStart - i * tfMs;
    const end = Math.min(start + tfMs, now);
    const open = priceFn(ticker, start);
    const close = priceFn(ticker, end);
    let high = Math.max(open, close);
    let low = Math.min(open, close);
    for (let k = 1; k < CANDLE_SAMPLES; k += 1) {
      const p = priceFn(ticker, start + ((end - start) * k) / CANDLE_SAMPLES);
      if (p > high) high = p;
      if (p < low) low = p;
    }
    const ret = Math.abs(close - open) / (open || 1);
    const baseVolume = 40 + hashNoise(ticker.seed + 6089, Math.floor(start / tfMs)) * 140;
    out.push({
      t: start,
      o: open,
      h: high,
      l: low,
      c: close,
      v: Math.max(1, Math.round(baseVolume * (1 + ret * 45))),
    });
  }
  return out;
}

export function dayOpen(now = Date.now()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Public shape of one ticker: price, today's move, momentum badge.
export function decorateTicker(ticker, now = Date.now(), priceFn = priceAt) {
  const price = priceFn(ticker, now);
  const open = priceFn(ticker, dayOpen(now));
  const tenAgo = priceFn(ticker, now - 10 * 60000);
  const vol = PERSONALITY_VOL[ticker.personality] ?? PERSONALITY_VOL.steady;
  const momentum = tenAgo > 0 ? price / tenAgo - 1 : 0;
  return {
    id: ticker.id,
    name: ticker.name,
    artKind: ticker.artKind,
    personality: ticker.personality,
    base: ticker.base,
    price,
    open,
    changePct: open > 0 ? Math.round((price / open - 1) * 1000) / 10 : 0,
    hot: momentum > vol * 0.3,
    dip: momentum < -vol * 0.3,
    spark: sparkline(ticker, now, 32, 12 * 60000, priceFn),
  };
}

export function getTicker(tickerId) {
  return TICKERS.find((ticker) => ticker.id === tickerId) ?? null;
}
