// Pure view logic for The Bell UI: countdown formatting and floor-sell
// button rules, split out so they're unit-testable.

export function fmtClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function fmtWait(ms) {
  const total = Math.max(0, Math.floor(ms / 60000));
  if (total < 1) return 'under a minute';
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function bellLabel(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Why the floor-sell button is (or isn't) tappable.
export function canFloorSell(qty, { own = 0, sellsLeft = 0 } = {}) {
  if (own <= 0) return { ok: false, reason: 'You don’t own this yet — buy it first' };
  if (sellsLeft <= 0) return { ok: false, reason: 'Sell slots used this session — back next bell' };
  if (qty > own) return { ok: false, reason: `You only have ${own}` };
  if (qty > sellsLeft) return { ok: false, reason: `Only ${sellsLeft} sell slot${sellsLeft === 1 ? '' : 's'} left this session` };
  return { ok: true, reason: null };
}

// Why the floor-buy button is (or isn't) tappable.
export function canFloorBuy(qty, { balance = 0, ask = 1, buysLeft = 0 } = {}) {
  if (buysLeft <= 0) return { ok: false, reason: 'Buy slots used this session — back next bell' };
  if (qty > buysLeft) return { ok: false, reason: `Only ${buysLeft} buy slot${buysLeft === 1 ? '' : 's'} left this session` };
  const total = ask * qty;
  if (total > balance) {
    return { ok: false, reason: `Not enough coins — need Ȳ${(total - balance).toLocaleString()} more` };
  }
  return { ok: true, reason: null };
}

// Client-side preview of a floor sale at the live market price; the server
// recomputes exactly.
export function estFloorSale(marketPrice, qty, feePct = 0.05) {
  const unit = Math.max(1, Math.round(marketPrice));
  const gross = unit * qty;
  const fee = Math.round(gross * feePct);
  return { unit, gross, fee, net: gross - fee };
}
