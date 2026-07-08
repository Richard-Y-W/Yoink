import assert from 'node:assert/strict';
import test from 'node:test';
import { openDb } from './db.js';
import { createAuth } from './auth.js';

const makeAuth = () => createAuth(openDb(':memory:'));

test('guest account is created instantly and token resolves back to it', () => {
  const auth = makeAuth();
  const guest = auth.createGuest();
  assert.equal(guest.ok, true);
  assert.equal(guest.user.guest, true);
  assert.equal(guest.user.username, null);
  assert.equal(typeof guest.token, 'string');
  assert.equal(guest.token.length, 64);

  const resolved = auth.userForToken(guest.token);
  assert.equal(resolved.id, guest.user.id);
  assert.equal(auth.userForToken('deadbeef'), null);
  assert.equal(auth.userForToken(null), null);
});

test('claiming keeps the same account and enables login from elsewhere', () => {
  const auth = makeAuth();
  const guest = auth.createGuest();

  const claimed = auth.claim(guest.user.id, 'Richard_W', 'super-secret-1');
  assert.equal(claimed.ok, true);
  assert.equal(claimed.user.username, 'richard_w', 'usernames normalize to lowercase');
  assert.equal(claimed.user.guest, false);
  assert.equal(claimed.user.id, guest.user.id, 'progress stays on the same user');

  const login = auth.login('RICHARD_W', 'super-secret-1');
  assert.equal(login.ok, true);
  assert.equal(login.user.id, guest.user.id);
  assert.notEqual(login.token, guest.token, 'fresh session per login');

  const bad = auth.login('richard_w', 'wrong-password');
  assert.equal(bad.ok, false);
  const ghost = auth.login('nobody_here', 'super-secret-1');
  assert.equal(ghost.error, bad.error, 'login errors do not reveal which usernames exist');
});

test('claim validates username, password, uniqueness, and single claim', () => {
  const auth = makeAuth();
  const a = auth.createGuest();
  const b = auth.createGuest();

  assert.equal(auth.claim(a.user.id, 'x', 'super-secret-1').ok, false, 'too-short username');
  assert.equal(auth.claim(a.user.id, 'has space', 'super-secret-1').ok, false, 'invalid chars');
  assert.equal(auth.claim(a.user.id, 'valid_name', 'short').ok, false, 'weak password');

  assert.equal(auth.claim(a.user.id, 'valid_name', 'super-secret-1').ok, true);
  assert.equal(auth.claim(b.user.id, 'valid_name', 'other-secret-2').ok, false, 'username taken');
  assert.equal(auth.claim(a.user.id, 'another_name', 'super-secret-1').ok, false, 'already claimed');
});

test('logout invalidates the session token', () => {
  const auth = makeAuth();
  const guest = auth.createGuest();
  assert.ok(auth.userForToken(guest.token));
  auth.logout(guest.token);
  assert.equal(auth.userForToken(guest.token), null);
});
