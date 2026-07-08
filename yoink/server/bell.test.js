import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AISLES,
  BELL_MINUTES,
  FLOOR_BUY_MARKUP,
  FLOOR_FEE,
  MIN_BELL_ITEMS_TO_JOIN,
  SESSION_BUY_CAP,
  SESSION_MS,
  SESSION_SELL_CAP,
  STREAK_FREEZES,
  aisleOf,
  bellPriceAt,
  floorReportFor,
  lastClosedSession,
  lineupFor,
  liveSessionAt,
  nextSessionAfter,
  rumorAisleFor,
  sessionBoost,
  simFlowImpact,
  simTradesFor,
  streetMultiplier,
  uCurve,
} from './bell.js';
import { TICKERS, ROOKIE_TRADES, getTicker, priceAt } from './exchange.js';
import { createStore } from './store.js';

// A quiet moment between bells (14:00 local) and one inside the 12:30 bell.
const CALM = new Date(2026, 6, 4, 14, 0, 0).getTime();
const LIVE = new Date(2026, 6, 4, 12, 40, 0).getTime();

const freshState = (balance = 100000, collection = []) => ({
  wallet: { balance, streak: 0, lastClaimDay: null, lastSpinDay: null },
  orders: [],
  collection,
  dropNotify: [],
  questClaims: [],
  orderSeq: 1000,
  exchange: { positions: {}, trades: [], rookieLeft: ROOKIE_TRADES },
  bell: { sales: [], attendance: [], streak: 0, streakDay: null, freezes: STREAK_FREEZES, bellsRung: 0 },
});

const duckItem = (quantity = 3) => ({
  id: 'c-duck',
  title: 'Rubber Duck Army — 50-pc lot',
  imageLabel: 'duck lot',
  imageStripe: '',
  seller: 'odd.goods',
  unitPrice: 340,
  quantity,
  acquiredAt: 0,
});

const bellBag = () => TICKERS.map((ticker) => ({
  id: `c-${ticker.id}`,
  title: ticker.name,
  imageLabel: ticker.name,
  imageStripe: '',
  seller: 'bell_bag',
  unitPrice: ticker.base,
  quantity: MIN_BELL_ITEMS_TO_JOIN,
  acquiredAt: 0,
}));

// Deterministically find a live moment where DUCK is (or is not) listed.
function findSession(predicate, from = LIVE) {
  for (let day = 0; day < 30; day += 1) {
    for (const minutes of BELL_MINUTES) {
      const date = new Date(from);
      date.setHours(0, 0, 0, 0);
      const start = date.getTime() + day * 86400000 + minutes * 60000;
      const session = liveSessionAt(start + 60000);
      if (session && predicate(session)) return session;
    }
  }
  throw new Error('no matching session found in 30 days');
}

const hasDuck = (session) => lineupFor(session).some((entry) => entry.ticker.id === 'DUCK');

test('five bells a day, 25 minutes each, no overlaps', () => {
  const starts = BELL_MINUTES.map((minutes) => minutes * 60000);
  for (let i = 1; i < starts.length; i += 1) {
    assert.ok(starts[i] - starts[i - 1] > SESSION_MS, 'sessions overlap');
  }
  assert.equal(BELL_MINUTES.length, 5);
});

test('liveSessionAt is null between bells and set during one', () => {
  assert.equal(liveSessionAt(CALM), null);
  const session = liveSessionAt(LIVE);
  assert.ok(session);
  assert.equal(session.slot, 1);
  assert.ok(LIVE >= session.start && LIVE < session.end);
});

test('nextSessionAfter rolls to tomorrow after the last bell', () => {
  const lateNight = new Date(2026, 6, 4, 23, 40, 0).getTime();
  const next = nextSessionAfter(lateNight);
  assert.equal(next.slot, 0);
  assert.ok(next.start > lateNight);
});

test('lastClosedSession falls back to yesterday before the first bell', () => {
  const earlyMorning = new Date(2026, 6, 4, 7, 0, 0).getTime();
  const closed = lastClosedSession(earlyMorning);
  assert.equal(closed.slot, BELL_MINUTES.length - 1);
  assert.ok(closed.end < earlyMorning);
});

test('lineup: five distinct tickers in the 2+1+2 role split, deterministic', () => {
  const session = liveSessionAt(LIVE);
  const lineup = lineupFor(session);
  assert.equal(lineup.length, 5);
  assert.equal(new Set(lineup.map((entry) => entry.ticker.id)).size, 5);
  assert.deepEqual(lineup.map((entry) => entry.role), ['confirmed', 'confirmed', 'rumor', 'wildcard', 'wildcard']);
  assert.deepEqual(lineup, lineupFor(session));
});

test('every ticker art kind belongs to an aisle, rumor aisle matches its item', () => {
  const allKinds = Object.values(AISLES).flat();
  for (const ticker of TICKERS) {
    assert.ok(allKinds.includes(ticker.artKind), `${ticker.artKind} has no aisle`);
  }
  const session = liveSessionAt(LIVE);
  const rumor = lineupFor(session).find((entry) => entry.role === 'rumor');
  assert.equal(rumorAisleFor(session), aisleOf(rumor.ticker.artKind));
});

test('U-curve: hot open, calm middle, ramping close', () => {
  assert.ok(uCurve(0.5) > uCurve(10), 'open should out-vol the middle');
  assert.ok(uCurve(24) > uCurve(10), 'close should out-vol the middle');
  assert.equal(uCurve(-1), 0);
  assert.equal(uCurve(30), 0);
});

test('sessionBoost: zero outside sessions and for unlisted tickers, bounded inside', () => {
  for (const ticker of TICKERS) {
    assert.equal(sessionBoost(ticker, CALM), 0);
  }
  const session = liveSessionAt(LIVE);
  const lineup = lineupFor(session);
  const listedIds = new Set(lineup.map((entry) => entry.ticker.id));
  for (const ticker of TICKERS) {
    const boost = sessionBoost(ticker, LIVE);
    if (listedIds.has(ticker.id)) {
      assert.ok(Math.abs(boost) <= 0.7);
      assert.notEqual(boost, 0, `${ticker.id} listed but flat`);
    } else {
      assert.equal(boost, 0);
    }
  }
});

test('bellPriceAt equals the base engine between bells and diverges during one', () => {
  const session = liveSessionAt(LIVE);
  const listed = lineupFor(session)[0].ticker;
  assert.equal(bellPriceAt(listed, CALM), priceAt(listed, CALM));
  assert.notEqual(bellPriceAt(listed, LIVE), priceAt(listed, LIVE));
});

test('sim trades and floor report are deterministic with all four labels', () => {
  const session = liveSessionAt(LIVE);
  assert.deepEqual(simTradesFor(session), simTradesFor(session));
  const report = floorReportFor(session);
  assert.deepEqual(report.entries.map((entry) => entry.label), [
    'Biggest winner', 'Luckiest wildcard', 'Diamond hands', 'Bagholder of the bell',
  ]);
  assert.ok(report.entries[0].pct >= report.entries[3].pct);
});

test('sim fills are timestamped inside the session and move the price when they land', () => {
  const session = liveSessionAt(LIVE);
  const fills = simTradesFor(session);
  for (const fill of fills) {
    assert.ok(fill.atMs >= session.start && fill.atMs < session.end);
    assert.ok(fill.side === 'buy' || fill.side === 'sell');
  }
  // Pick a fill and check the tape jumps in its direction at its timestamp.
  const fill = fills[0];
  const ticker = getTicker(fill.tickerId);
  const before = simFlowImpact(ticker, fill.atMs - 1);
  const after = simFlowImpact(ticker, fill.atMs + 1);
  if (fill.side === 'buy') assert.ok(after > before);
  else assert.ok(after < before);
});

test('floor report ranks player trades against the sim traders', () => {
  const session = liveSessionAt(LIVE);
  const monster = { trader: 'you', tickerId: lineupFor(session)[0].ticker.id, role: 'confirmed', qty: 1, pct: 999 };
  const report = floorReportFor(session, [monster]);
  assert.equal(report.entries[0].label, 'Biggest winner');
  assert.equal(report.entries[0].trader, 'you');
  assert.equal(report.entries[0].pct, 999);
  // Without extra trades the report is unchanged sim-only output.
  assert.ok(floorReportFor(session).entries.every((entry) => entry.trader !== 'you'));
});

test('floorBuy fills at the ask, lands in the collection, and pushes the tape', () => {
  const store = createStore({ state: freshState(1000000, bellBag()) });
  const live = liveSessionAt(LIVE);
  const entry = lineupFor(live)[0];
  const ticker = entry.ticker;

  const before = store.getBell(LIVE).live.lineup.find((row) => row.tickerId === ticker.id);
  const buy = store.floorBuy({ tickerId: ticker.id, quantity: 2 }, LIVE);
  assert.equal(buy.ok, true);
  assert.equal(buy.qty, 2);
  assert.equal(buy.unit, before.ask);
  assert.equal(buy.buysLeft, SESSION_BUY_CAP - 2);

  // The item is real: it joined the collection as a floor lot.
  const lot = store.getCollection(LIVE).find((item) => item.id === `floor-${ticker.id}`);
  assert.equal(lot.quantity, 2);
  assert.equal(lot.unitPrice, buy.unit);

  // Market impact: same instant, higher tape — only the fill differs.
  const after = store.getBell(LIVE).live.lineup.find((row) => row.tickerId === ticker.id);
  assert.ok(after.price > before.price);
});

test('floorBuy enforces the session cap and the coin balance', () => {
  const store = createStore({ state: freshState(1000000, bellBag()) });
  const ticker = lineupFor(liveSessionAt(LIVE))[0].ticker;
  const over = store.floorBuy({ tickerId: ticker.id, quantity: SESSION_BUY_CAP + 1 }, LIVE);
  assert.equal(over.ok, false);
  assert.match(over.error, /per session/);

  const poor = createStore({ state: freshState(10, bellBag()) });
  const broke = poor.floorBuy({ tickerId: ticker.id, quantity: 1 }, LIVE);
  assert.equal(broke.ok, false);
  assert.ok(broke.shortBy > 0);
});

test('floorBuy needs the ownership prerequisite, like selling', () => {
  const store = createStore({ state: freshState(1000000, []) });
  const ticker = lineupFor(liveSessionAt(LIVE))[0].ticker;
  const result = store.floorBuy({ tickerId: ticker.id, quantity: 1 }, LIVE);
  assert.equal(result.ok, false);
  assert.equal(result.eligibility.ok, false);
});

test('floor sells fill at market price and push the tape down', () => {
  const store = createStore({ state: freshState(1000000, bellBag()) });
  const live = liveSessionAt(LIVE);
  const entry = lineupFor(live)[0];
  const before = store.getBell(LIVE).live.lineup.find((row) => row.tickerId === entry.ticker.id);
  const sale = store.floorSell({ itemId: `c-${entry.ticker.id}`, quantity: 1 }, LIVE);
  assert.equal(sale.ok, true);
  assert.equal(sale.unit, before.price);
  assert.equal(sale.fee, Math.round(sale.gross * FLOOR_FEE));
  const after = store.getBell(LIVE).live.lineup.find((row) => row.tickerId === entry.ticker.id);
  assert.ok(after.price < before.price);
});

test('getBell puts the player on the last report when their sale tops it', () => {
  const live = liveSessionAt(LIVE);
  const entry = lineupFor(live)[0];
  const state = freshState();
  // A 900% flip: basis Ȳ1,000 (net − realized), banked Ȳ10,000.
  state.bell.sales.push({
    key: live.key,
    itemId: 'c-monster',
    title: 'Monster flip',
    tickerId: entry.ticker.id,
    qty: 1,
    unit: 10500,
    fee: 500,
    net: 10000,
    realized: 9000,
    at: LIVE,
  });
  const store = createStore({ state });
  const bell = store.getBell(live.end + 60000);
  assert.equal(bell.lastReport.key, live.key);
  assert.equal(bell.lastReport.entries[0].label, 'Biggest winner');
  assert.equal(bell.lastReport.entries[0].trader, 'you');
  assert.equal(bell.lastReport.entries[0].pct, 900);
  assert.equal(bell.lastReport.playerBanked, 10000);
});

test('getBell between bells: no live block, next preview hides rumor item and wildcards', () => {
  const store = createStore({ state: freshState() });
  const bell = store.getBell(CALM);
  assert.equal(bell.live, null);
  assert.ok(bell.next.opensInMs > 0);
  assert.equal(bell.next.confirmed.length, 2);
  assert.ok(bell.next.confirmed.every((entry) => entry.role === 'confirmed'));
  assert.equal(typeof bell.next.rumorAisle, 'string');
  assert.ok(bell.lastReport.entries.length === 4);
});

test('getBell during a session reveals the full lineup with holdings folded in', () => {
  const session = findSession(hasDuck);
  const now = session.start + 6 * 60000;
  const store = createStore({ state: freshState(1000, [duckItem(2)]) });
  const bell = store.getBell(now);
  assert.ok(bell.live);
  assert.equal(bell.live.lineup.length, 5);
  const duckRow = bell.live.lineup.find((entry) => entry.tickerId === 'DUCK');
  assert.equal(duckRow.own, 2);
  assert.equal(bell.live.sellsLeft, SESSION_SELL_CAP);
  assert.equal(bell.live.eligibility.ok, true);
  assert.equal(bell.live.eligibility.owned, 2);
});

test('floorSell: happy path pays street price minus the 5% fee', () => {
  const session = findSession(hasDuck);
  const now = session.start + 6 * 60000;
  const store = createStore({ state: freshState(1000, [duckItem(3)]) });
  const mult = streetMultiplier(getTicker('DUCK'), now);
  const unit = Math.max(1, Math.round(340 * mult));
  const result = store.floorSell({ itemId: 'c-duck', quantity: 2 }, now);
  assert.equal(result.ok, true);
  assert.equal(result.unit, unit);
  assert.equal(result.fee, Math.round(unit * 2 * FLOOR_FEE));
  assert.equal(result.net, unit * 2 - result.fee);
  assert.equal(result.realized, result.net - 340 * 2);
  assert.equal(result.wallet.balance, 1000 + result.net);
  assert.equal(result.sellsLeft, SESSION_SELL_CAP - 2);
  // inventory decremented, attendance marked
  assert.equal(store.getBell(now).live.lineup.find((entry) => entry.tickerId === 'DUCK').own, 1);
  assert.equal(result.streak.days, 1);
  assert.equal(result.streak.bellsRung, 1);
});

test('floorSell enforces the session cap, the floor being open, lineup membership and ownership', () => {
  const session = findSession(hasDuck);
  const now = session.start + 6 * 60000;
  const store = createStore({ state: freshState(1000, [duckItem(9)]) });
  assert.equal(store.floorSell({ itemId: 'c-duck', quantity: SESSION_SELL_CAP + 1 }, now).ok, false);
  assert.equal(store.floorSell({ itemId: 'c-duck', quantity: SESSION_SELL_CAP }, now).ok, true);
  assert.equal(store.floorSell({ itemId: 'c-duck', quantity: 1 }, now).ok, false, 'cap should be spent');
  assert.equal(store.floorSell({ itemId: 'c-duck', quantity: 1 }, CALM).ok, false, 'floor closed');
  assert.equal(store.floorSell({ itemId: 'ghost', quantity: 1 }, now).ok, false, 'unknown item');

  const offSession = findSession((candidate) => !hasDuck(candidate));
  const store2 = createStore({ state: freshState(1000, [duckItem(1)]) });
  assert.equal(store2.floorSell({ itemId: 'c-duck', quantity: 1 }, offSession.start + 60000).ok, false, 'not in lineup');
});

test('bell participation requires at least a couple lineup items', () => {
  const session = findSession(hasDuck);
  const now = session.start + 6 * 60000;
  const store = createStore({ state: freshState(1000, [duckItem(1)]) });
  const checkin = store.bellCheckin(now);
  assert.equal(checkin.ok, false);
  assert.equal(checkin.eligibility.required, MIN_BELL_ITEMS_TO_JOIN);
  assert.equal(checkin.eligibility.owned, 1);
  assert.equal(store.floorSell({ itemId: 'c-duck', quantity: 1 }, now).ok, false);
});

test('bell streak: consecutive days increment, one missed day burns a freeze, two reset', () => {
  const store = createStore({ state: freshState(100000, bellBag()) });
  const day1 = findSession(() => true, new Date(2026, 6, 6, 12, 0, 0).getTime());
  assert.equal(store.bellCheckin(day1.start + 60000).streak.days, 1);
  // same session twice: no double count
  assert.equal(store.bellCheckin(day1.start + 120000).streak.bellsRung, 1);
  const day2 = liveSessionAt(day1.start + 86400000 + 60000);
  assert.equal(store.bellCheckin(day2.start + 60000).streak.days, 2);
  // skip one day → freeze absorbs it
  const day4 = liveSessionAt(day2.start + 2 * 86400000 + 60000);
  const afterFreeze = store.bellCheckin(day4.start + 60000);
  assert.equal(afterFreeze.streak.days, 3);
  assert.equal(afterFreeze.streak.freezes, STREAK_FREEZES - 1);
  // skip two days → reset
  const day7 = liveSessionAt(day4.start + 3 * 86400000 + 60000);
  const afterBreak = store.bellCheckin(day7.start + 60000);
  assert.equal(afterBreak.streak.days, 1);
  assert.equal(afterBreak.streak.freezes, STREAK_FREEZES);
});

test('checkin refuses when the floor is closed', () => {
  const store = createStore({ state: freshState() });
  assert.equal(store.bellCheckin(CALM).ok, false);
});

test('paper trades ride the session boost too', () => {
  const session = findSession(hasDuck);
  const now = session.start + 3 * 60000;
  const store = createStore({ state: freshState(1000000) });
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'buy', shares: 1 }, now);
  assert.equal(result.price, bellPriceAt(getTicker('DUCK'), now));
});
