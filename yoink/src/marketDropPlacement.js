export function findRareDropInsertIndex(items, getRect, {
  viewportHeight = 0,
  topGuard = 0,
  fallbackIndex = 3,
} = {}) {
  const list = Array.isArray(items) ? items : [];
  const fallback = Math.min(Math.max(0, fallbackIndex), list.length);
  if (list.length === 0 || typeof getRect !== 'function') return fallback;

  const viewBottom = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 0;
  const guardedTop = Number.isFinite(topGuard) ? Math.max(0, topGuard) : 0;

  for (let index = 0; index < list.length; index += 1) {
    const rect = getRect(list[index], index);
    const top = Number(rect?.top);
    const bottom = Number(rect?.bottom);
    if (!Number.isFinite(top) || !Number.isFinite(bottom)) continue;
    if (bottom > guardedTop && (viewBottom === 0 || top < viewBottom)) {
      return Math.min(index + 1, list.length);
    }
  }

  return fallback;
}
