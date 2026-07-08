import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const notificationUrl = new URL('./notificationFeedback.js', import.meta.url);
const expoAppSource = readFileSync(new URL('../../yoink-expo/App.js', import.meta.url), 'utf8');
const expoAppConfigSource = readFileSync(new URL('../../yoink-expo/app.json', import.meta.url), 'utf8');
const expoPackageSource = readFileSync(new URL('../../yoink-expo/package.json', import.meta.url), 'utf8');

test('app surfaces daily rewards and a transparent bonus coin flow from the wallet chip', () => {
  assert.match(appSource, /claimAllowance/);
  assert.match(appSource, /spinWheel/);
  assert.match(appSource, /CoinRewardsSheet/);
  assert.match(appSource, /Claim daily coins/);
  assert.match(appSource, /Have some on us/);
  assert.match(appSource, /handleClaimDaily/);
  assert.match(appSource, /handleClaimBonus/);
});

test('web app sends native notification requests for rewards and delivery events', () => {
  assert.equal(existsSync(notificationUrl), true, 'missing notification bridge');
  const notificationSource = readFileSync(notificationUrl, 'utf8');

  assert.match(notificationSource, /type: 'notification'/);
  assert.match(notificationSource, /emitNativeNotification/);
  assert.match(appSource, /emitNativeNotification/);
  assert.match(appSource, /Daily Yoink coins/);
  assert.match(appSource, /Delivery update/);
});

test('expo shell handles Yoink notification messages through expo-notifications', () => {
  assert.match(expoPackageSource, /"expo-notifications"/);
  assert.match(expoAppSource, /expo-notifications/);
  assert.match(expoAppSource, /Notifications\.setNotificationHandler/);
  assert.match(expoAppSource, /Notifications\.requestPermissionsAsync/);
  assert.match(expoAppSource, /Notifications\.scheduleNotificationAsync/);
  assert.match(expoAppSource, /type === 'notification'/);
  assert.match(expoAppConfigSource, /"expo-notifications"/);
});
