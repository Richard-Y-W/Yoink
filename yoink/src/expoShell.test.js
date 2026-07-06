import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readRepoFile(path) {
  try {
    return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  } catch {
    return '';
  }
}

const expoAppSource = readRepoFile('yoink-expo/App.js');
const expoPackageSource = readRepoFile('yoink-expo/package.json');
const expoReadmeSource = readRepoFile('yoink-expo/README.md');
const iosDeviceSource = readFileSync(new URL('./components/IOSDevice.jsx', import.meta.url), 'utf8');

test('expo shell wraps the local market app in a WebView', () => {
  assert.match(expoAppSource, /react-native-webview/);
  assert.match(expoAppSource, /EXPO_PUBLIC_YOINK_URL/);
  assert.match(expoAppSource, /<WebView/);
  assert.match(expoAppSource, /source=\{\{ uri: MARKET_URL \}\}/);
  assert.match(expoAppSource, /shell=expo/);
});

test('expo shell mode removes the desktop phone frame inside WebView', () => {
  assert.match(iosDeviceSource, /shell'\) === 'expo'/);
  assert.match(iosDeviceSource, /frameless/);
  assert.match(iosDeviceSource, /height: '100vh'/);
});

test('expo shell maps Yoink haptic messages to native iPhone feedback', () => {
  assert.match(expoAppSource, /expo-haptics/);
  assert.match(expoAppSource, /onMessage/);
  assert.match(expoAppSource, /source === 'yoink'/);
  assert.match(expoAppSource, /type === 'haptic'/);
  assert.match(expoAppSource, /ImpactFeedbackStyle\.Light/);
  assert.match(expoAppSource, /NotificationFeedbackType\.Success/);
  assert.match(expoAppSource, /selectionAsync/);
});

test('expo package and readme document Expo Go iPhone setup', () => {
  assert.match(expoPackageSource, /"expo"/);
  assert.match(expoPackageSource, /"expo-haptics"/);
  assert.match(expoPackageSource, /"react-native-webview"/);
  assert.match(expoReadmeSource, /Expo Go/);
  assert.match(expoReadmeSource, /npm run dev -- --host 0\.0\.0\.0/);
  assert.match(expoReadmeSource, /ipconfig getifaddr en0/);
});
