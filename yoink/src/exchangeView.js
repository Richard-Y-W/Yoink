// Pure view logic for the Exchange screen, split out so the trade-button
// rules (when you can buy/sell and why not) are unit-testable.

export const QTY_PRESETS = [1, 5, 10];
export const QTY_CAP = 99;

export function flashDirection(prevPrice, nextPrice) {
  if (typeof prevPrice !== 'number' || typeof nextPrice !== 'number') return null;
  if (nextPrice > prevPrice) return 'up';
  if (nextPrice < prevPrice) return 'down';
  return null;
}

// The most shares the confirm button may submit for a side.
export function maxTradable(side, { balance = 0, price = 1, shares = 0 } = {}) {
  if (side === 'sell') return Math.max(0, Math.min(shares, QTY_CAP));
  const affordable = price > 0 ? Math.floor(balance / price) : 0;
  return Math.max(0, Math.min(affordable, QTY_CAP));
}

export function clampQty(qty) {
  return Math.max(1, Math.min(QTY_CAP, Math.floor(Number(qty) || 1)));
}

// Why the confirm button is (or isn't) tappable. Always returns a reason
// string when blocked so the UI never shows a silently dead button.
export function canTrade(side, qty, { balance = 0, price = 1, shares = 0, buysLeftToday = 1 } = {}) {
  if (side === 'sell') {
    if (shares <= 0) return { ok: false, reason: 'You don’t hold any shares yet — buy some first' };
    if (qty > shares) return { ok: false, reason: `You only hold ${shares} share${shares === 1 ? '' : 's'} — try Max` };
    return { ok: true, reason: null };
  }
  if (buysLeftToday <= 0) return { ok: false, reason: 'Buys are tapped out today — sells still open' };
  const total = price * qty;
  if (total > balance) {
    return { ok: false, reason: `Not enough coins — need Ȳ${(total - balance).toLocaleString()} more` };
  }
  return { ok: true, reason: null };
}

export function confirmLabel(side, qty, tickerId, total) {
  const verb = side === 'buy' ? 'Buy' : 'Sell';
  return `${verb} ${qty} $${tickerId} · Ȳ${Math.round(total).toLocaleString()}`;
}

// Unrealized P/L for a holding, used for the live position line.
export function positionGain(shares, avgCost, price) {
  if (shares <= 0) return 0;
  return shares * (price - avgCost);
}
