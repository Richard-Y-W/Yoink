// Guest-first auth. Every player gets an account + session token on first
// launch (no signup wall); claiming attaches a username + password so the
// same progress can be reached from other devices. Tokens are random and
// stored hashed — a leaked database doesn't leak live sessions.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD = 8;
const SCRYPT_KEYLEN = 64;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function hashPassword(password, salt = randomBytes(16)) {
  const key = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, keyHex] = String(stored ?? '').split(':');
  if (!saltHex || !keyHex) return false;
  const key = scryptSync(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN);
  const expected = Buffer.from(keyHex, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function createAuth(db) {
  const insertUser = db.prepare('INSERT INTO users (username, pass_hash, created_at) VALUES (?, ?, ?)');
  const userById = db.prepare('SELECT * FROM users WHERE id = ?');
  const userByName = db.prepare('SELECT * FROM users WHERE username = ?');
  const setCredentials = db.prepare('UPDATE users SET username = ?, pass_hash = ? WHERE id = ?');
  const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)');
  const sessionByHash = db.prepare('SELECT * FROM sessions WHERE token_hash = ?');
  const touchSession = db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?');
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');

  const publicUser = (row) => ({
    id: row.id,
    username: row.username,
    guest: row.username == null,
  });

  const startSession = (userId, now) => {
    const token = randomBytes(32).toString('hex');
    insertSession.run(hashToken(token), userId, now, now);
    return token;
  };

  const createGuest = (now = Date.now()) => {
    const { lastInsertRowid } = insertUser.run(null, null, now);
    const user = userById.get(lastInsertRowid);
    return { ok: true, user: publicUser(user), token: startSession(user.id, now) };
  };

  const validateCredentials = (username, password) => {
    const name = String(username ?? '').trim().toLowerCase();
    if (!USERNAME_RE.test(name)) {
      return { error: 'Username must be 3–20 letters, numbers, or underscores' };
    }
    if (String(password ?? '').length < MIN_PASSWORD) {
      return { error: `Password needs at least ${MIN_PASSWORD} characters` };
    }
    return { name, password: String(password) };
  };

  // Attach username + password to a guest account, keeping its progress.
  const claim = (userId, username, password) => {
    const user = userById.get(userId);
    if (!user) return { ok: false, error: 'Unknown account' };
    if (user.username != null) return { ok: false, error: 'This account is already claimed' };
    const checked = validateCredentials(username, password);
    if (checked.error) return { ok: false, error: checked.error };
    if (userByName.get(checked.name)) return { ok: false, error: 'That username is taken' };
    setCredentials.run(checked.name, hashPassword(checked.password), userId);
    return { ok: true, user: publicUser(userById.get(userId)) };
  };

  const login = (username, password, now = Date.now()) => {
    const name = String(username ?? '').trim().toLowerCase();
    const user = userByName.get(name);
    // Same error either way — don't reveal which usernames exist.
    if (!user || !verifyPassword(String(password ?? ''), user.pass_hash)) {
      return { ok: false, error: 'Wrong username or password' };
    }
    return { ok: true, user: publicUser(user), token: startSession(user.id, now) };
  };

  const logout = (token) => {
    deleteSession.run(hashToken(String(token ?? '')));
    return { ok: true };
  };

  const userForToken = (token, now = Date.now()) => {
    if (!token) return null;
    const tokenHash = hashToken(String(token));
    const session = sessionByHash.get(tokenHash);
    if (!session) return null;
    if (now - session.last_seen > 60 * 1000) touchSession.run(now, tokenHash);
    const user = userById.get(session.user_id);
    return user ? publicUser(user) : null;
  };

  return { createGuest, claim, login, logout, userForToken };
}
