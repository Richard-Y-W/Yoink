export function findScreenScrollContainer(startNode) {
  let node = startNode?.parentElement ?? null;

  while (node) {
    const classListMatch = node.classList?.contains?.('ynoscroll');
    const overflowY = typeof getComputedStyle === 'function'
      ? getComputedStyle(node).overflowY
      : node._overflowY;

    if (classListMatch || overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }

  return null;
}

export function scrollToScreenTop(startNode) {
  const container = findScreenScrollContainer(startNode);
  if (!container) return false;

  container.scrollTop = 0;
  if (typeof container.scrollTo === 'function') {
    container.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  return true;
}
