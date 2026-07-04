// Yoink backend store: wallet, daily allowance, spin, orders with
// accelerated fake tracking, and the delivered-item collection.
// Persists to a JSON file; all time-dependent logic takes `now` so tests
// can drive the clock.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { makeMarketFeed, MARKET_MAX_ITEMS, dropItems, questDefs } from '../src/data.js';
import { getCheckoutTotals } from '../src/cart.js';

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
  };
}

export function createStore({ file = null, state = null, random = Math.random } = {}) {
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

  const save = () => {
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
  };
}
