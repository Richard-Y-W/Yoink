import { getDecoratedDropListingById, stripe } from './data.js';

const FALLBACK_STRIPE = stripe('#E9DEFF', '#D6C2FF');

function quantityOf(item) {
  return Math.max(1, Math.floor(Number(item?.quantity) || 1));
}

function acquiredAtOf(item) {
  const value = Number(item?.acquiredAt) || 0;
  return Number.isFinite(value) ? value : 0;
}

export function isPocketHoloItem(item) {
  const id = String(item?.id ?? '');
  const title = String(item?.title ?? item?.name ?? '').toLowerCase();
  const catalog = getDecoratedDropListingById(id);
  return catalog?.family === 'Holo Finds'
    || id.startsWith('drop-holo-finds-')
    || title.includes('foil card')
    || title.includes('sticker slab');
}

export function makePocketHoloItems(collection = []) {
  const grouped = new Map();

  for (const item of Array.isArray(collection) ? collection : []) {
    if (!isPocketHoloItem(item)) continue;
    const id = String(item.id ?? item.title ?? 'holo-find');
    const existing = grouped.get(id);
    const catalog = getDecoratedDropListingById(id);
    const quantity = quantityOf(item);
    const acquiredAt = acquiredAtOf(item);

    const next = {
      ...(catalog ?? {}),
      id,
      name: catalog?.name ?? item.title ?? item.name ?? 'Holo Find',
      title: item.title ?? catalog?.name ?? 'Holo Find',
      family: catalog?.family ?? 'Holo Finds',
      rarity: catalog?.rarity ?? 'Rare',
      seller: item.seller ?? catalog?.seller ?? 'foil_friends',
      price: catalog?.price ?? item.unitPrice ?? 0,
      unitPrice: Number(item.unitPrice ?? catalog?.price ?? 0) || 0,
      imageUrl: item.imageUrl || catalog?.imageUrl || '',
      imageStripe: item.imageStripe || catalog?.stripe || FALLBACK_STRIPE,
      stripe: catalog?.stripe || item.imageStripe || FALLBACK_STRIPE,
      editionLabel: catalog?.editionLabel ?? 'Pocket edition',
      stockLabel: catalog?.stockLabel ?? '',
      traits: catalog?.traits ?? [],
      quantity,
      ownedLabel: `owned ${quantity}`,
      acquiredAt,
      interactive3d: true,
    };

    if (existing) {
      existing.quantity += quantity;
      existing.ownedLabel = `owned ${existing.quantity}`;
      existing.acquiredAt = Math.max(existing.acquiredAt, acquiredAt);
    } else {
      grouped.set(id, next);
    }
  }

  return [...grouped.values()].sort((a, b) => b.acquiredAt - a.acquiredAt || a.name.localeCompare(b.name));
}
