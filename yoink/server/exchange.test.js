import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TICKERS,
  TIMEFRAMES,
  PERSONALITY_VOL,
  MAX_BUYS_PER_TICKER_PER_DAY,
  MAX_CANDLES,
  ROOKIE_TRADES,
  candlesFor,
  priceAt,
  sparkline,
  decorateTicker,
  getTicker,
  jumpAt,
  volClusterAt,
} from './exchange.js';

const JUMP_WINDOW_BLOCKS = 24;
import { createStore } from './store.js';

const NOW = Date.parse('2026-07-04T15:00:00');

const freshState = (balance = 100000) => ({
  wallet: { balance, streak: 0, lastClaimDay: null, lastSpinDay: null },
  orders: [],
  collection: [],
  dropNotify: [],
  questClaims: [],
  orderSeq: 1000,
  exchange: { positions: {}, trades: [], rookieLeft: ROOKIE_TRADES },
});

test('priceAt is deterministic and positive for every ticker', () => {
  for (const ticker of TICKERS) {
    const a = priceAt(ticker, NOW);
    const b = priceAt(ticker, NOW);
    assert.equal(a, b);
    assert.ok(a >= 1);
  }
});

test('priceAt stays within the clamped band around the retail anchor', () => {
  for (const ticker of TICKERS) {
    const vol = PERSONALITY_VOL[ticker.personality];
    // log deviation is hard-clamped at vol × 3.5
    const band = Math.exp(vol * 3.5) * 1.001;
    for (let i = 0; i < 200; i += 1) {
      const price = priceAt(ticker, NOW + i * 37 * 60000);
      // ±1 absorbs integer rounding at the clamp edge
      assert.ok(price >= ticker.base / band - 1 && price <= ticker.base * band + 1, `${ticker.id} out of band: ${price}`);
    }
  }
});

test('volatility clustering: local vol varies meaningfully over days', () => {
  const ticker = getTicker('FLIP');
  let min = Infinity;
  let max = 0;
  for (let i = 0; i < 200; i += 1) {
    const v = volClusterAt(ticker, NOW + i * 29 * 60000);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  assert.ok(max / min > 1.3, `cluster range too flat: ${min}–${max}`);
  assert.ok(min > 0.4 && max < 2.2);
});

test('jump diffusion: shocks exist, are bounded, and decay over time', () => {
  const ticker = getTicker('HOLO'); // wild → most jumps
  let jumpBlockStart = null;
  for (let i = 0; i < 7 * 24 * 6 && jumpBlockStart === null; i += 1) {
    const at = NOW + i * 10 * 60000;
    if (Math.abs(jumpAt(ticker, at)) > 0.01) jumpBlockStart = at;
  }
  assert.notEqual(jumpBlockStart, null, 'no jump found in a simulated week of a wild ticker');
  assert.equal(jumpAt(ticker, jumpBlockStart), jumpAt(ticker, jumpBlockStart));
  // far from any window the shock has decayed to ~nothing
  assert.ok(Math.abs(jumpAt(ticker, jumpBlockStart)) <= PERSONALITY_VOL.wild * 6 * (JUMP_WINDOW_BLOCKS + 1));
});

test('prices actually move over time', () => {
  const ticker = getTicker('DUCK');
  const seen = new Set();
  for (let i = 0; i < 20; i += 1) seen.add(priceAt(ticker, NOW + i * 5 * 60000));
  assert.ok(seen.size > 5);
});

test('different tickers move differently', () => {
  const a = sparkline(getTicker('DUCK'), NOW);
  const b = sparkline(getTicker('BOBA'), NOW);
  assert.notDeepEqual(a.map((p, i) => p / a[0] - b[i] / b[0]).every((d) => d === 0), true);
});

test('sparkline ends at the current price', () => {
  const ticker = getTicker('TAMA');
  const spark = sparkline(ticker, NOW);
  assert.equal(spark.length, 28);
  assert.equal(spark[spark.length - 1], priceAt(ticker, NOW));
});

test('decorateTicker reports change vs the day open', () => {
  const decorated = decorateTicker(getTicker('FLIP'), NOW);
  assert.equal(typeof decorated.changePct, 'number');
  assert.ok(decorated.price > 0 && decorated.open > 0);
});

test('candles are coherent OHLC for every timeframe', () => {
  const ticker = getTicker('TAMA');
  for (const tf of Object.keys(TIMEFRAMES)) {
    const candles = candlesFor(ticker, tf, 48, NOW);
    assert.equal(candles.length, 48);
    for (const candle of candles) {
      assert.ok(candle.h >= Math.max(candle.o, candle.c), `${tf} high below body`);
      assert.ok(candle.l <= Math.min(candle.o, candle.c), `${tf} low above body`);
      assert.ok(candle.v >= 1);
    }
  }
});

test('candles form a continuous tape: each close is the next open', () => {
  const candles = candlesFor(getTicker('DUCK'), '5m', 30, NOW);
  for (let i = 0; i < candles.length - 1; i += 1) {
    assert.equal(candles[i].c, candles[i + 1].o, `gap between candle ${i} and ${i + 1}`);
  }
});

test('candles are deterministic and the last one is the live partial candle', () => {
  const ticker = getTicker('BEAN');
  assert.deepEqual(candlesFor(ticker, '1m', 20, NOW), candlesFor(ticker, '1m', 20, NOW));
  const candles = candlesFor(ticker, '1m', 20, NOW);
  assert.equal(candles[candles.length - 1].c, priceAt(ticker, NOW));
});

test('candlesFor rejects junk and clamps count', () => {
  const ticker = getTicker('DUCK');
  assert.equal(candlesFor(ticker, '3m', 48, NOW), null);
  assert.equal(candlesFor(ticker, '5m', 9999, NOW).length, MAX_CANDLES);
  assert.equal(candlesFor(ticker, '5m', -3, NOW).length, 48);
});

test('store.getCandles validates the ticker', () => {
  const store = createStore({ state: freshState() });
  assert.equal(store.getCandles('FAKE', '5m', 48, NOW), null);
  assert.equal(store.getCandles('DUCK', '3m', 48, NOW), null);
  const result = store.getCandles('DUCK', '5m', 12, NOW);
  assert.equal(result.candles.length, 12);
  assert.equal(result.price, priceAt(getTicker('DUCK'), NOW));
});

test('getExchange lists all tickers with positions folded in', () => {
  const store = createStore({ state: freshState() });
  const exchange = store.getExchange(NOW);
  assert.equal(exchange.tickers.length, TICKERS.length);
  assert.equal(exchange.portfolio.value, 0);
  assert.equal(exchange.rookieLeft, ROOKIE_TRADES);
  assert.ok(exchange.tickers.every((ticker) => ticker.buysLeftToday === MAX_BUYS_PER_TICKER_PER_DAY));
});

test('buying deducts coins and builds a position at the live price', () => {
  const store = createStore({ state: freshState(100000) });
  const price = priceAt(getTicker('DUCK'), NOW);
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'buy', shares: 3 }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.total, price * 3);
  assert.equal(result.wallet.balance, 100000 - price * 3);
  assert.equal(result.position.shares, 3);
  assert.equal(result.position.avgCost, price);
});

test('buying beyond the wallet fails', () => {
  const store = createStore({ state: freshState(10) });
  const result = store.tradeExchange({ tickerId: 'HOLO', side: 'buy', shares: 1 }, NOW);
  assert.equal(result.ok, false);
  assert.ok(result.shortBy > 0);
});

test('selling shares you do not hold fails', () => {
  const store = createStore({ state: freshState() });
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'sell', shares: 1 }, NOW);
  assert.equal(result.ok, false);
});

test('daily per-ticker buy cap enforced, resets next day', () => {
  const store = createStore({ state: freshState(1000000) });
  for (let i = 0; i < MAX_BUYS_PER_TICKER_PER_DAY; i += 1) {
    assert.equal(store.tradeExchange({ tickerId: 'MOCH', side: 'buy', shares: 1 }, NOW).ok, true);
  }
  const blocked = store.tradeExchange({ tickerId: 'MOCH', side: 'buy', shares: 1 }, NOW);
  assert.equal(blocked.ok, false);
  assert.match(blocked.error, /still sell/);
  // other tickers unaffected
  assert.equal(store.tradeExchange({ tickerId: 'DUCK', side: 'buy', shares: 1 }, NOW).ok, true);
  // next day the cap resets
  const tomorrow = NOW + 24 * 3600 * 1000;
  assert.equal(store.tradeExchange({ tickerId: 'MOCH', side: 'buy', shares: 1 }, tomorrow).ok, true);
});

test('selling is never capped — you can always exit, even when buys are tapped out', () => {
  const store = createStore({ state: freshState(1000000) });
  for (let i = 0; i < MAX_BUYS_PER_TICKER_PER_DAY; i += 1) {
    assert.equal(store.tradeExchange({ tickerId: 'MOCH', side: 'buy', shares: 2 }, NOW).ok, true);
  }
  // buys exhausted, now unwind the whole position in many small sells
  for (let i = 0; i < MAX_BUYS_PER_TICKER_PER_DAY * 2; i += 1) {
    assert.equal(store.tradeExchange({ tickerId: 'MOCH', side: 'sell', shares: 1 }, NOW).ok, true, `sell ${i} blocked`);
  }
  assert.equal(store.getExchange(NOW).tickers.find((t) => t.id === 'MOCH').shares, 0);
});

test('avgCost is weighted across buys at different prices', () => {
  const store = createStore({ state: freshState(1000000) });
  const ticker = getTicker('TAMA');
  const later = NOW + 47 * 60000;
  const p1 = priceAt(ticker, NOW);
  const p2 = priceAt(ticker, later);
  assert.notEqual(p1, p2);
  store.tradeExchange({ tickerId: 'TAMA', side: 'buy', shares: 2 }, NOW);
  const result = store.tradeExchange({ tickerId: 'TAMA', side: 'buy', shares: 3 }, later);
  assert.equal(result.position.shares, 5);
  assert.equal(result.position.avgCost, Math.round((p1 * 2 + p2 * 3) / 5));
});

test('rookie floor caps a losing sell at 10% and burns one insured trade', () => {
  const state = freshState(0);
  state.exchange.positions.DUCK = { shares: 2, avgCost: 999999 };
  const store = createStore({ state });
  const price = priceAt(getTicker('DUCK'), NOW);
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'sell', shares: 2 }, NOW);
  const basis = 999999 * 2;
  const floorProceeds = basis - Math.round(basis * 0.1);
  assert.equal(result.ok, true);
  assert.equal(result.refund, floorProceeds - price * 2);
  assert.equal(result.wallet.balance, floorProceeds);
  assert.equal(result.rookieLeft, ROOKIE_TRADES - 1);
});

test('rookie floor does not apply once exhausted', () => {
  const state = freshState(0);
  state.exchange.rookieLeft = 0;
  state.exchange.positions.DUCK = { shares: 1, avgCost: 999999 };
  const store = createStore({ state });
  const price = priceAt(getTicker('DUCK'), NOW);
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'sell', shares: 1 }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.refund, 0);
  assert.equal(result.wallet.balance, price);
});

test('profitable sells never touch rookie insurance', () => {
  const state = freshState(0);
  state.exchange.positions.DUCK = { shares: 1, avgCost: 1 };
  const store = createStore({ state });
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'sell', shares: 1 }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.refund, 0);
  assert.equal(result.rookieLeft, ROOKIE_TRADES);
});

test('a profitable sell reports realized profit and banks it in the wallet', () => {
  const state = freshState(500);
  state.exchange.positions.DUCK = { shares: 2, avgCost: 10 };
  const store = createStore({ state });
  const price = priceAt(getTicker('DUCK'), NOW);
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'sell', shares: 2 }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.realized, price * 2 - 20);
  assert.equal(result.wallet.balance, 500 + price * 2);
});

test('an insured losing sell reports the softened realized loss', () => {
  const state = freshState(0);
  state.exchange.positions.DUCK = { shares: 1, avgCost: 999999 };
  const store = createStore({ state });
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'sell', shares: 1 }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.realized, -Math.round(999999 * 0.1));
});

test('buys report zero realized P/L', () => {
  const store = createStore({ state: freshState(100000) });
  const result = store.tradeExchange({ tickerId: 'DUCK', side: 'buy', shares: 1 }, NOW);
  assert.equal(result.realized, 0);
});

test('portfolio sums realized P/L for today only', () => {
  const state = freshState(0);
  state.exchange.trades = [
    { tickerId: 'DUCK', side: 'sell', shares: 1, price: 100, realized: 40, day: '2026-07-04', at: NOW - 3600000 },
    { tickerId: 'TAMA', side: 'sell', shares: 1, price: 100, realized: -15, day: '2026-07-04', at: NOW - 60000 },
    { tickerId: 'DUCK', side: 'sell', shares: 1, price: 100, realized: 900, day: '2026-07-03', at: NOW - 90000000 },
    { tickerId: 'DUCK', side: 'buy', shares: 1, price: 100, day: '2026-07-04', at: NOW - 500 },
  ];
  const store = createStore({ state });
  assert.equal(store.getExchange(NOW).portfolio.realizedToday, 25);
});

test('portfolio valuation tracks live prices', () => {
  const state = freshState(0);
  state.exchange.positions.DUCK = { shares: 4, avgCost: 100 };
  const store = createStore({ state });
  const exchange = store.getExchange(NOW);
  const duck = exchange.tickers.find((ticker) => ticker.id === 'DUCK');
  assert.equal(exchange.portfolio.value, duck.price * 4);
  assert.equal(exchange.portfolio.cost, 400);
});

test('old db files without exchange state are backfilled', () => {
  const state = freshState();
  delete state.exchange;
  const store = createStore({ state });
  assert.equal(store.getExchange(NOW).rookieLeft, ROOKIE_TRADES);
});
