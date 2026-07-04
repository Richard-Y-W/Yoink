// The Bell: Yoink's session-based trading floor. Five bells a day at
// phone-pickup peaks; each rings a 25-minute live session with a lineup of
// 2 confirmed listings (announced one bell ahead), 1 rumor (aisle hinted
// beforehand, item revealed at the open) and 2 wildcards (pure surprise).
//
// Everything is deterministic from the session's start minute — schedule,
// lineup, price action, sim-trader stories — so there is no cron and tests
// can replay any bell ever rung.
//
// Session price action follows the real-market U-curve: volatility spikes
// at the open (the "overnight information" is the wildcard reveal), sags
// through the middle, and ramps into the close.

import { TICKERS, hashNoise, priceAt } from './exchange.js';

// Bell times in minutes-from-local-midnight, sitting on documented mobile
// attention peaks (morning pickup, lunch, afternoon, evening, wind-down).
export const BELL_MINUTES = [570, 750, 960, 1200, 1380]; // 9:30 12:30 16:00 20:00 23:00
export const SESSION_MS = 25 * 60000;
export const WARMUP_MS = 30 * 60000;

export const FLOOR_FEE = 0.05;           // the floor's cut on every sale — the economy's sink
export const FLOOR_BUY_MARKUP = 0.03;    // live-floor ask spread; prevents free buy→sell loops
export const SESSION_SELL_CAP = 3;       // items sellable per player per session
export const MIN_BELL_ITEMS_TO_JOIN = 2;  // own at least a couple lineup items before joining
export const STREAK_FREEZES = 1;         // missed days absorbed before a streak resets

export const LINEUP_ROLES = ['confirmed', 'confirmed', 'rumor', 'wildcard', 'wildcard'];

// Shop aisles for rumor hints — every ticker art kind belongs to one.
export const AISLES = {
  'plushie aisle': ['plush', 'beanie', 'slime', 'gacha'],
  'retro tech shelf': ['walkman', 'imac', 'console', 'flipphone', 'polaroid', 'tamagotchi'],
  'card & collectible case': ['slab', 'pog', 'pin', 'coin', 'marbles', 'stickerpack'],
  'oddities corner': ['lava', 'kaleidoscope', 'claw', 'eraser', 'boba', 'duck'],
};

export function aisleOf(artKind) {
  for (const [aisle, kinds] of Object.entries(AISLES)) {
    if (kinds.includes(artKind)) return aisle;
  }
  return 'oddities corner';
}

export const SIM_TRADERS = [
  'retro_optics', 'cardvault', 'y2k_dreams', 'odd.goods', 'glowco',
  '8bit_lab', 'tokyo_finds', 'vault77', 'nostalgia.co', 'pixelpawn',
];

function dayStart(now) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function makeSession(start, slot) {
  return {
    start,
    end: start + SESSION_MS,
    slot,
    // Unique, deterministic id — the seed for everything in this session.
    seed: Math.floor(start / 60000),
    key: `${new Date(start).toLocaleDateString('en-CA')}|${slot}`,
  };
}

function sessionsOfDay(now) {
  const base = dayStart(now);
  return BELL_MINUTES.map((minutes, slot) => makeSession(base + minutes * 60000, slot));
}

export function liveSessionAt(now = Date.now()) {
  return sessionsOfDay(now).find((session) => now >= session.start && now < session.end) ?? null;
}

export function nextSessionAfter(now = Date.now()) {
  const today = sessionsOfDay(now).find((session) => session.start > now);
  if (today) return today;
  return sessionsOfDay(now + 24 * 3600 * 1000)[0];
}

export function lastClosedSession(now = Date.now()) {
  const today = sessionsOfDay(now).filter((session) => session.end <= now);
  if (today.length > 0) return today[today.length - 1];
  const yesterday = sessionsOfDay(now - 24 * 3600 * 1000);
  return yesterday[yesterday.length - 1];
}

// Five distinct tickers per session: slots 0–1 confirmed, 2 the rumor,
// 3–4 wildcards. Deterministic from the session seed.
export function lineupFor(session) {
  const picked = [];
  let n = 0;
  while (picked.length < LINEUP_ROLES.length) {
    const index = Math.floor(hashNoise(9001 + session.seed, n) * TICKERS.length) % TICKERS.length;
    n += 1;
    if (picked.some((entry) => entry.ticker.id === TICKERS[index].id)) continue;
    picked.push({ ticker: TICKERS[index], role: LINEUP_ROLES[picked.length] });
  }
  return picked;
}

export function rumorAisleFor(session) {
  const rumor = lineupFor(session).find((entry) => entry.role === 'rumor');
  return aisleOf(rumor.ticker.artKind);
}

// U-curve volatility multiplier across the 25 minutes: hot open, calm
// middle, ramping close — the documented shape of real trading days.
export function uCurve(minutesIn) {
  if (minutesIn < 0) return 0;
  if (minutesIn < 5) return 2.2 - (minutesIn / 5) * 1.5;
  if (minutesIn < 18) return 0.7;
  if (minutesIn <= 25) return 0.7 + ((minutesIn - 18) / 7) * 1.1;
  return 0;
}

const smooth = (f) => f * f * (3 - 2 * f);

function octave(seed, channel, t, period) {
  const s = t / period;
  const i = Math.floor(s);
  const f = smooth(s - i);
  const a = hashNoise(seed + channel * 7919, i) * 2 - 1;
  const b = hashNoise(seed + channel * 7919, i + 1) * 2 - 1;
  return a + (b - a) * f;
}

// Extra log-price applied to a lineup ticker during its live session:
// a fat-tailed opening gap (slightly optimistic on average — the hype is
// real more often than not), plus U-curve-scaled path noise. Zero outside
// sessions and for tickers not in the lineup.
export function sessionBoost(ticker, now = Date.now()) {
  const session = liveSessionAt(now);
  if (!session) return 0;
  const entry = lineupFor(session).find((candidate) => candidate.ticker.id === ticker.id);
  if (!entry) return 0;

  const minutesIn = (now - session.start) / 60000;
  const u = hashNoise(session.seed + 271, ticker.seed) * 2 - 1;
  const gap = u * Math.abs(u) * 0.62 + 0.08;
  const ramp = smooth(Math.min(1, minutesIn / 4));

  const path = uCurve(minutesIn) * (
    0.7 * octave(session.seed + ticker.seed, 51, minutesIn, 1.5) +
    0.3 * octave(session.seed + ticker.seed, 52, minutesIn, 4)
  ) * 0.16;

  const boost = gap * ramp + path;
  return Math.max(-0.7, Math.min(0.7, boost));
}

// Session-aware price: the base engine everywhere, times the session story
// when a ticker's bell is ringing. This is the price function the whole
// store uses, so charts, paper trades and floor sales all see the spike.
export function bellPriceAt(ticker, now = Date.now()) {
  const base = priceAt(ticker, now);
  const boost = sessionBoost(ticker, now);
  if (boost === 0) return base;
  return Math.max(1, Math.round(base * Math.exp(boost)));
}

export function streetMultiplier(ticker, now = Date.now()) {
  return bellPriceAt(ticker, now) / ticker.base;
}

// Sim-trader stories for a session: deterministic little wins and losses
// that make the floor feel populated. Used live (as the activity feed) and
// at the close (as the Floor Report).
export function simTradesFor(session, count = 6) {
  const lineup = lineupFor(session);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const trader = SIM_TRADERS[Math.floor(hashNoise(session.seed + 631, i * 3) * SIM_TRADERS.length) % SIM_TRADERS.length];
    const entry = lineup[Math.floor(hashNoise(session.seed + 631, i * 3 + 1) * lineup.length) % lineup.length];
    const u = hashNoise(session.seed + 631, i * 3 + 2) * 2 - 1;
    const pct = Math.round((u * Math.abs(u) * 0.5 + 0.04) * 100);
    const qty = 1 + (Math.floor(hashNoise(session.seed + 631, i * 3 + 2) * 3) % 3);
    out.push({ trader, tickerId: entry.ticker.id, role: entry.role, qty, pct });
  }
  return out;
}

export function floorReportFor(session) {
  const trades = simTradesFor(session);
  const sorted = [...trades].sort((a, b) => b.pct - a.pct);
  const winner = sorted[0];
  const bagholder = sorted[sorted.length - 1];
  const lucky = trades.find((trade) => trade.role === 'wildcard' && trade.pct > 0) ?? winner;
  const diamond = trades.find((trade) => trade !== winner && trade !== bagholder && trade !== lucky) ?? winner;
  return {
    key: session.key,
    closedAt: session.end,
    entries: [
      { label: 'Biggest winner', ...winner },
      { label: 'Luckiest wildcard', ...lucky },
      { label: 'Diamond hands', ...diamond },
      { label: 'Bagholder of the bell', ...bagholder },
    ],
  };
}
