// The hub is the multi-user face of the store: auth plus one game store
// per user, all persisted in SQLite. Game state stays a JSON blob per
// user (the store logic is plain objects), while `shared.flow` — the
// player impact on the market tape — is one global object, so everyone
// trades the same market.

import { createAuth } from './auth.js';
import { createStore } from './store.js';

export function createHub({ db, random = Math.random } = {}) {
  const auth = createAuth(db);
  const selectState = db.prepare('SELECT json FROM user_state WHERE user_id = ?');
  const upsertState = db.prepare(
    'INSERT INTO user_state (user_id, json) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET json = excluded.json',
  );
  const selectShared = db.prepare('SELECT json FROM shared_state WHERE id = 1');
  const upsertShared = db.prepare(
    'INSERT INTO shared_state (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json',
  );

  const sharedRow = selectShared.get();
  const shared = sharedRow ? JSON.parse(sharedRow.json) : {};
  if (!Array.isArray(shared.flow)) shared.flow = [];

  // One live store per user for the process lifetime; state is small
  // (wallet + orders + collection) so memory stays trivial per player.
  const stores = new Map();

  const storeFor = (userId) => {
    let store = stores.get(userId);
    if (!store) {
      const row = selectState.get(userId);
      store = createStore({
        state: row ? JSON.parse(row.json) : null,
        random,
        shared,
        persist: (data) => {
          upsertState.run(userId, JSON.stringify(data));
          upsertShared.run(JSON.stringify(shared));
        },
      });
      stores.set(userId, store);
    }
    return store;
  };

  return { auth, storeFor };
}
