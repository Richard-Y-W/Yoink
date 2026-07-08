// Yoink backend store: wallet, daily allowance, spin, orders with
// accelerated fake tracking, and the delivered-item collection.
// Persists to a JSON file; all time-dependent logic takes `now` so tests
// can drive the clock.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { makeMarketFeed, MARKET_MAX_ITEMS, dropItems, questDefs } from '../src/data.js';
import { getCheckoutTotals } from '../src/cart.js';
import { resolveArtKind } from '../src/itemArt.js';
import {
  FLOOR_BUY_MARKUP,
  FLOOR_FEE,
  MIN_BELL_ITEMS_TO_JOIN,
  PLAYER_IMPACT_CAP,
  PLAYER_IMPACT_PER_ITEM,
  SESSION_BUY_CAP,
  SESSION_SELL_CAP,
  STREAK_FREEZES,
  bellPriceAt,
  decayedImpact,
  floorReportFor,
  lastClosedSession,
  lineupFor,
  liveSessionAt,
  nextSessionAfter,
  rumorAisleFor,
  simTradesFor,
} from './bell.js';
import {
  TICKERS,
  MAX_BUYS_PER_TICKER_PER_DAY,
  MAX_SHARES_PER_TRADE,
  ROOKIE_TRADES,
  ROOKIE_MAX_LOSS,
  candlesFor,
  decorateTicker,
  getTicker,
} from './exchange.js';

export const ALLOWANCE_MIN = 500;
export const ALLOWANCE_MAX = 1000;
export const STREAK_BONUS_EVERY = 7;
export const STREAK_BONUS = 700;

// Wheel segments, clockwise from the pointer. Index is returned so the UI
// can land the wheel on the right slice.
export const SPIN_SEGMENTS = [120, 40, 500, 80, 250, 800];

// Accelerated tracking: seconds since placement → status.
export const ORDER_STAGES = [
  { id: 'processing', label: 'Processing', at: 0 },
  { id: 'packed', label: 'Packed', at: 30 },
  { id: 'shipped', label: 'Shipped', at: 90 },
  { id: 'out-for-delivery', label: 'Out for delivery', at: 150 },
  { id: 'delivered', label: 'Delivered', at: 240 },
];

export function orderStage(placedAt, now = Date.now()) {
  const elapsed = Math.max(0, (now - placedAt) / 1000);
  let stage = ORDER_STAGES[0];
  for (const candidate of ORDER_STAGES) {
    if (elapsed >= candidate.at) stage = candidate;
  }
  return stage;
}

export function localDay(now = Date.now()) {
  return new Date(now).toLocaleDateString('en-CA');
}

// Weekly quests reset on Monday; the key is that Monday's date.
export function localWeek(now = Date.now()) {
  const date = new Date(now);
  const sinceMonday = (date.getDay() + 6) % 7;
  return localDay(now - sinceMonday * 24 * 60 * 60 * 1000);
}

function defaultState() {
  return {
    wallet: { balance: 2480, streak: 6, lastClaimDay: null, lastSpinDay: null },
    orders: [],
    collection: [],
    dropNotify: [],
    questClaims: [],
    orderSeq: 1000,
    exchange: { positions: {}, trades: [], rookieLeft: ROOKIE_TRADES },
    bell: { sales: [], buys: [], flow: [], attendance: [], streak: 0, streakDay: null, freezes: STREAK_FREEZES, bellsRung: 0 },
  };
}

export function createStore({ file = null, state = null, random = Math.random, persist = null, shared = null } = {}) {
  let data = state ?? null;

  if (!data && file && existsSync(file)) {
    try {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      data = null;
    }
  }
  if (!data) data = defaultState();
  if (!Array.isArray(data.questClaims)) data.questClaims = [];
  if (!data.exchange || typeof data.exchange !== 'object') {
    data.exchange = { positions: {}, trades: [], rookieLeft: ROOKIE_TRADES };
  }
  if (!data.bell || typeof data.bell !== 'object') {
    data.bell = { sales: [], buys: [], flow: [], attendance: [], streak: 0, streakDay: null, freezes: STREAK_FREEZES, bellsRung: 0 };
  }
  if (!Array.isArray(data.bell.buys)) data.bell.buys = [];
  if (!Array.isArray(data.bell.flow)) data.bell.flow = [];

  // Market flow (player impact on the tape) lives in `shared` when many
  // users trade one market (see hub.js); solo stores fall back to their
  // own bell state so legacy tests/dev behave identically.
  const market = shared ?? data.bell;
  if (!Array.isArray(market.flow)) market.flow = [];

  const save = () => {
    if (persist) return persist(data);
    if (!file) return;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(data, null, 2));
  };
  save();

  const getWallet = (now = Date.now()) => ({
    balance: data.wallet.balance,
    streak: data.wallet.streak,
    canClaim: data.wallet.lastClaimDay !== localDay(now),
    canSpin: data.wallet.lastSpinDay !== localDay(now),
  });

  const claimAllowance = (now = Date.now()) => {
    const day = localDay(now);
    if (data.wallet.lastClaimDay === day) {
      return { ok: false, error: 'Already claimed today', wallet: getWallet(now) };
    }
    const base = ALLOWANCE_MIN + Math.floor(random() * (ALLOWANCE_MAX - ALLOWANCE_MIN + 1));
    data.wallet.streak += 1;
    const bonus = data.wallet.streak % STREAK_BONUS_EVERY === 0 ? STREAK_BONUS : 0;
    data.wallet.balance += base + bonus;
    data.wallet.lastClaimDay = day;
    save();
    return { ok: true, amount: base, bonus, wallet: getWallet(now) };
  };

  const spin = (now = Date.now()) => {
    const day = localDay(now);
    if (data.wallet.lastSpinDay === day) {
      return { ok: false, error: 'Come back tomorrow for another spin', wallet: getWallet(now) };
    }
    const segment = Math.floor(random() * SPIN_SEGMENTS.length) % SPIN_SEGMENTS.length;
    const reward = SPIN_SEGMENTS[segment];
    data.wallet.balance += reward;
    data.wallet.lastSpinDay = day;
    save();
    return { ok: true, reward, segment, wallet: getWallet(now) };
  };

  const getFeed = (start = 0, count = 8) => {
    const safeStart = Math.max(0, Math.min(Number(start) || 0, MARKET_MAX_ITEMS));
    const safeCount = Math.max(0, Math.min(Number(count) || 0, MARKET_MAX_ITEMS - safeStart));
    return { items: makeMarketFeed(safeStart, safeCount), total: MARKET_MAX_ITEMS };
  };

  const questKey = (quest, now) => `${quest.id}|${quest.period === 'weekly' ? localWeek(now) : localDay(now)}`;

  const getQuests = (now = Date.now()) => questDefs.map((quest) => {
    const claimed = data.questClaims.includes(questKey(quest, now));
    return { ...quest, claimed, claimable: !claimed && quest.have >= quest.goal };
  });

  const claimQuest = (questId, now = Date.now()) => {
    const quest = questDefs.find((candidate) => candidate.id === questId);
    if (!quest) return { ok: false, error: 'Unknown quest' };
    if (quest.have < quest.goal) return { ok: false, error: 'Quest not finished yet' };
    const key = questKey(quest, now);
    if (data.questClaims.includes(key)) {
      return { ok: false, error: 'Already claimed', wallet: getWallet(now) };
    }
    data.questClaims.push(key);
    data.wallet.balance += quest.reward;
    save();
    return { ok: true, reward: quest.reward, wallet: getWallet(now) };
  };

  const getDrops = () => dropItems.map((item) => ({
    ...item,
    notifying: data.dropNotify.includes(item.id),
  }));

  const toggleDropNotify = (dropId) => {
    const id = Number(dropId);
    if (!dropItems.some((item) => item.id === id)) return { ok: false, error: 'Unknown drop' };
    data.dropNotify = data.dropNotify.includes(id)
      ? data.dropNotify.filter((existing) => existing !== id)
      : [...data.dropNotify, id];
    save();
    return { ok: true, notifying: data.dropNotify.includes(id) };
  };

  // Move items of newly delivered orders into the collection exactly once.
  const syncDeliveries = (now) => {
    let changed = false;
    for (const order of data.orders) {
      if (order.collected || orderStage(order.placedAt, now).id !== 'delivered') continue;
      order.collected = true;
      changed = true;
      for (const item of order.items) {
        const existing = data.collection.find((entry) => entry.id === item.id);
        if (existing) existing.quantity += item.quantity;
        else data.collection.push({ ...item, acquiredAt: now });
      }
    }
    if (changed) save();
  };

  const decorateOrder = (order, now) => {
    const stage = orderStage(order.placedAt, now);
    const stageIndex = ORDER_STAGES.findIndex((candidate) => candidate.id === stage.id);
    const nextStage = ORDER_STAGES[stageIndex + 1] ?? null;
    return {
      ...order,
      stage: stage.id,
      stageLabel: stage.label,
      stageIndex,
      nextStageIn: nextStage
        ? Math.max(0, Math.ceil(nextStage.at - (now - order.placedAt) / 1000))
        : 0,
    };
  };

  const placeOrder = ({ items = [], shippingPrice, promoCode = null, shippingLabel = 'Yoink Standard', addressLabel = 'Home', paymentLabel = 'Yoink Wallet' } = {}, now = Date.now()) => {
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, error: 'Your cart is empty' };
    }
    const cleanItems = items.map((item) => ({
      id: String(item.id ?? 'yoink-item'),
      title: String(item.title ?? 'Yoink item'),
      imageLabel: String(item.imageLabel ?? 'item'),
      imageUrl: String(item.imageUrl ?? ''),
      imageStripe: String(item.imageStripe ?? ''),
      seller: String(item.seller ?? 'yoink_seller'),
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));
    const totals = getCheckoutTotals(cleanItems, { shippingPrice, promoCode });
    if (totals.total > data.wallet.balance) {
      return {
        ok: false,
        error: 'Not enough coins',
        shortBy: totals.total - data.wallet.balance,
        wallet: getWallet(now),
      };
    }
    data.wallet.balance -= totals.total;
    data.orderSeq += 1;
    const order = {
      id: `YK-${data.orderSeq}`,
      items: cleanItems,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      discount: totals.discount,
      promoCode: totals.discount > 0 ? String(promoCode).trim().toUpperCase() : null,
      total: totals.total,
      shippingLabel,
      addressLabel,
      paymentLabel,
      placedAt: now,
      collected: false,
    };
    data.orders.unshift(order);
    save();
    return { ok: true, order: decorateOrder(order, now), wallet: getWallet(now) };
  };

  const getOrders = (now = Date.now()) => {
    syncDeliveries(now);
    return data.orders.map((order) => decorateOrder(order, now));
  };

  const getOrder = (orderId, now = Date.now()) => {
    syncDeliveries(now);
    const order = data.orders.find((candidate) => candidate.id === orderId);
    return order ? decorateOrder(order, now) : null;
  };

  const getCollection = (now = Date.now()) => {
    syncDeliveries(now);
    return data.collection;
  };

  // ── the price the whole store trades at ────────────────────────────────
  // Engine price (fBm + session story + sim order flow) times the player's
  // own decaying market impact. Every fill the player makes pushes the tape;
  // deterministic replay means candles show those pushes at the right bars.
  const pruneFlow = (now) => {
    market.flow = market.flow.filter((fill) => now - fill.at < 4 * 3600 * 1000);
  };

  const playerFlowImpact = (tickerId, t) => market.flow.reduce(
    (sum, fill) => (fill.tickerId === tickerId ? sum + decayedImpact(fill.delta, fill.at, t) : sum),
    0,
  );

  const floorPrice = (ticker, t) => {
    const price = bellPriceAt(ticker, t);
    const flow = playerFlowImpact(ticker.id, t);
    if (flow === 0) return price;
    return Math.max(1, Math.round(price * Math.exp(flow)));
  };

  const pushPlayerFlow = (tickerId, direction, qty, now) => {
    const delta = direction * Math.min(PLAYER_IMPACT_PER_ITEM * qty, PLAYER_IMPACT_CAP);
    market.flow.push({ tickerId, delta, at: now });
    pruneFlow(now);
  };

  const buysToday = (tickerId, now) => {
    const day = localDay(now);
    return data.exchange.trades.filter((trade) => trade.tickerId === tickerId && trade.day === day && trade.side === 'buy').length;
  };

  const getExchange = (now = Date.now()) => {
    const positions = data.exchange.positions;
    const tickers = TICKERS.map((ticker) => {
      const decorated = decorateTicker(ticker, now, floorPrice);
      const position = positions[ticker.id];
      return {
        ...decorated,
        shares: position?.shares ?? 0,
        avgCost: position?.avgCost ?? 0,
        buysLeftToday: Math.max(0, MAX_BUYS_PER_TICKER_PER_DAY - buysToday(ticker.id, now)),
      };
    });
    let value = 0;
    let cost = 0;
    let todayChange = 0;
    for (const ticker of tickers) {
      if (ticker.shares <= 0) continue;
      value += ticker.shares * ticker.price;
      cost += ticker.shares * ticker.avgCost;
      todayChange += ticker.shares * (ticker.price - ticker.open);
    }
    const today = localDay(now);
    const realizedToday = data.exchange.trades
      .filter((trade) => trade.day === today)
      .reduce((sum, trade) => sum + (trade.realized ?? 0), 0);
    return {
      tickers,
      portfolio: { value, cost, todayChange, realizedToday },
      rookieLeft: data.exchange.rookieLeft,
      wallet: getWallet(now),
    };
  };

  const getCandles = (tickerId, tf, count, now = Date.now()) => {
    const ticker = getTicker(String(tickerId ?? ''));
    if (!ticker) return null;
    const candles = candlesFor(ticker, tf, count, now, floorPrice);
    if (!candles) return null;
    return { tickerId: ticker.id, tf, candles, price: floorPrice(ticker, now) };
  };

  const tradeExchange = ({ tickerId, side, shares } = {}, now = Date.now()) => {
    const ticker = getTicker(String(tickerId ?? ''));
    if (!ticker) return { ok: false, error: 'Unknown ticker' };
    if (side !== 'buy' && side !== 'sell') return { ok: false, error: 'Side must be buy or sell' };
    const qty = Math.floor(Number(shares) || 0);
    if (qty < 1 || qty > MAX_SHARES_PER_TRADE) {
      return { ok: false, error: `Trade 1–${MAX_SHARES_PER_TRADE} shares at a time` };
    }

    const price = floorPrice(ticker, now);
    const positions = data.exchange.positions;
    const position = positions[ticker.id] ?? { shares: 0, avgCost: 0 };
    let refund = 0;
    let realized = 0;

    if (side === 'buy') {
      // Selling is never capped — you can always exit a position.
      if (buysToday(ticker.id, now) >= MAX_BUYS_PER_TICKER_PER_DAY) {
        return { ok: false, error: `$${ticker.id} buys are tapped out today — you can still sell` };
      }
      const totalCost = price * qty;
      if (totalCost > data.wallet.balance) {
        return { ok: false, error: 'Not enough coins', shortBy: totalCost - data.wallet.balance, wallet: getWallet(now) };
      }
      data.wallet.balance -= totalCost;
      const newShares = position.shares + qty;
      position.avgCost = Math.round((position.avgCost * position.shares + totalCost) / newShares);
      position.shares = newShares;
      positions[ticker.id] = position;
    } else {
      if (position.shares < qty) {
        return { ok: false, error: `You only hold ${position.shares} share${position.shares === 1 ? '' : 's'}` };
      }
      let proceeds = price * qty;
      const basis = position.avgCost * qty;
      // Rookie Floor: while insured trades remain, a losing sell can't cost
      // more than ROOKIE_MAX_LOSS of what was paid.
      if (proceeds < basis && data.exchange.rookieLeft > 0) {
        const floorProceeds = basis - Math.round(basis * ROOKIE_MAX_LOSS);
        refund = Math.max(0, floorProceeds - proceeds);
        proceeds += refund;
        data.exchange.rookieLeft -= 1;
      }
      realized = proceeds - basis;
      data.wallet.balance += proceeds;
      position.shares -= qty;
      if (position.shares === 0) delete positions[ticker.id];
      else positions[ticker.id] = position;
    }

    data.exchange.trades.push({ tickerId: ticker.id, side, shares: qty, price, realized, day: localDay(now), at: now });
    save();
    return {
      ok: true,
      tickerId: ticker.id,
      side,
      shares: qty,
      price,
      total: price * qty,
      refund,
      realized,
      rookieLeft: data.exchange.rookieLeft,
      buysLeftToday: Math.max(0, MAX_BUYS_PER_TICKER_PER_DAY - buysToday(ticker.id, now)),
      position: positions[ticker.id] ?? { shares: 0, avgCost: 0 },
      wallet: getWallet(now),
    };
  };

  // ── The Bell: session floor, attendance streak ─────────────────────────

  const sessionSales = (key) => data.bell.sales.filter((sale) => sale.key === key);
  const sessionSoldCount = (key) => sessionSales(key).reduce((sum, sale) => sum + sale.qty, 0);
  const sessionBanked = (key) => sessionSales(key).reduce((sum, sale) => sum + sale.net, 0);
  const sessionBoughtCount = (key) => data.bell.buys
    .filter((buy) => buy.key === key)
    .reduce((sum, buy) => sum + buy.qty, 0);

  // Duolingo-style daily streak: consecutive days with at least one bell
  // attended. A single missed day burns a freeze instead of the streak;
  // freezes refill at every 7-day milestone.
  const markAttendance = (session, now) => {
    if (data.bell.attendance.includes(session.key)) return false;
    data.bell.attendance.push(session.key);
    data.bell.bellsRung += 1;
    const day = localDay(now);
    if (data.bell.streakDay !== day) {
      if (!data.bell.streakDay) {
        data.bell.streak = 1;
      } else {
        const gap = Math.round((Date.parse(day) - Date.parse(data.bell.streakDay)) / 86400000);
        if (gap === 1) {
          data.bell.streak += 1;
        } else if (gap === 2 && data.bell.freezes > 0) {
          data.bell.freezes -= 1;
          data.bell.streak += 1;
        } else {
          data.bell.streak = 1;
          data.bell.freezes = STREAK_FREEZES;
        }
      }
      if (data.bell.streak % 7 === 0) data.bell.freezes = STREAK_FREEZES;
      data.bell.streakDay = day;
    }
    return true;
  };

  const holdingsFor = (artKind) => data.collection
    .filter((entry) => resolveArtKind(entry) === artKind)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      quantity: entry.quantity,
      unitPrice: Number(entry.unitPrice) || 0,
    }));

  const decorateLineup = (session, now, revealAll) => lineupFor(session)
    .filter((entry) => revealAll || entry.role === 'confirmed')
    .map((entry) => {
      const price = floorPrice(entry.ticker, now);
      const holdings = holdingsFor(entry.ticker.artKind);
      return {
        tickerId: entry.ticker.id,
        name: entry.ticker.name,
        artKind: entry.ticker.artKind,
        role: entry.role,
        base: entry.ticker.base,
        price,
        ask: Math.max(1, Math.round(price * (1 + FLOOR_BUY_MARKUP))),
        multPct: Math.round((price / entry.ticker.base - 1) * 100),
        own: holdings.reduce((sum, holding) => sum + holding.quantity, 0),
        holdings,
      };
    });

  const bellOwnedCount = (session) => lineupFor(session).reduce((sum, entry) => (
    sum + holdingsFor(entry.ticker.artKind).reduce((holdingSum, holding) => holdingSum + holding.quantity, 0)
  ), 0);

  const bellEligibility = (session) => {
    const owned = bellOwnedCount(session);
    return {
      owned,
      required: MIN_BELL_ITEMS_TO_JOIN,
      ok: owned >= MIN_BELL_ITEMS_TO_JOIN,
    };
  };

  // The player's floor sales as report entries, ranked against the sim
  // traders — the leaderboard only means something if "you" are on it.
  const playerFloorTrades = (session) => {
    const lineup = lineupFor(session);
    return sessionSales(session.key).map((sale) => {
      const basis = sale.net - sale.realized;
      return {
        trader: 'you',
        tickerId: sale.tickerId,
        role: lineup.find((entry) => entry.ticker.id === sale.tickerId)?.role ?? 'confirmed',
        qty: sale.qty,
        pct: basis > 0 ? Math.round((sale.realized / basis) * 100) : 0,
      };
    });
  };

  const getBell = (now = Date.now()) => {
    syncDeliveries(now);
    const live = liveSessionAt(now);
    const next = nextSessionAfter(now);
    const closed = lastClosedSession(now);
    const report = floorReportFor(closed, playerFloorTrades(closed));
    return {
      now,
      live: live
        ? {
          key: live.key,
          endsAt: live.end,
          closesInMs: Math.max(0, live.end - now),
          lineup: decorateLineup(live, now, true),
          sellsLeft: Math.max(0, SESSION_SELL_CAP - sessionSoldCount(live.key)),
          sellCap: SESSION_SELL_CAP,
          buysLeft: Math.max(0, SESSION_BUY_CAP - sessionBoughtCount(live.key)),
          buyCap: SESSION_BUY_CAP,
          banked: sessionBanked(live.key),
          attended: data.bell.attendance.includes(live.key),
          eligibility: bellEligibility(live),
          events: simTradesFor(live),
        }
        : null,
      next: {
        startsAt: next.start,
        opensInMs: Math.max(0, next.start - now),
        confirmed: decorateLineup(next, now, false),
        rumorAisle: rumorAisleFor(next),
      },
      lastReport: {
        ...report,
        playerBanked: sessionBanked(report.key),
        attended: data.bell.attendance.includes(report.key),
      },
      streak: { days: data.bell.streak, freezes: data.bell.freezes, bellsRung: data.bell.bellsRung },
    };
  };

  const bellCheckin = (now = Date.now()) => {
    const live = liveSessionAt(now);
    if (!live) return { ok: false, error: 'The floor is closed' };
    syncDeliveries(now);
    const eligibility = bellEligibility(live);
    if (!eligibility.ok) {
      return {
        ok: false,
        error: `Bring at least ${eligibility.required} bell items to join — you have ${eligibility.owned}`,
        eligibility,
      };
    }
    const first = markAttendance(live, now);
    save();
    return {
      ok: true,
      first,
      eligibility,
      streak: { days: data.bell.streak, freezes: data.bell.freezes, bellsRung: data.bell.bellsRung },
    };
  };

  const floorSell = ({ itemId, quantity } = {}, now = Date.now()) => {
    const live = liveSessionAt(now);
    if (!live) return { ok: false, error: 'The floor is closed — sell when the bell rings' };
    syncDeliveries(now);
    const alreadyAttended = data.bell.attendance.includes(live.key);
    const eligibility = bellEligibility(live);
    if (!alreadyAttended && !eligibility.ok) {
      return {
        ok: false,
        error: `The bell needs a couple items to play — you have ${eligibility.owned}/${eligibility.required}`,
        eligibility,
      };
    }
    const entry = data.collection.find((candidate) => candidate.id === String(itemId ?? ''));
    if (!entry) return { ok: false, error: 'You don’t own that item' };
    const kind = resolveArtKind(entry);
    const lineupEntry = lineupFor(live).find((candidate) => candidate.ticker.artKind === kind);
    if (!lineupEntry) return { ok: false, error: `${entry.title} isn’t on the floor this session` };
    const qty = Math.floor(Number(quantity) || 0);
    if (qty < 1) return { ok: false, error: 'Sell at least 1' };
    if (qty > entry.quantity) return { ok: false, error: `You only have ${entry.quantity}` };
    const used = sessionSoldCount(live.key);
    if (used + qty > SESSION_SELL_CAP) {
      return { ok: false, error: `The floor takes ${SESSION_SELL_CAP} items per session — ${Math.max(0, SESSION_SELL_CAP - used)} left` };
    }

    const ticker = lineupEntry.ticker;
    const basis = Number(entry.unitPrice) || ticker.base;
    // Sells fill at the market price, whatever you paid — that's an
    // exchange. Your edge is the spread between basis and the live tape.
    const unit = floorPrice(ticker, now);
    const gross = unit * qty;
    const fee = Math.round(gross * FLOOR_FEE);
    const net = gross - fee;
    const realized = net - basis * qty;

    data.wallet.balance += net;
    pushPlayerFlow(ticker.id, -1, qty, now);
    entry.quantity -= qty;
    if (entry.quantity <= 0) data.collection = data.collection.filter((candidate) => candidate !== entry);
    data.bell.sales.push({
      key: live.key,
      itemId: entry.id,
      title: entry.title,
      tickerId: ticker.id,
      qty,
      unit,
      fee,
      net,
      realized,
      at: now,
    });
    markAttendance(live, now);
    save();
    return {
      ok: true,
      tickerId: ticker.id,
      qty,
      unit,
      gross,
      fee,
      net,
      realized,
      sellsLeft: Math.max(0, SESSION_SELL_CAP - sessionSoldCount(live.key)),
      banked: sessionBanked(live.key),
      wallet: getWallet(now),
      streak: { days: data.bell.streak, freezes: data.bell.freezes, bellsRung: data.bell.bellsRung },
    };
  };

  // Buy on the live floor: fills instantly at the ask (market + spread),
  // lands straight in the collection as a real item, and pushes the tape
  // up. The shop stays the calm MSRP door; this is the thrill door.
  const floorBuy = ({ tickerId, quantity } = {}, now = Date.now()) => {
    const live = liveSessionAt(now);
    if (!live) return { ok: false, error: 'The floor is closed — buy when the bell rings' };
    syncDeliveries(now);
    const alreadyAttended = data.bell.attendance.includes(live.key);
    const eligibility = bellEligibility(live);
    if (!alreadyAttended && !eligibility.ok) {
      return {
        ok: false,
        error: `The bell needs a couple items to play — you have ${eligibility.owned}/${eligibility.required}`,
        eligibility,
      };
    }
    const lineupEntry = lineupFor(live).find((candidate) => candidate.ticker.id === String(tickerId ?? ''));
    if (!lineupEntry) return { ok: false, error: 'That ticker isn’t on the floor this session' };
    const qty = Math.floor(Number(quantity) || 0);
    if (qty < 1) return { ok: false, error: 'Buy at least 1' };
    const bought = sessionBoughtCount(live.key);
    if (bought + qty > SESSION_BUY_CAP) {
      return { ok: false, error: `The floor fills ${SESSION_BUY_CAP} buys per session — ${Math.max(0, SESSION_BUY_CAP - bought)} left` };
    }

    const ticker = lineupEntry.ticker;
    const unit = Math.max(1, Math.round(floorPrice(ticker, now) * (1 + FLOOR_BUY_MARKUP)));
    const total = unit * qty;
    if (total > data.wallet.balance) {
      return { ok: false, error: 'Not enough coins', shortBy: total - data.wallet.balance, wallet: getWallet(now) };
    }

    data.wallet.balance -= total;
    // One floor position per ticker; repeat buys average into the basis.
    const id = `floor-${ticker.id}`;
    const existing = data.collection.find((candidate) => candidate.id === id);
    if (existing) {
      const newQty = existing.quantity + qty;
      existing.unitPrice = Math.round(((Number(existing.unitPrice) || 0) * existing.quantity + total) / newQty);
      existing.quantity = newQty;
    } else {
      data.collection.push({
        id,
        title: ticker.name,
        imageLabel: ticker.name,
        imageStripe: '',
        seller: 'the_floor',
        unitPrice: unit,
        quantity: qty,
        acquiredAt: now,
      });
    }
    data.bell.buys.push({ key: live.key, tickerId: ticker.id, qty, unit, total, at: now });
    pushPlayerFlow(ticker.id, 1, qty, now);
    markAttendance(live, now);
    save();
    return {
      ok: true,
      tickerId: ticker.id,
      qty,
      unit,
      total,
      buysLeft: Math.max(0, SESSION_BUY_CAP - sessionBoughtCount(live.key)),
      wallet: getWallet(now),
      streak: { days: data.bell.streak, freezes: data.bell.freezes, bellsRung: data.bell.bellsRung },
    };
  };

  const seedBellInventory = (now = Date.now(), quantity = 2) => {
    const live = liveSessionAt(now);
    if (!live) return { ok: false, error: 'No live bell to seed' };
    const seeded = [];
    for (const entry of lineupFor(live)) {
      const id = `dev-${live.key}-${entry.ticker.id}`;
      const existing = data.collection.find((candidate) => candidate.id === id);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, quantity);
      } else {
        data.collection.push({
          id,
          title: entry.ticker.name,
          imageLabel: entry.ticker.name,
          imageStripe: '',
          seller: 'dev_floor',
          unitPrice: entry.ticker.base,
          quantity,
          acquiredAt: now,
        });
      }
      seeded.push({
        id,
        tickerId: entry.ticker.id,
        name: entry.ticker.name,
        role: entry.role,
        quantity,
      });
    }
    save();
    return { ok: true, liveKey: live.key, seeded, collection: data.collection };
  };

  const resetBellSessionSales = (now = Date.now()) => {
    const live = liveSessionAt(now);
    if (!live) return { ok: false, error: 'No live bell to reset' };
    const before = data.bell.sales.length;
    data.bell.sales = data.bell.sales.filter((sale) => sale.key !== live.key);
    save();
    return { ok: true, liveKey: live.key, removed: before - data.bell.sales.length };
  };

  return {
    getWallet,
    claimAllowance,
    spin,
    getFeed,
    getQuests,
    claimQuest,
    getDrops,
    toggleDropNotify,
    placeOrder,
    getOrders,
    getOrder,
    getCollection,
    getExchange,
    getCandles,
    tradeExchange,
    getBell,
    bellCheckin,
    floorSell,
    floorBuy,
    seedBellInventory,
    resetBellSessionSales,
  };
}
