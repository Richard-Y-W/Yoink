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
  if (own <= 0) return { ok: false, reason: 'You don’t own this yet — it’s in the shop' };
  if (sellsLeft <= 0) return { ok: false, reason: 'Floor cap reached this session — back next bell' };
  if (qty > own) return { ok: false, reason: `You only have ${own}` };
  if (qty > sellsLeft) return { ok: false, reason: `Only ${sellsLeft} floor slot${sellsLeft === 1 ? '' : 's'} left this session` };
  return { ok: true, reason: null };
}

// Client-side preview of a floor sale; the server recomputes exactly.
export function estFloorSale(unitPrice, multPct, qty, feePct = 0.05) {
  const unit = Math.max(1, Math.round(unitPrice * (1 + multPct / 100)));
  const gross = unit * qty;
  const fee = Math.round(gross * feePct);
  return { unit, gross, fee, net: gross - fee };
}
