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
const appSource = readRepoFile('yoink/src/App.jsx');
const appScrollSource = readRepoFile('yoink/src/appScroll.js');
const indexHtmlSource = readRepoFile('yoink/index.html');
const expoPackageSource = readRepoFile('yoink-expo/package.json');
const expoReadmeSource = readRepoFile('yoink-expo/README.md');
const expoGuardSource = readRepoFile('yoink-expo/scripts/guard-start.js');
const viteConfigSource = readRepoFile('yoink/vite.config.js');
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
  assert.match(iosDeviceSource, /height: '100dvh'/);
});

test('expo shell uses the native iPhone viewport, not desktop preview padding', () => {
  assert.match(indexHtmlSource, /viewport-fit=cover/);
  assert.match(appSource, /yoink-app-shell--native/);
  assert.match(appSource, /width:100%/);
  assert.match(appSource, /min-height:100dvh/);
  assert.match(appSource, /padding:0/);
  assert.match(iosDeviceSource, /yoink-native-viewport/);
  assert.match(iosDeviceSource, /width: '100%'/);
  assert.match(iosDeviceSource, /height: '100dvh'/);
  assert.match(expoAppSource, /SafeAreaView/);
  assert.match(expoAppSource, /styles\.safeArea/);
  assert.match(expoAppSource, /bounces/);
  assert.doesNotMatch(expoAppSource, /bounces=\{false\}/);
  assert.match(appSource, /overflow:visible/);
  assert.match(iosDeviceSource, /overflow: 'visible'/);
  assert.match(appScrollSource, /window\.scrollTo/);
  assert.doesNotMatch(iosDeviceSource, /className="ynoscroll yoink-native-viewport"/);
  assert.doesNotMatch(iosDeviceSource, /safe-area-inset/);
  assert.doesNotMatch(iosDeviceSource, /height: '100vh'/);
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

test('expo shell targets the older iPhone-compatible SDK 54 runtime', () => {
  assert.match(expoPackageSource, /"expo": "~54\./);
  assert.match(expoPackageSource, /"expo-haptics": "~15\./);
  assert.match(expoPackageSource, /"expo-status-bar": "~3\./);
  assert.match(expoPackageSource, /"react-native": "0\.81\./);
  assert.doesNotMatch(expoPackageSource, /"expo": "~57\./);
  assert.doesNotMatch(expoPackageSource, /"expo": "~55\./);
  assert.match(expoReadmeSource, /SDK 54/);
});

test('expo start is guarded against missing env and occupied ports', () => {
  assert.match(expoPackageSource, /"start": "node scripts\/guard-start\.js && expo start --port 8084 --lan --clear"/);
  assert.match(expoPackageSource, /"check:ports": "node scripts\/guard-start\.js --check-only"/);
  assert.match(expoGuardSource, /EXPO_PUBLIC_YOINK_URL/);
  assert.match(expoGuardSource, /expectedExpoPort = 8084/);
  assert.match(expoGuardSource, /EADDRINUSE/);
  assert.match(expoGuardSource, /server\.listen/);
  assert.match(expoGuardSource, /new URL\(webUrl\)/);
  assert.match(expoGuardSource, /127\.0\.0\.1/);
});

test('vite dev server is locked to the Expo web port', () => {
  assert.match(viteConfigSource, /host: '0\.0\.0\.0'/);
  assert.match(viteConfigSource, /port: 5173/);
  assert.match(viteConfigSource, /strictPort: true/);
});
