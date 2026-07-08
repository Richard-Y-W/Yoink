export const WATCHED_LISTINGS_STORAGE_KEY = 'yoink-watched-listings';

function validListing(listing) {
  return listing && typeof listing === 'object' && listing.id !== undefined && listing.id !== null;
}

export function watchedListingIds(watchedListings = []) {
  return watchedListings.filter(validListing).map((listing) => listing.id);
}

export function toggleWatchedListing(watchedListings = [], listing) {
  if (!validListing(listing)) return watchedListings;

  const exists = watchedListings.some((item) => item.id === listing.id);
  if (exists) return watchedListings.filter((item) => item.id !== listing.id);
  return [listing, ...watchedListings];
}

export function serializeWatchedListings(watchedListings = []) {
  return JSON.stringify(watchedListings.filter(validListing));
}

export function parseWatchedListings(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(validListing) : [];
  } catch {
    return [];
  }
}
